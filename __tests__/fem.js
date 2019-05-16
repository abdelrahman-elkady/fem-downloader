const { setup, downloadCourseList } = require('../fem');

const actualCourseList = [
  'intermediate-python',
  'js-recent-parts',
  'deep-javascript-v3',
  'typescript-v2',
  'web-ui-architecture',
  'lean-front-end-engineering',
  'responsive-web-design'
];

test(
  'Can login to FM',
  async () => {
    const { browser, page, login } = await setup();
    await expect(login()).resolves.toBe(page);
    await browser.close();
  },
  60000
);

test(
  'Download course list',
  async () => {
    const { browser, page } = await setup();
    await page.goto('https://frontendmasters.com/courses/', {
      timeout: 25000,
      waitUntil: ['domcontentloaded']
    });
    const slugs = await downloadCourseList(page);

    expect(slugs).toBeInstanceOf(Array);
    actualCourseList.forEach((slug) => expect(slugs).toContain(slug));

    await browser.close();
  },
  60000
);
