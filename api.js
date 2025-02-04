const puppeteer = require('puppeteer');
const Async = require('crocks/Async');
const pipeK = require('crocks/helpers/pipeK');
const Persist = require('./persist').Persist;
const UserAgent = require('user-agents');
const curry = require('ramda/src/curry');
const compose = require('ramda/src/compose');
const Maybe = require('crocks/Maybe');
const { Nothing } = Maybe;
const I = (a) => a;
const { restore, persist } = Persist;
const userAgent = new UserAgent();
const { userAgent: defaultUserAgent } = userAgent;

// identityToAsync :: a → Async a
const identityToAsync = compose(
  Async.of,
  I
);

// foldMaybe :: Maybe Async a → Async a
const foldMaybe = (m) => m.option(identityToAsync);

function api() {
  const createBrowser = (headless) =>
    Async((rej, res) =>
      puppeteer
        .launch({
          headless,
          args: ['--no-sandbox']
        })
        .then((browser) => persist('browser', browser))
        .then(res)
        .catch(rej)
    );

  // getBrowser :: () → Async Browser
  const getBrowser = () =>
    restore('browser') ? Async.Resolved(restore('browser')) : createBrowser;

  // closeBrowser :: Async Browser → Async ()
  const closeBrowser = () =>
    getBrowser().chain((browser) =>
      Async((rej, res) =>
        browser
          .close()
          .then(res)
          .catch(rej)
      )
    );

  // getNewPage :: Async Browser → Async Page
  const getNewPage = (browser) =>
    Async((rej, res) =>
      browser
        .newPage()
        .then(res)
        .catch(rej)
    );

  // goto :: String → Async Page → Async Page
  const goto = (url) => (page) =>
    Async((rej, res) =>
      page
        .goto(url, {
          timeout: 25000,
          waitUntil: ['domcontentloaded']
        })
        .then(res.bind(null, page))
        .catch((message) => rej(message))
    );

  // enableJs :: Async Page → Async Page
  const enableJs = (page) =>
    Async((_, res) => page.setJavaScriptEnabled(true).then(res(page)));

  // setUserAgent :: Async Page → Async Page
  const setUserAgent = (agent) => (page) =>
    Async((_, res) => page.setUserAgent(agent).then(res(page)));

  // getContent :: Async Page → Async String
  const getContent = (page) =>
    Async(
      (rej, res) =>
        typeof page === 'object'
          ? page
              .content()
              .then(res)
              .catch(res)
          : rej('No page object available')
    );

  // failOnCaptcha :: Async Page → Async Page | Async Error
  const failOnCaptcha = (page) =>
    Async((rej, res) =>
      page
        .waitForSelector('.g-recaptcha', {
          timeout: 1500
        })
        .then(
          rej.bind(
            null,
            "Error: Sorry....re-captcha! You'll be luckier next time"
          )
        )
        .catch(res.bind(null, page))
    );

  // getText :: Async Page → Async String | Async Error
  const getText = (page) =>
    Async(
      (rej, res) =>
        typeof page !== 'string'
          ? page
              .evaluate(() => document.body.innerText)
              .then(res)
              .catch(rej)
          : rej(page)
    );

  // getPage :: ( Url → String ) → Async Page
  const getPage = curry((url, headless) =>
    pipeK(
      () => createBrowser(headless),
      getNewPage,
      enableJs,
      setUserAgent(defaultUserAgent),
      goto(url)
    )
  );

  // getHtml :: ( String → Maybe Async → String ) → Async String
  const getHtml = curry(
    (url, failCondition = Nothing(), ua = defaultUserAgent) =>
      pipeK(
        createBrowser,
        getNewPage,
        enableJs,
        setUserAgent(ua),
        goto(url),
        //       failOnCaptcha,
        foldMaybe(failCondition),
        getContent
      )
  );

  // getPublicIp :: () → Async String
  const getPublicIp = pipeK(
    createBrowser,
    getNewPage,
    enableJs,
    setUserAgent(defaultUserAgent),
    goto('https://api.ipify.org/'),
    getText
  );

  return {
    closeBrowser,
    failOnCaptcha,
    getHtml,
    getNewPage,
    getPage,
    getPublicIp
  };
}

exports.init = api;
