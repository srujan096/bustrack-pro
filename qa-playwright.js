const { chromium } = require('playwright-core');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/home/z/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';
const DOWNLOAD = '/home/z/my-project/download';
const BASE_URL = 'http://127.0.0.1:81';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function httpGet(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const req = http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, length: data.length }));
    }).on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function run() {
  // Pre-flight check
  console.log('Pre-flight: Checking Caddy proxy...');
  try {
    const preflight = await httpGet(BASE_URL, 5000);
    console.log('  Caddy status:', preflight.status, 'Length:', preflight.length);
    if (preflight.status !== 200) {
      console.log('  WARNING: Caddy returned non-200, server may not be ready');
    }
  } catch (e) {
    console.log('  WARNING: Caddy check failed:', e.message);
  }

  const browser = await chromium.launch({
    executablePath: CHROME_PATH,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const errors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`[console.${msg.type()}] ${msg.text()}`);
    }
  });
  page.on('pageerror', err => {
    errors.push(`[PageError] ${err.message}`);
  });

  const results = [];

  try {
    // ===== STEP 1: Login Page =====
    console.log('\n[Step 1] Navigating to login page...');
    try {
      await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'networkidle' });
    } catch (e) {
      console.log('  networkidle timeout, using domcontentloaded fallback');
      try {
        await page.goto(BASE_URL, { timeout: 15000, waitUntil: 'domcontentloaded' });
      } catch (e2) {
        console.log('  domcontentloaded also failed, using load fallback');
        await page.goto(BASE_URL, { timeout: 15000, waitUntil: 'load' });
      }
    }
    
    await sleep(2000);
    await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-login.png'), fullPage: false });
    
    const title = await page.title();
    const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 1000));
    console.log('  Title:', title || '(empty)');
    console.log('  Body length:', bodyText?.length || 0, 'chars');
    console.log('  Preview:', (bodyText || '').substring(0, 150));
    console.log('  ✓ Screenshot: qa-round19-login.png');
    
    const loginPass = bodyText && bodyText.includes('BusTrack');
    results.push({ step: 'Login Page', pass: loginPass, detail: loginPass ? 'BusTrack Pro login visible' : 'Page content unexpected' });

    // ===== STEP 2: Interactive Elements =====
    console.log('\n[Step 2] Checking interactive elements...');
    const buttons = await page.$$('button');
    const inputs = await page.$$('input');
    console.log('  Buttons found:', buttons.length);
    console.log('  Inputs found:', inputs.length);
    
    const buttonTexts = [];
    for (const btn of buttons.slice(0, 15)) {
      try {
        const text = (await btn.textContent())?.trim();
        if (text) buttonTexts.push(text);
      } catch {}
    }
    console.log('  Button labels:', buttonTexts.join(' | '));

    // ===== STEP 3: Sign In Click =====
    console.log('\n[Step 3] Clicking Sign In...');
    let signInFound = false;
    try {
      const signInBtn = await page.$('button:has-text("Sign In")');
      if (signInBtn) {
        signInFound = true;
        await signInBtn.click();
        await sleep(2000);
        await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-login-clicked.png') });
        console.log('  ✓ Clicked Sign In');
        console.log('  ✓ Screenshot: qa-round19-login-clicked.png');
      }
    } catch (e) {
      console.log('  Error clicking Sign In:', e.message);
    }
    if (!signInFound) {
      console.log('  ⚠ Sign In button not found');
    }
    results.push({ step: 'Sign In Click', pass: signInFound, detail: signInFound ? 'Button found and clicked' : 'Button not found' });

    // ===== STEP 4: Admin Demo Button =====
    console.log('\n[Step 4] Clicking Admin demo button...');
    // Go back to login
    try {
      await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'networkidle' });
    } catch {
      await page.goto(BASE_URL, { timeout: 15000, waitUntil: 'load' });
    }
    await sleep(2000);

    let adminClicked = false;
    try {
      // Try CSS selector first
      let adminBtn = await page.$('.bg-red-500');
      if (!adminBtn) {
        // Try text selector
        adminBtn = await page.$('button:has-text("Admin")');
      }
      if (adminBtn) {
        adminClicked = true;
        await adminBtn.click();
        console.log('  Clicked Admin button, waiting for dashboard...');
        await sleep(4000); // Wait for API call and page transition
        await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-admin-click.png') });
        console.log('  ✓ Screenshot: qa-round19-admin-click.png');
      }
    } catch (e) {
      console.log('  Error clicking Admin:', e.message);
    }
    if (!adminClicked) {
      console.log('  ⚠ Admin button not found');
    }
    results.push({ step: 'Admin Button', pass: adminClicked, detail: adminClicked ? 'Button clicked' : 'Button not found' });

    // ===== STEP 5: Admin Dashboard =====
    console.log('\n[Step 5] Capturing Admin Dashboard...');
    const adminUrl = page.url();
    const adminBody = await page.evaluate(() => document.body?.innerText?.substring(0, 1000));
    console.log('  URL:', adminUrl);
    console.log('  Body length:', adminBody?.length || 0);
    console.log('  Preview:', (adminBody || '').substring(0, 150));
    await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-admin-dash.png'), fullPage: false });
    console.log('  ✓ Screenshot: qa-round19-admin-dash.png');
    
    const isAdminDash = adminBody && (adminBody.includes('Dashboard') || adminBody.includes('Admin') || adminBody.includes('Route'));
    results.push({ step: 'Admin Dashboard', pass: isAdminDash, detail: isAdminDash ? 'Dashboard content loaded' : 'Dashboard not confirmed' });

    // ===== STEP 6: Customer Demo =====
    console.log('\n[Step 6] Clicking Customer demo button...');
    try {
      await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'networkidle' });
    } catch {
      await page.goto(BASE_URL, { timeout: 15000, waitUntil: 'load' });
    }
    await sleep(2000);

    let custClicked = false;
    try {
      let custBtn = await page.$('.bg-emerald-500');
      if (!custBtn) {
        custBtn = await page.$('button:has-text("Customer")');
      }
      if (custBtn) {
        custClicked = true;
        await custBtn.click();
        console.log('  Clicked Customer button, waiting for dashboard...');
        await sleep(4000);
        await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-customer-dash.png'), fullPage: false });
        console.log('  ✓ Screenshot: qa-round19-customer-dash.png');
        
        const custUrl = page.url();
        const custBody = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
        console.log('  URL:', custUrl);
        console.log('  Body length:', custBody?.length || 0);
        console.log('  Preview:', (custBody || '').substring(0, 150));
      }
    } catch (e) {
      console.log('  Error clicking Customer:', e.message);
    }
    if (!custClicked) {
      console.log('  ⚠ Customer button not found');
    }
    results.push({ step: 'Customer Button', pass: custClicked, detail: custClicked ? 'Button clicked' : 'Button not found' });

  } catch (err) {
    console.error('\n✖ Fatal test error:', err.message);
    errors.push(`[FatalError] ${err.message}`);
  }

  // ===== STEP 7: Console Errors =====
  console.log('\n[Step 7] Console Errors Check...');
  if (errors.length > 0) {
    console.log(`  Found ${errors.length} error(s):`);
    errors.slice(0, 20).forEach(e => console.log(`    ${e}`));
    if (errors.length > 20) console.log(`    ... and ${errors.length - 20} more`);
  } else {
    console.log('  ✓ No console errors detected');
  }
  fs.writeFileSync(
    path.join(DOWNLOAD, 'qa-round19-errors.txt'),
    errors.length > 0 ? errors.join('\n') : 'No console errors found during QA testing.\n'
  );
  console.log('  ✓ Saved: qa-round19-errors.txt');

  // ===== SUMMARY =====
  console.log('\n========================================');
  console.log('  QA TEST SUMMARY — Round 19');
  console.log('========================================');
  let passCount = 0;
  results.forEach(r => {
    const icon = r.pass ? '✓' : '✖';
    console.log(`  ${icon} ${r.step}: ${r.detail}`);
    if (r.pass) passCount++;
  });
  console.log(`\n  Result: ${passCount}/${results.length} checks passed`);
  console.log(`  Errors: ${errors.length} console errors`);
  console.log('========================================\n');

  await browser.close();
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
