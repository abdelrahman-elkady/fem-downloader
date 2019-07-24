const { createDirSync, makeSlug } = require('./helpers');
const Async = require('crocks/Async');
const Either = require('crocks/Either');
const constant = require('crocks/combinators/constant');
const fs = require('fs');
const https = require('https');
const { Left, Right } = Either;
const _cliProgress = require('cli-progress');
const randomstring = require('randomstring');
const ratelimit = require('ratelimit');
const chalk = require('chalk');
const puppeteer = require('puppeteer');
const UserAgent = require('user-agents');
const stringToEither = (s) => (s.length ? Right(s) : Left(s));

const femGoto = (url) => (page) =>
  Async((rej, res) => {
    page.goto(url).then((a) => res(page));
  });

const setup = async () => {
  const userAgent = new UserAgent();
  const browser = await puppeteer.launch({
    headless: true,
    slowMo: 150,
    args: ['--no-sandbox']
  });
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(true);
  await page.setUserAgent(userAgent.userAgent);
  await page.goto('https://frontendmasters.com/login/', {
    timeout: 25000,
    waitUntil: ['domcontentloaded']
  });
  const fl = femLogin(process.env.FM_LOGIN, process.env.FM_PASSWORD)(page);
  return { browser, page, login: () => fl.toPromise() };
};

const downloadCourseList = async (page) => {
  const slugs = await page.evaluate(() => {
    const anchors = document.querySelectorAll('h2.title a');
    return Array.from(anchors)
      .map((a) => a.href)
      .map((url) =>
        url.replace('https://frontendmasters.com/courses/', '').replace('/', '')
      )
      .sort((s1, s2) => s1.localeCompare(s2));
  });

  return slugs;
};

const downloadSubtitles = async (
  page,
  { group, index, courseSlug, lesson }
) => {
  await page.waitFor(1000);

  try {
    const subtitlesUrl = await page.evaluate((courseIndex) => {
      const ogImage = document.head.querySelector("meta[property='og:image']");
      const lessonSlugs = document.querySelectorAll(
        'nav > ul.FMPlayerScrolling > li:not(.lesson-group)'
      );
      const lessonSlug = lessonSlugs[courseIndex].getAttribute('class');
      const ogImageContent = ogImage.getAttribute('content');
      const partialUrl = ogImageContent.substring(
        0,
        ogImageContent.lastIndexOf('/')
      );

      return Promise.resolve(
        `${partialUrl}/${courseIndex}-${lessonSlug}.vtt`
      );
    }, index);

    const subtitlesFile = fs.createWriteStream(
      `./${courseSlug}/${group}/${index}-${lesson}.vtt`
    );

    return new Promise((resolve, reject) => {
      https.get(subtitlesUrl, function(resp) {
        console.log(
          chalk.dim(
            `\n${new Date().toLocaleTimeString()}: Downloading: ${index}-${lesson}.vtt (subtitles)`
          )
        );

        resp.on('data', function(chunk) {
          subtitlesFile.write(chunk);
        });

        resp.on('end', function() {
          subtitlesFile.end();
          console.log(
            chalk.green(
              `${new Date().toLocaleTimeString()}: ✅ Downloading succesful!`
            )
          );
          resolve(true);
        });
      });
    });
  } catch (e) {
    // Exceptions here shouldn't block the course download
    console.log(chalk.red(`\n❌ Couldn't download the subtitles.`));
    return page;
  }
};

const femLogin = (username, password) => (page) => {
  return Async((rej, res) => {
    (async function() {
      console.log(chalk.grey('\n\nLogging in to FrontendMasters'));
      try {
        await page.type('#username', username, { delay: 50 });
        await page.type('#password', randomstring.generate(12), { delay: 50 });
        await page.type('#password', String.fromCharCode(13));
        await page.waitForSelector('div.Message.MessageAlert', { timeout: 0 });
        await page.type('#password', password, { delay: 50 });
        await page.type('#password', String.fromCharCode(13));
        await page.waitForSelector('h1.DashboardHeader', { timeout: 0 });
        console.log(chalk.green('✅ Login successful!'));
      } catch (e) {
        console.log(chalk.red('❌ Could not login'));
        rej(e);
      }
      res(page);
    })();
  });
};

const allLessonsFrom = (fromLesson, found = false) => (lesson) => {
  if (found) return true;
  if (lesson.includes(fromLesson)) {
    found = true;
    return true;
  }
  return false;
};

