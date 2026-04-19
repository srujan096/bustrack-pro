const { chromium } = require('playwright-core');
const { spawn } = require('child_process');
const http = require('http');
const path = require('path');
const fs = require('fs');

const CHROME_PATH = '/home/z/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome';
const DOWNLOAD = '/home/z/my-project/download';
const BASE_URL = 'http://127.0.0.1:81';

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function checkCaddyReady() {
  return new Promise((resolve) => {
    const req = http.get('http://127.0.0.1:81', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(res.statusCode === 200));
    }).on('error', () => resolve(false));
    req.setTimeout(10000, () => { req.destroy(); resolve(false); });
  });
}

async function startServer() {
  return new Promise((resolve, reject) => {
    const server = spawn('npx', ['next', 'dev', '-p', '3000'], {
      cwd: '/home/z/my-project',
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
    });

    let output = '';
    server.stdout.on('data', d => {
      output += d.toString();
      process.stdout.write(d);
    });
    server.stderr.on('data', d => {
      output += d.toString();
      process.stderr.write(d);
    });

    server.on('error', err => {
      reject(new Error('Server spawn error: ' + err.message));
    });

    // Wait up to 30 seconds for the server to be ready
    const startTime = Date.now();
    const check = async () => {
      if (Date.now() - startTime > 30000) {
        reject(new Error('Server startup timeout'));
        return;
      }
      const ready = await checkCaddyReady();
      if (ready) {
        console.log('\n✓ Server is ready via Caddy proxy');
        resolve(server);
      } else {
        setTimeout(check, 2000);
      }
    };
    
    // Start checking after initial delay
    setTimeout(check, 3000);
  });
}

