import nodemailer from "nodemailer";
import fs from "fs";

const mailUser = process.env.GOOGLE_MAIL_USER || "admin@coastairbrush.eu";
const mailPass = (process.env.GOOGLE_MAIL_PASS || "exsdvdoeogurifzf").replace(/\s+/g, "");

const agreementPath = "/Users/derekstainton/.gemini/antigravity/brain/a9951dd9-1baa-4944-aec3-117d208fbdb3/coast_airbrush_europe_profit_share_agreement.md";
const markdownContent = fs.readFileSync(agreementPath, "utf-8");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: mailUser,
    pass: mailPass
  }
});

// Convert markdown to clean HTML email
function markdownToHtml(md) {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 style="color: #0f172a; margin-top: 24px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2 style="color: #0f172a; margin-top: 32px; border-bottom: 2px solid #e11d48; padding-bottom: 8px;">$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1 style="color: #0f172a; font-size: 24px; margin-bottom: 8px;">$1</h1>');

  // Bold & Italic
  html = html.replace(/\*\*\*(.*?)\*\*\*/gim, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
  html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');

  // Code inline
  html = html.replace(/`([^`]+)`/gim, '<code style="background-color: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 13px; color: #b91c1c;">$1</code>');

  // Formula block / math
  html = html.replace(/\$\$(.*?)\$\$/gim, '<div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; margin: 16px 0; font-family: monospace; font-size: 14px; color: #1e293b;">$1</div>');
  html = html.replace(/\$(.*?)\$/gim, '<span style="font-family: monospace; background: #f8fafc; padding: 2px 4px;">$1</span>');

  // Horizontal rules
  html = html.replace(/^---$/gim, '<hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />');

  // Lists
  html = html.replace(/^\* (.*$)/gim, '<li style="margin-bottom: 6px;">$1</li>');
  html = html.replace(/^([0-9]+)\. (.*$)/gim, '<li style="margin-bottom: 6px;">$2</li>');

  // Paragraphs
  const lines = html.split('\n\n');
  return lines.map(p => {
    p = p.trim();
    if (!p) return '';
    if (p.startsWith('<h') || p.startsWith('<hr') || p.startsWith('<div') || p.startsWith('<li')) {
      return p;
    }
    return `<p style="margin: 12px 0; line-height: 1.6; color: #334155;">${p}</p>`;
  }).join('\n');
}

const formattedBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Heads of Terms - Coast Airbrush Europe</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px;">
  <div style="max-width: 780px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <div style="background: linear-gradient(135deg, #090b10 0%, #171d2b 100%); padding: 32px; border-bottom: 3px solid #e11d48; color: #ffffff;">
      <h2 style="margin: 0; font-size: 20px; letter-spacing: 1px; color: #ffffff; text-transform: uppercase;">Coast Airbrush Europe</h2>
      <p style="margin: 8px 0 0; color: #94a3b8; font-size: 13px;">Commercial Agreement & Partnership Documentation</p>
    </div>
    <div style="padding: 36px 32px;">
      <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; border-radius: 4px; margin-bottom: 28px;">
        <strong style="color: #1d4ed8; font-size: 14px;">Documentation Notice:</strong>
        <p style="margin: 4px 0 0; font-size: 13px; color: #1e40af; line-height: 1.5;">
          This agreement document has been prepared for <strong>DAS64 Ltd</strong> (Derek Stainton) and <strong>T5 Product Distribution</strong> (Ryan). A full copy is attached to this email.
        </p>
      </div>

      ${markdownToHtml(markdownContent)}

    </div>
    <div style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">
      Coast Airbrush Europe &bull; Secure Digital Archive &bull; <a href="https://coastairbrush.eu" style="color: #e11d48; text-decoration: none;">coastairbrush.eu</a>
    </div>
  </div>
</body>
</html>
`;

async function main() {
  console.log("Connecting to Google Workspace SMTP via user:", mailUser);
  const info = await transporter.sendMail({
    from: `"Coast Airbrush Europe" <${mailUser}>`,
    to: "admin@coastairbrush.eu",
    subject: "📋 Heads of Terms & Commercial Profit-Share Agreement - Coast Airbrush Europe & T5",
    text: markdownContent,
    html: formattedBody,
    attachments: [
      {
        filename: "coast_airbrush_europe_profit_share_agreement.md",
        path: agreementPath
      }
    ]
  });

  console.log("Email sent successfully!");
  console.log("Message ID:", info.messageId);
  console.log("Response:", info.response);
}

main().catch(err => {
  console.error("Failed to send email:", err);
  process.exit(1);
});
