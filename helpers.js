const fs = require('fs');
const slugify = require('slugify');

function createDirSync(path) {
  return !fs.existsSync(path) ? fs.mkdirSync(path) : null;
}

function makeSlug(str) {
  return slugify(str, { remove: /[*+~.()'"!:@]/g }).toLowerCase();
}

module.exports = { createDirSync, makeSlug };
