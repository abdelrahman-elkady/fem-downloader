const rc = require('rc');
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fuzzy = require('fuzzy');

const { CONFIG_APP_NAME } = require('./constants');

const { init } = require('./api');
const {
  femLogin,
  femGoto,
  buildDirTree,
  downloadVideos,
  setup,
  downloadCourseList
} = require('./fem');

const log = console.log.bind(console);
const config = rc(CONFIG_APP_NAME, { username: null, password: null });

inquirer.registerPrompt(
  'autocomplete',
  require('inquirer-autocomplete-prompt')
);

const { getPage, closeBrowser } = init();

const flow = (url) => (
  username,
  password,
  courseSlug,
  ratelimit,
  headless,
  subtitles,
  fromLesson
) =>
  getPage(`${url}/login/`, headless)()
    .chain(femLogin(username, password))
    .chain(femGoto(`${url}/courses/${courseSlug}/`))
    .chain(buildDirTree(courseSlug, fromLesson))
    .chain(downloadVideos(url, courseSlug, ratelimit, subtitles))
    .chain(closeBrowser);

const femDownload = flow('https://frontendmasters.com');

const buildInquirerQuestions = (courses) => {
  const questions = [
    { type: 'input', message: 'Please insert your username:', name: 'username', default: config.username },
    {
      type: 'password',
      message: 'Please insert your password:',
      name: 'password',
      mask: '*',
      default: config.password
    },
    {
      type: 'autocomplete',
      message: 'Please insert course slug:',
      name: 'slug',
      source(_, input) {
        const filtered = fuzzy
          .filter(input, courses)
          .map((res) => res.string)
          .filter(Boolean);

        return Promise.resolve(filtered);
      }
    },
    {
      type: 'list',
      message: 'Download bandwidth limit:',
      name: 'ratelimit',
      choices: [
        { name: '100Kb', value: 100 },
        { name: '150Kb', value: 150 },
        { name: '200Kb', value: 200 },
        { name: '250Kb', value: 250 },
        { name: '500Kb', value: 500 },
        new inquirer.Separator(),
        { name: 'None (this is not recommended!)', value: -1 }
      ]
    },
    {
      type: 'confirm',
      message: 'Download subtitles? :',
      name: 'subtitles'
    },
    {
      type: 'confirm',
      message: 'Launch Puppeteer in headless mode? :',
      name: 'headless'
    },
    {
      type: 'confirm',
      message: 'Are the information correct ?',
      name: 'confirmation'
    }
  ];

  return questions;
};

(async () => {
  if (!fs.existsSync(path.join(__dirname, 'courses.js'))) {
    // Downloads the course list (which is public)
    // Login is not required
    console.log(
      chalk.yellow(
        "Downloading courses list, please be patient: it won't take long\n"
      )
    );
    const { browser, page } = await setup();
    await page.goto('https://frontendmasters.com/courses/', {
      timeout: 25000,
      waitUntil: ['domcontentloaded']
    });
    const courseSlugs = await downloadCourseList(page);
    fs.writeFileSync(
      path.join(__dirname, 'courses.js'),
      `module.exports = ${JSON.stringify(courseSlugs, null, 2)}`
    );
    await browser.close();
  }

  const courses = require(path.join(__dirname, 'courses'));

  const questions = buildInquirerQuestions(courses);

  const {
    username,
    password,
    slug,
    confirmation,
    headless,
    ratelimit,
    subtitles,
    from = ''
  } = await inquirer.prompt(questions);

  if (!confirmation) {
    return;
  }

  femDownload(
    username,
    password,
    slug,
    ratelimit,
    headless,
    subtitles,
    from
  ).fork((e) => log('Error: ', e), (s) => log('Download completed!'));
})();
