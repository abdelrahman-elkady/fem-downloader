const fs = require('fs');
const { init } = require('./api');
const {
  femLogin,
  femGoto,
  buildDirTree,
  downloadVideos,
  setup,
  downloadCourseList
} = require('./fem');
const inquirer = require('inquirer');
const chalk = require('chalk');
const fuzzy = require('fuzzy');
const log = console.log.bind(console);

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
  fromLesson
) =>
  getPage(`${url}/login/`, headless)()
    .chain(femLogin(username, password))
    .chain(femGoto(`${url}/courses/${courseSlug}/`))
    .chain(buildDirTree(courseSlug, fromLesson))
    .chain(downloadVideos(url, courseSlug, ratelimit))
    .chain(closeBrowser);

const femDownload = flow('https://frontendmasters.com');

const questions = [
  { type: 'input', message: 'Please insert your username:', name: 'username' },
  {
    type: 'password',
    message: 'Please insert your password:',
    name: 'password',
    mask: '*'
  },
  {
    type: 'autocomplete',
    message: 'Please insert course slug:',
    name: 'slug'
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
    message: 'Launch Puppeteer in headless mode? :',
    name: 'headless'
  },
  {
    type: 'confirm',
    message: 'Are the information correct ?',
    name: 'confirmation'
  }
];

(async () => {
  if (!fs.existsSync('./courses.js')) {
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
      './courses.js',
      `module.exports = ${JSON.stringify(courseSlugs, null, 2)}`
    );
    await browser.close();
  }
  const courses = require('./courses');

  // Adds the source property to the inquirer question
  questions[2].source = function(_, input) {
    const filtered = fuzzy
      .filter(input, courses)
      .map((res) => res.string)
      .filter(Boolean);

    return Promise.resolve(filtered);
  };

  const {
    username,
    password,
    slug,
    confirmation,
    headless,
    ratelimit,
    from = ''
  } = await inquirer.prompt(questions);

  if (!confirmation) {
    return;
  }

  femDownload(username, password, slug, ratelimit, headless, from).fork(
    (e) => log('Error: ', e),
    (s) => log('Download completed!')
  );
})();