const buildDirTree = (courseSlug, fromLesson = '') => (page) =>
  Async((rej, res) => {
    (async function() {
      const lessons = await page.evaluate(function getLessons() {
        const titles = Array.from(document.querySelectorAll('h2.lessongroup'));
        const lessons = Array.from(document.querySelectorAll('ul.LessonList'));

        const titleSlugs = titles.map((title) => title.textContent);

        const result = lessons
          .map((list, index) => ({
            [index]: Array.from(list.querySelectorAll('li a'))
          }))
          .map((lessons, index) =>
            lessons[index].map((a) => a.getAttribute('href'))
          )
          .map((lessons, index) => ({ [titleSlugs[index]]: lessons }));

        return Promise.resolve(result);
      });

      const newKeys = lessons.map((o) => makeSlug(Object.keys(o)[0]));
      {
        let slugLessons = lessons
          .map((l, index) => ({
            title: `${index}-${newKeys[index]}`,
            index: index,
            lessons: l[Object.keys(l)[0]]
          }))
          .map((lessonGroup) =>
            stringToEither(fromLesson)
              .map((fromLesson) => allLessonsFrom(fromLesson))
              .map((onlyFromLesson) =>
                lessonGroup.lessons.filter(onlyFromLesson)
              )
              .either(constant(lessonGroup), (ll) =>
                Object.assign({}, lessonGroup, { lessons: ll })
              )
          );

        if (!fs.existsSync(courseSlug)) fs.mkdirSync(courseSlug);

        // Creates one folder per lesson group
        slugLessons
          .map((lesson) => lesson.title)
          .map((title) => `./${courseSlug}/${title}`)
          .map(createDirSync);

        res({ page, slugLessons });
      }
    })();
  });

const downloadVideoLesson = (page) => async (
  lessonGroup,
  index,
  courseSlug,
  baseUrl,
  lessonUrl,
  rateLimit,
  subtitles
) => {
  await page.goto(`${baseUrl}${lessonUrl}`, {
    waitUnil: ['load', 'domcontentloaded', 'networkidle0']
  });

  await page.waitForSelector('div.vjs-has-started');

  const src = await page.evaluate(() => {
    const video = document.querySelector('video.vjs-tech');
    return Promise.resolve(video.getAttribute('src'));
  });

  await page.click('div.vjs-has-started');

  const lessonTitles = lessonUrl.split('/');

  const lessonTitle = lessonTitles[lessonTitles.length - 2];

  if (subtitles) {
    await downloadSubtitles(page, {
      group: lessonGroup,
      index,
      courseSlug,
      lesson: lessonTitle
    });
  }

  const file = fs.createWriteStream(
    `./${courseSlug}/${lessonGroup}/${index}-${lessonTitle}.webm`
  );

  return new Promise((resolve, reject) =>
    https.get(src, function(resp) {
      if (rateLimit !== -1) {
        ratelimit(resp, rateLimit * 1024);
      }
      console.log(
        chalk.dim(
          `\n${new Date().toLocaleTimeString()}: Downloading: ${index}-${lessonTitle}`
        )
      );

      const bytesLength = parseInt(resp.headers['content-length'] / 8);

      const bar = new _cliProgress.Bar({}, _cliProgress.Presets.shades_classic);
      let totalBytes = 0;
      bar.start(bytesLength, 0);

      resp.on('data', function(chunk) {
        file.write(chunk);
        totalBytes = totalBytes + parseInt(chunk.length / 8);
        bar.update(totalBytes);
      });

      resp.on('end', function() {
        bar.update(bytesLength);
        bar.stop();
        file.end();
        resolve(true);
      });
    })
  );
};

const downloadVideos = (url, courseSlug, ratelimit, subtitles = false) => ({
  page,
  slugLessons
}) => {
  return Async(async (rej, res) => {
    const downloadLesson = downloadVideoLesson(page);

    let index = 0;

    for (const lessonGroup of slugLessons) {
      let lessons = lessonGroup.lessons;
      let group = lessonGroup.title;

      for (const lesson of lessons) {
        try {
          await downloadLesson(
            group,
            index,
            courseSlug,
            url,
            lesson,
            ratelimit,
            subtitles
          );
          index = index + 1;
        } catch (e) {
          rej(e.message);
        }
      }
    }
    res('YEEEEEAH!');
  });
};

module.exports = {
  femGoto,
  femLogin,
  buildDirTree,
  downloadCourseList,
  downloadSubtitles,
  downloadVideos,
  setup
};
