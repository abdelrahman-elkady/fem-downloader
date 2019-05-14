const { femLogin } = require('../fem');
const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');

test(
  'Can login to FM',
  async () => {
    const userAgent = new UserAgent();
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(true);
    await page.setUserAgent(userAgent.userAgent);
    await page.goto('https://frontendmasters.com/login/', {
      timeout: 25000,
      waitUntil: ['domcontentloaded']
    });
    const login = femLogin(process.env.FM_LOGIN, process.env.FM_PASSWORD)(page);

    await expect(login.toPromise()).resolves.toBe(page);

    await browser.close();
  },
  60000
);
