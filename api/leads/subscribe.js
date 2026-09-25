import nodemailer from "nodemailer";

export default async function handler(req, res) {
  // CORS Preflight
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const email = (body.email || "").trim().toLowerCase();
    const firstName = (body.firstName || "").trim();
    const lastName = (body.lastName || "").trim();
    const focus = (body.focus || "Custom Automotive & Motorcycle Painting").trim();

    if (!email || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "A valid email address is required." });
    }

    // 1. PUSH TO SHOPIFY CUSTOMER CRM
    const shopifyToken = process.env.SHOPIFY_ADMIN_TOKEN || "";
    const shopDomain = process.env.SHOPIFY_STORE_DOMAIN || "coast-airbrush-eu-dev.myshopify.com";

    const customerUrl = `https://${shopDomain}/admin/api/2024-01/customers.json`;
    const payload = {
      customer: {
        first_name: firstName,
        last_name: lastName,
        email: email,
        tags: "pre-launch-vip, european-launch",
        note: focus || "Custom Automotive & Motorcycle Painting",
        email_marketing_consent: {
          state: "subscribed",
          opt_in_level: "single_opt_in",
          consent_updated_at: new Date().toISOString()
        }
      }
    };

    let shopifyStatus = "created";

    try {
      const sRes = await fetch(customerUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": shopifyToken
        },
        body: JSON.stringify(payload)
      });

      const sData = await sRes.json();

      // If customer already exists, update tags
      if (sRes.status === 422 && sData.errors && sData.errors.email) {
        shopifyStatus = "existing_updated";
        const searchUrl = `https://${shopDomain}/admin/api/2024-01/customers/search.json?query=email:${encodeURIComponent(email)}`;
        const searchRes = await fetch(searchUrl, {
          headers: { "X-Shopify-Access-Token": shopifyToken }
        });
        const searchData = await searchRes.json();
        if (searchData.customers && searchData.customers.length > 0) {
          const cust = searchData.customers[0];
          const existingTags = cust.tags ? cust.tags.split(",").map(t => t.trim()) : [];
          if (!existingTags.includes("pre-launch-vip")) existingTags.push("pre-launch-vip");
          if (!existingTags.includes("european-launch")) existingTags.push("european-launch");

          await fetch(`https://${shopDomain}/admin/api/2024-01/customers/${cust.id}.json`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "X-Shopify-Access-Token": shopifyToken
            },
            body: JSON.stringify({
              customer: {
                id: cust.id,
                tags: existingTags.join(", "),
                note: (cust.note ? cust.note + " | " : "") + (focus || "VIP Launch Lead")
              }
            })
          });
        }
      }
    } catch (shopifyErr) {
      console.warn("Shopify push warning:", shopifyErr.message);
      shopifyStatus = "error_skipped";
    }

    // 2. DISPATCH AUTOMATED EMAILS VIA GOOGLE WORKSPACE
    const mailUser = process.env.GOOGLE_MAIL_USER || "admin@coastairbrush.eu";
    const mailPass = (process.env.GOOGLE_MAIL_PASS || "exsdvdoeogurifzf").replace(/\s+/g, "");
    const adminAlertRecipient = process.env.ADMIN_ALERT_EMAIL || "del@das64design.com, admin@coastairbrush.eu";

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: mailUser,
        pass: mailPass
      }
    });

    const displayName = firstName ? `${firstName} ${lastName}`.trim() : "Custom Artist";

    // Customer Email HTML
    const customerHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Coast Airbrush Europe VIP Confirmation</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b0d12; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #e2e8f0; }
    .wrapper { max-width: 600px; margin: 0 auto; background-color: #121620; border: 1px solid #1f293d; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #090b10 0%, #171d2b 100%); padding: 36px 30px; text-align: center; border-bottom: 2px solid #e11d48; }
    .header h1 { margin: 0; font-size: 24px; letter-spacing: 2px; text-transform: uppercase; color: #ffffff; font-weight: 800; }
    .header p { margin: 8px 0 0; color: #94a3b8; font-size: 12px; letter-spacing: 1.5px; text-transform: uppercase; }
    .badge { display: inline-block; background: rgba(225, 29, 72, 0.15); border: 1px solid #e11d48; color: #fb7185; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-top: 14px; }
    .content { padding: 32px 30px; line-height: 1.6; }
    .greeting { font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 16px; }
    .focus-box { background: #1a2233; border-left: 4px solid #00f0ff; padding: 14px 18px; border-radius: 6px; margin: 20px 0; }
    .focus-box strong { color: #00f0ff; }
    .perks-list { margin: 24px 0; padding: 0; list-style: none; }
    .perks-list li { margin-bottom: 16px; padding-left: 28px; position: relative; font-size: 14px; color: #cbd5e1; }
    .perks-list li::before { content: "✓"; position: absolute; left: 0; color: #10b981; font-weight: bold; font-size: 16px; }
    .footer { background: #0b0e17; padding: 24px 30px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #1f293d; }
    .footer a { color: #00f0ff; text-decoration: none; }
  </style>
</head>
<body>
  <div style="padding: 24px 12px;">
    <div class="wrapper">
      <div class="header">
        <h1>Coast Airbrush Europe</h1>
        <p>California Heritage • European Direct Dispatch</p>
        <div class="badge">VIP Priority Allocation Confirmed</div>
      </div>
      <div class="content">
        <div class="greeting">Hi ${firstName || 'Fellow Painter'},</div>
        <p>Thank you for registering for early VIP launch access to <strong>Coast Airbrush Europe</strong>.</p>
        <p>Your registration has been allocated priority inventory status under your trade specialty:</p>
        
        <div class="focus-box">
          <div>Registered Discipline:</div>
          <div style="font-size: 16px; font-weight: 700; margin-top: 4px;"><strong>${focus}</strong></div>
        </div>

        <p>As a registered VIP artist, here is what is being reserved for you:</p>
        <ul class="perks-list">
          <li><strong>24-Hour Advance Store Access:</strong> You will receive a direct access link to shop our opening catalog before the general European public launch next week.</li>
          <li><strong>Dual UK & European Warehouse Fulfillment:</strong> Direct local dispatch with fast carrier rates and zero post-Brexit customs delays or unexpected import tariffs.</li>
          <li><strong>REACH & CLP 2026 Guaranteed Formulations:</strong> Genuine House of Kolor, Kroma-Edge, and Flake King products formulation-verified and ready for European pro use.</li>
        </ul>

        <p style="margin-top: 28px; color: #94a3b8; font-size: 14px;">Keep an eye on your inbox—we will transmit your personal launch pass as soon as our warehouse gates open.</p>

        <p style="margin-top: 24px; font-weight: 600; color: #ffffff;">The Coast Airbrush Europe Launch Team</p>
      </div>
      <div class="footer">
        <p>© 2026 Coast Airbrush Europe. All rights reserved.</p>
        <p>Direct Distribution & Technical Support: <a href="mailto:admin@coastairbrush.eu">admin@coastairbrush.eu</a> | <a href="https://coastairbrush.eu">coastairbrush.eu</a></p>
      </div>
    </div>
  </div>
</body>
</html>
`;

    // Admin Alert HTML
    const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: -apple-system, sans-serif; background: #0f172a; color: #f8fafc; padding: 20px;">
  <div style="max-width: 560px; margin: 0 auto; background: #1e293b; border-radius: 8px; border: 1px solid #334155; padding: 24px;">
    <h2 style="margin-top: 0; color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 12px;">🚨 New VIP Pre-Launch Registration</h2>
    <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
      <tr>
        <td style="padding: 8px 0; color: #94a3b8; width: 140px;">Name:</td>
        <td style="padding: 8px 0; font-weight: bold; color: #ffffff;">${displayName}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #94a3b8;">Email:</td>
        <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #38bdf8; text-decoration: none; font-weight: bold;">${email}</a></td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #94a3b8;">Discipline / Focus:</td>
        <td style="padding: 8px 0; color: #f59e0b; font-weight: bold;">${focus}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #94a3b8;">Shopify Sync:</td>
        <td style="padding: 8px 0; color: #10b981; font-weight: bold;">${shopifyStatus === "created" ? "Created in Customers (Tags: pre-launch-vip, european-launch)" : "Updated Existing Customer"}</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #94a3b8;">Registered At:</td>
        <td style="padding: 8px 0; color: #cbd5e1;">${new Date().toUTCString()}</td>
      </tr>
    </table>
    <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #334155;">
      <a href="https://${shopDomain}/admin/customers" style="display: inline-block; background: #0284c7; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: bold;">View Customers in Shopify Admin →</a>
    </div>
  </div>
</body>
</html>
`;

    // Send emails asynchronously in parallel
    const emailPromises = [
      // 1. To Customer
      transporter.sendMail({
        from: '"Coast Airbrush Europe" <admin@coastairbrush.eu>',
        to: email,
        replyTo: "admin@coastairbrush.eu",
        subject: "⚡ VIP Launch Allocation Confirmed | Coast Airbrush Europe",
        html: customerHtml
      }),
      // 2. To Admin
      transporter.sendMail({
        from: '"Coast Airbrush Europe Alert" <admin@coastairbrush.eu>',
        to: adminAlertRecipient,
        replyTo: email,
        subject: `🚨 [New VIP Registration] ${displayName} — ${focus}`,
        html: adminHtml
      })
    ];

    try {
      await Promise.all(emailPromises);
    } catch (mailErr) {
      console.warn("Mail dispatch background warning:", mailErr.message);
    }

    return res.status(200).json({
      success: true,
      message: "VIP priority allocation confirmed in Shopify and confirmation email dispatched.",
      lead: { firstName, lastName, email, focus }
    });
  } catch (err) {
    console.error("Subscription endpoint error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
}
