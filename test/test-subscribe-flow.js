import assert from "assert";
import handler from "../api/leads/subscribe.js";
import subscribersHandler from "../api/leads/subscribers.js";

function createMockReqRes({ method = "POST", body = {} }) {
  const req = {
    method,
    headers: {},
    body
  };

  const res = {
    statusCode: 200,
    headers: {},
    bodyData: null,
    setHeader(key, val) {
      this.headers[key] = val;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.bodyData = data;
      return this;
    },
    end() {
      return this;
    }
  };

  return { req, res };
}

async function runTests() {
  console.log("=== Testing Lead Subscription Flow & Shopify CRM Integration ===");

  // 1. Validation test
  {
    console.log("\n[Test 1] Missing or invalid email returns 400...");
    const { req, res } = createMockReqRes({ body: { email: "invalid-email" } });
    await handler(req, res);
    assert.strictEqual(res.statusCode, 400, "Should return 400 for invalid email");
    assert.strictEqual(res.bodyData.success, false);
    console.log("✔ Validation correctly rejected invalid email.");
  }

  // 2. Missing Token handling
  {
    console.log("\n[Test 2] Missing SHOPIFY_ADMIN_TOKEN correctly flags sync failure without crashing...");
    const origToken = process.env.SHOPIFY_ADMIN_TOKEN;
    delete process.env.SHOPIFY_ADMIN_TOKEN;

    const { req, res } = createMockReqRes({
      body: {
        firstName: "Test",
        lastName: "Painter",
        email: "test.painter.unit@example.com",
        focus: "Custom Automotive & Motorcycle Painting"
      }
    });

    await handler(req, res);
    assert.strictEqual(res.statusCode, 200, "Endpoint should succeed in recording lead and sending email");
    assert.strictEqual(res.bodyData.shopifySync.success, false, "Shopify sync should be marked as failed");
    assert.strictEqual(res.bodyData.shopifySync.status, "missing_token");
    console.log("✔ Accurately detected missing Shopify token and reported false for shopifySync.success.");

    if (origToken) process.env.SHOPIFY_ADMIN_TOKEN = origToken;
  }

  // 3. Mock Shopify 401 Unauthorized handling
  {
    console.log("\n[Test 3] Shopify 401 Unauthorized correctly flags api_error instead of false 'created' status...");
    process.env.SHOPIFY_ADMIN_TOKEN = "shpat_mock_invalid_token";

    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      return {
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({ errors: "[API] Invalid API key or access token" }),
        text: async () => JSON.stringify({ errors: "[API] Invalid API key or access token" })
      };
    };

    const { req, res } = createMockReqRes({
      body: {
        firstName: "Enis",
        lastName: "Sacirovic",
        email: "enkothetenko@gmail.com",
        focus: "Custom Automotive & Motorcycle Painting"
      }
    });

    await handler(req, res);
    global.fetch = originalFetch;

    assert.strictEqual(res.bodyData.shopifySync.success, false, "Shopify sync must not report success on HTTP 401");
    assert.strictEqual(res.bodyData.shopifySync.status, "api_error");
    assert(res.bodyData.shopifySync.message.includes("Invalid API key"), "Error message must report API failure reason");
    console.log("✔ HTTP 401 properly caught, prevented deceptive 'created' status, and documented failure.");
  }

  // 4. Mock Shopify 201 Created handling
  {
    console.log("\n[Test 4] Shopify 201 Created successfully sets shopifySync.success to true...");
    process.env.SHOPIFY_ADMIN_TOKEN = "shpat_valid_mock_token";

    const originalFetch = global.fetch;
    global.fetch = async (url, options) => {
      return {
        ok: true,
        status: 201,
        statusText: "Created",
        json: async () => ({
          customer: {
            id: 123456789,
            email: "new.painter@example.com",
            tags: "pre-launch-vip, european-launch"
          }
        })
      };
    };

    const { req, res } = createMockReqRes({
      body: {
        firstName: "New",
        lastName: "Painter",
        email: "new.painter@example.com"
      }
    });

    await handler(req, res);
    global.fetch = originalFetch;

    assert.strictEqual(res.bodyData.shopifySync.success, true);
    assert.strictEqual(res.bodyData.shopifySync.status, "created");
    console.log("✔ Shopify 201 successfully reports created with pre-launch-vip tags.");
  }

  // 5. Subscribers endpoint test
  {
    console.log("\n[Test 5] GET /api/leads/subscribers returns captured VIP roster (including Enis Sacirovic)...");
    const { req, res } = createMockReqRes({ method: "GET" });
    await subscribersHandler(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.bodyData.success, true);
    assert(res.bodyData.count >= 1, "Roster should contain at least 1 subscriber");
    
    const enis = res.bodyData.subscribers.find(s => s.email === "enkothetenko@gmail.com");
    assert(!!enis, "Enis Sacirovic must be present in subscriber roster");
    assert.strictEqual(enis.firstName, "Enis");
    assert.strictEqual(enis.lastName, "Sacirovic");
    console.log(`✔ Verified subscriber roster contains Enis Sacirovic (${enis.email}).`);
  }

  console.log("\n=================================================");
  console.log("✅ ALL LEAD SUBSCRIPTION & SHOPIFY CRM TESTS PASSED!");
  console.log("=================================================\n");
}

runTests().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
