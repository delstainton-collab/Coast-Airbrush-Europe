import { chromium } from "playwright";

async function runTests() {
  console.log("=================================================");
  console.log("🔒 COAST AIRBRUSH EUROPE: PLAYWRIGHT E2E LOCKDOWN TEST");
  console.log("=================================================\n");

  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // TEST 1: Root redirect
    console.log("Test 1: Navigating to root (https://coastairbrush.eu)...");
    await page.goto("https://coastairbrush.eu", { waitUntil: "networkidle" });
    assert(page.url().includes("/landing.html"), `Root redirects to landing.html (Current: ${page.url()})`);

    // TEST 2: Direct /index.html request
    console.log("\nTest 2: Direct request to /index.html...");
    await page.goto("https://coastairbrush.eu/index.html", { waitUntil: "networkidle" });
    assert(page.url().includes("/landing.html"), `Direct /index.html bounces to landing.html (Current: ${page.url()})`);

    // TEST 3: Direct /about.html request
    console.log("\nTest 3: Direct request to /about.html...");
    await page.goto("https://coastairbrush.eu/about.html", { waitUntil: "networkidle" });
    assert(page.url().includes("/landing.html"), `Direct /about.html bounces to landing.html (Current: ${page.url()})`);

    // TEST 4: Direct /dealers.html request
    console.log("\nTest 4: Direct request to /dealers.html...");
    await page.goto("https://coastairbrush.eu/dealers.html", { waitUntil: "networkidle" });
    assert(page.url().includes("/landing.html"), `Direct /dealers.html bounces to landing.html (Current: ${page.url()})`);

    // TEST 5: Direct /product.html request
    console.log("\nTest 5: Direct request to /product.html...");
    await page.goto("https://coastairbrush.eu/product.html", { waitUntil: "networkidle" });
    assert(page.url().includes("/landing.html"), `Direct /product.html bounces to landing.html (Current: ${page.url()})`);

    // TEST 6: Direct /shipping.html request
    console.log("\nTest 6: Direct request to /shipping.html...");
    await page.goto("https://coastairbrush.eu/shipping.html", { waitUntil: "networkidle" });
    assert(page.url().includes("/landing.html"), `Direct /shipping.html bounces to landing.html (Current: ${page.url()})`);

    // TEST 7: Scan all links on landing.html
    console.log("\nTest 7: Inspecting all anchors and buttons on landing page...");
    await page.goto("https://coastairbrush.eu/landing.html", { waitUntil: "networkidle" });
    const links = await page.$$eval("a", elements => elements.map(e => ({ text: e.innerText.trim(), href: e.getAttribute("href") })));
    
    const leakedStoreLinks = links.filter(l => l.href && (l.href.includes("index") || l.href.includes("product") || l.href.includes("about") || l.href.includes("dealers")));
    assert(leakedStoreLinks.length === 0, `Zero storefront links on landing page (Found: ${leakedStoreLinks.length})`);

    const hasExplore125 = links.some(l => l.text.toLowerCase().includes("explore 125"));
    assert(!hasExplore125, `"Explore 125-Product Catalog" button is completely removed`);

    const hasCatalogPreview = links.some(l => l.text.toLowerCase().includes("catalog preview"));
    assert(!hasCatalogPreview, `"Catalog Preview" button is completely removed`);

    const allocationBtn = links.find(l => l.text.toLowerCase().includes("register for launch allocation"));
    assert(!!allocationBtn && allocationBtn.href === "#subscribe-form", `"Register for Launch Allocation" button exists and anchors to #subscribe-form`);

    // TEST 8: Test clicking "Register for Launch Allocation"
    console.log("\nTest 8: Clicking 'Register for Launch Allocation' button...");
    const allocationHandle = await page.$("a:has-text('Register for Launch Allocation')");
    if (allocationHandle) {
      await allocationHandle.click();
      assert(page.url().includes("#subscribe-form"), `Clicking allocation button smoothly anchors to #subscribe-form (Current: ${page.url()})`);
    } else {
      assert(false, "Allocation button not clickable");
    }

    // TEST 9: Verify Lead Capture form inputs
    console.log("\nTest 9: Verifying lead capture registration form...");
    const firstName = await page.$("#subscriber-firstname");
    const lastName = await page.$("#subscriber-lastname");
    const email = await page.$("#subscriber-email");
    const submitBtn = await page.$("#subscribe-form button[type='submit']");
    assert(!!firstName && !!lastName && !!email && !!submitBtn, "All lead capture form fields (First Name, Last Name, Email, Submit) are present and operational");

  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    await browser.close();
  }

  console.log("\n=================================================");
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log("=================================================");
  if (failed > 0) process.exit(1);
}

runTests();
