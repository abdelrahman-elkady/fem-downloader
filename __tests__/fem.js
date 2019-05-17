const fs = require('fs');
const rimraf = require('rimraf');
const { setup, downloadCourseList, downloadSubtitles } = require('../fem');

const actualCourseList = [
  'intermediate-python',
  'js-recent-parts',
  'deep-javascript-v3',
  'typescript-v2',
  'web-ui-architecture',
  'lean-front-end-engineering',
  'responsive-web-design'
];

afterEach(() => {
  jest.clearAllMocks();
});

test('Can login to FM', async () => {
  const { browser, page, login } = await setup();
  await expect(login()).resolves.toBe(page);
  await browser.close();
}, 60000);

test('Download course list', async () => {
  const { browser, page } = await setup();
  await page.goto('https://frontendmasters.com/courses/', {
    timeout: 25000,
    waitUntil: ['domcontentloaded']
  });
  const slugs = await downloadCourseList(page);

  expect(slugs).toBeInstanceOf(Array);
  actualCourseList.forEach((slug) => expect(slugs).toContain(slug));

  await browser.close();
}, 60000);

describe('Download subtitles', () => {
  beforeAll(() => {
    jest.mock('console', function() {
      return {
        log: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      };
    });
  });

  afterAll(() => {
    rimraf.sync('./test-subtitles-download');
  });

  test('Can download subtitles', async () => {
    const { browser, page, login } = await setup();
    await login();
    await page.goto(
      'https://frontendmasters.com/courses/testing-react/course-overview/',
      {
        timeout: 25000,
        waitUntil: ['domcontentloaded']
      }
    );

    fs.mkdirSync('./test-subtitles-download/0-intro', { recursive: true });

    await downloadSubtitles(page, {
      group: '0-intro',
      index: 11,
      courseSlug: 'test-subtitles-download',
      lesson: 'anything'
    });
    await browser.close();

    const expectedPath =
      './test-subtitles-download/0-intro/11-anything.web_vtt';
    expect(fs.existsSync(expectedPath)).toBe(true);
    const { size } = fs.statSync(expectedPath);
    expect(size).toBeGreaterThan(0);
  }, 60000);
});