async function run() {
  console.log('=== BusTrack Pro QA Test Suite (Round 19) ===\n');
  
  // Start the server
  console.log('Starting Next.js dev server...');
  let server;
  try {
    server = await startServer();
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
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
    // Step 1: Navigate to login page
    console.log('\n--- Step 1: Login Page ---');
    await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'networkidle' });
    await sleep(1000);
    await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-login.png'), fullPage: false });
    const title1 = await page.title();
    const bodyText1 = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
    console.log('  Title:', title1 || '(empty)');
    console.log('  Body preview:', bodyText1?.substring(0, 200) || '(empty)');
    console.log('  ✓ Screenshot saved: qa-round19-login.png');
    results.push({ step: 'Login Page', status: bodyText1?.length > 50 ? 'PASS' : 'FAIL', detail: bodyText1?.substring(0, 100) });

    // Step 2: Check interactive elements
    console.log('\n--- Step 2: Interactive Elements ---');
    const buttons = await page.$$('button');
    const inputs = await page.$$('input');
    console.log(`  Buttons: ${buttons.length}`);
    console.log(`  Inputs: ${inputs.length}`);

    // Get button text
    const buttonTexts = [];
    for (const btn of buttons.slice(0, 10)) {
      const text = await btn.textContent();
      buttonTexts.push(text?.trim());
    }
    console.log('  Button labels:', buttonTexts.filter(Boolean).join(', '));

    // Step 3: Click Sign In button
    console.log('\n--- Step 3: Sign In Button Click ---');
    const signInBtn = await page.$('button:has-text("Sign In")');
    if (signInBtn) {
      await signInBtn.click();
      await sleep(1500);
      await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-login-clicked.png') });
      console.log('  ✓ Clicked Sign In, screenshot saved');
      results.push({ step: 'Sign In Click', status: 'PASS' });
    } else {
      console.log('  ⚠ Sign In button not found');
      results.push({ step: 'Sign In Click', status: 'FAIL', detail: 'Button not found' });
    }

    // Step 4: Click Admin demo button
    console.log('\n--- Step 4: Admin Demo Button ---');
    // Navigate back to login first
    await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'networkidle' });
    await sleep(1000);
    
    const adminBtn = await page.$('.bg-red-500');
    if (adminBtn) {
      console.log('  Found Admin button, clicking...');
      await adminBtn.click();
      await sleep(3000);
      await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-admin-click.png') });
      console.log('  ✓ Admin click screenshot saved');
      results.push({ step: 'Admin Button Click', status: 'PASS' });
    } else {
      // Try alternative selectors
      const altAdmin = await page.$('button:has-text("Admin")');
      if (altAdmin) {
        console.log('  Found Admin button via text, clicking...');
        await altAdmin.click();
        await sleep(3000);
        await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-admin-click.png') });
        console.log('  ✓ Admin click screenshot saved (via text selector)');
        results.push({ step: 'Admin Button Click', status: 'PASS (text selector)' });
      } else {
        console.log('  ⚠ Admin button not found');
        results.push({ step: 'Admin Button Click', status: 'FAIL', detail: 'Button not found' });
      }
    }

    // Step 5: Capture admin dashboard
    console.log('\n--- Step 5: Admin Dashboard ---');
    const adminUrl = page.url();
    const adminTitle = await page.title();
    const adminBody = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
    console.log('  URL:', adminUrl);
    console.log('  Title:', adminTitle || '(empty)');
    console.log('  Body preview:', adminBody?.substring(0, 200) || '(empty)');
    await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-admin-dash.png'), fullPage: false });
    console.log('  ✓ Screenshot saved: qa-round19-admin-dash.png');
    const isAdminDash = adminUrl !== BASE_URL + '/' || adminBody?.includes('Dashboard') || adminBody?.includes('Admin');
    results.push({ step: 'Admin Dashboard', status: isAdminDash ? 'PASS' : 'UNCERTAIN', detail: adminBody?.substring(0, 100) });

    // Step 6: Customer demo
    console.log('\n--- Step 6: Customer Demo Button ---');
    await page.goto(BASE_URL, { timeout: 30000, waitUntil: 'networkidle' });
    await sleep(1000);

    const customerBtn = await page.$('.bg-emerald-500');
    if (customerBtn) {
      console.log('  Found Customer button, clicking...');
      await customerBtn.click();
      await sleep(3000);
      await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-customer-dash.png'), fullPage: false });
      console.log('  ✓ Customer dashboard screenshot saved');
      const custUrl = page.url();
      const custBody = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
      console.log('  URL:', custUrl);
      console.log('  Body preview:', custBody?.substring(0, 200) || '(empty)');
      results.push({ step: 'Customer Dashboard', status: 'PASS' });
    } else {
      const altCust = await page.$('button:has-text("Customer")');
      if (altCust) {
        console.log('  Found Customer button via text, clicking...');
        await altCust.click();
        await sleep(3000);
        await page.screenshot({ path: path.join(DOWNLOAD, 'qa-round19-customer-dash.png'), fullPage: false });
        console.log('  ✓ Customer dashboard screenshot saved (via text selector)');
        results.push({ step: 'Customer Dashboard', status: 'PASS (text selector)' });
      } else {
        console.log('  ⚠ Customer button not found');
        results.push({ step: 'Customer Dashboard', status: 'FAIL', detail: 'Button not found' });
      }
    }

  } catch (err) {
    console.error('\n✖ Test error:', err.message);
    errors.push(`[TestError] ${err.message}`);
    results.push({ step: 'Overall', status: 'ERROR', detail: err.message });
  }

  // Step 7: Console errors
  console.log('\n--- Step 7: Console Errors ---');
  if (errors.length > 0) {
    console.log(`  Found ${errors.length} error(s):`);
    errors.forEach(e => console.log(`    ${e}`));
  } else {
    console.log('  ✓ No console errors');
  }
  
  // Write errors file
  fs.writeFileSync(
    path.join(DOWNLOAD, 'qa-round19-errors.txt'),
    errors.length > 0 ? errors.join('\n') : 'No console errors found during QA testing.\n'
  );

  // Cleanup
  await browser.close();
  if (server) {
    server.kill();
  }

  // Summary
  console.log('\n=== QA Test Summary ===');
  results.forEach(r => {
    const icon = r.status === 'PASS' || r.status.startsWith('PASS') ? '✓' : r.status === 'FAIL' ? '✖' : '?';
    console.log(`  ${icon} ${r.step}: ${r.status}${r.detail ? ' — ' + r.detail : ''}`);
  });
  console.log('\nDone!');
}

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
