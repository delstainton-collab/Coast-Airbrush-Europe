import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseJsonBody, sendJson } from "../dataStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "../..");

export async function handleAdminTradeRoutes(req, res, safePath) {
  // GET TRADE APPLICATIONS
  if (req.method === "GET" && safePath === "/api/admin/trade-applications") {
    try {
      const raw = fs.readFileSync(path.join(rootDir, "data", "trade_applications.json"), "utf8");
      sendJson(res, 200, { success: true, applications: JSON.parse(raw) });
      return true;
    } catch (e) {
      sendJson(res, 200, { success: true, applications: [] });
      return true;
    }
  }

  // MANUALLY APPROVE TRADE PARTNER
  if (req.method === "POST" && safePath === "/api/admin/approve-trade") {
    try {
      const { applicationId, assignedRole, customDiscount } = await parseJsonBody(req);
      const appsFile = path.join(rootDir, "data", "trade_applications.json");
      const accsFile = path.join(rootDir, "data", "trade_accounts_secure.json");

      let apps = JSON.parse(fs.readFileSync(appsFile, "utf8"));
      let accounts = JSON.parse(fs.readFileSync(accsFile, "utf8"));

      const app = apps.find(a => a.id === applicationId);
      if (!app) {
        sendJson(res, 404, { success: false, error: "Application not found" });
        return true;
      }

      const role = assignedRole || app.tierDesired || "dealer";
      const isDist = role === "distributor";
      const discount = customDiscount || (isDist ? 0.45 : 0.70);
      const tierLabel = isDist ? "Tier 1: Master Regional Distributor" : "Tier 2: Authorized Trade Dealer";
      const paymentTerms = isDist ? "Net 60 Days / Pallet Allocation" : "Net 30 Days";

      app.status = "approved";
      app.assignedTier = role;
      app.approvedAt = new Date().toISOString();
      fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2));

      let account = accounts.find(a => a.email.toLowerCase() === app.email.toLowerCase());
      if (account) {
        account.approved = true;
        account.approvedAt = new Date().toISOString();
        account.role = role;
        account.tierLabel = tierLabel;
        account.discountMultiplier = discount;
        account.paymentTerms = paymentTerms;
      } else {
        account = {
          id: "acc_" + Date.now(),
          email: app.email,
          password: "Trade2026!",
          company: app.company,
          contactName: app.contactName,
          role: role,
          tierLabel: tierLabel,
          vat: app.vat,
          eori: (app.vat || "") + "000",
          country: app.country,
          currency: app.country && app.country.toLowerCase().includes("uk") ? "GBP" : "EUR",
          discountMultiplier: discount,
          paymentTerms: paymentTerms,
          approved: true,
          approvedAt: new Date().toISOString()
        };
        accounts.push(account);
      }

      fs.writeFileSync(accsFile, JSON.stringify(accounts, null, 2));

      sendJson(res, 200, {
        success: true,
        message: `Commercial account for "${app.company}" successfully approved as ${tierLabel}.`,
        account: {
          email: account.email,
          company: account.company,
          role: account.role,
          tierLabel: account.tierLabel,
          approved: true
        }
      });
      return true;
    } catch (e) {
      sendJson(res, 500, { success: false, error: "Failed to approve partner." });
      return true;
    }
  }

  // REJECT TRADE PARTNER
  if (req.method === "POST" && safePath === "/api/admin/reject-trade") {
    try {
      const { applicationId, reason } = await parseJsonBody(req);
      const appsFile = path.join(rootDir, "data", "trade_applications.json");
      let apps = JSON.parse(fs.readFileSync(appsFile, "utf8"));

      const app = apps.find(a => a.id === applicationId);
      if (app) {
        app.status = "rejected";
        app.rejectionReason = reason || "Compliance verification requirements not met";
        app.rejectedAt = new Date().toISOString();
        fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2));
      }

      sendJson(res, 200, { success: true, message: "Application marked as rejected." });
      return true;
    } catch (e) {
      sendJson(res, 500, { success: false, error: "Failed to reject application." });
      return true;
    }
  }

  // RESET DEMO TRADE APPLICANT
  if (req.method === "POST" && safePath === "/api/admin/reset-demo-trade") {
    try {
      const appsFile = path.join(rootDir, "data", "trade_applications.json");
      const accsFile = path.join(rootDir, "data", "trade_accounts_secure.json");

      let apps = JSON.parse(fs.readFileSync(appsFile, "utf8"));
      let accounts = JSON.parse(fs.readFileSync(accsFile, "utf8"));

      const app = apps.find(a => a.id === "app_demo_01" || a.email.toLowerCase() === "klaus@bavariakustom.de");
      if (app) {
        app.status = "pending_review";
        delete app.assignedTier;
        delete app.approvedAt;
        delete app.rejectionReason;
        delete app.rejectedAt;
        fs.writeFileSync(appsFile, JSON.stringify(apps, null, 2));
      }

      const account = accounts.find(a => a.email.toLowerCase() === "klaus@bavariakustom.de");
      if (account) {
        account.approved = false;
        account.approvedAt = null;
        account.role = "dealer";
        account.tierLabel = "Tier 2: Trade Dealer (Pending Approval)";
        account.paymentTerms = "Pending Compliance Review";
        fs.writeFileSync(accsFile, JSON.stringify(accounts, null, 2));
      }

      sendJson(res, 200, { success: true, message: "Bavaria Kustom Works demo reset to pending status." });
      return true;
    } catch (e) {
      sendJson(res, 500, { success: false, error: "Failed to reset demo account." });
      return true;
    }
  }

  return false;
}
