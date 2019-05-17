const fs = require('fs');
const slugify = require('slugify');
const chalk = require('chalk');
const isTest = String(process.env.NODE_ENV) === 'test';

function createDirSync(path) {
  return !fs.existsSync(path) ? fs.mkdirSync(path) : null;
}

function makeSlug(str) {
  return slugify(str, { remove: /[*+~.()'"!:@]/g }).toLowerCase();
}

function getLocaleTimeString() {
  return new Date().toLocaleTimeString();
}

const log = new Proxy(chalk, {
  get(target, prop) {
    return function(message) {
      return console.log(target[prop](`${getLocaleTimeString()}: ${message}`));
    };
  }
});

module.exports = { createDirSync, makeSlug, isTest, log };
