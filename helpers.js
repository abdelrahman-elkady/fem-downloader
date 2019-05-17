const fs = require('fs');
const path = require('path');
const slugify = require('slugify');

function createDirSync(path) {
  return !fs.existsSync(path) ? fs.mkdirSync(path) : null;
}

function makeSlug(str) {
  return slugify(str, { remove: /[*+~.()'"!:@]/g }).toLowerCase();
}

const cache = (function() {
  const cachePath = path.join(__dirname, '.cache.fmdl.json');
  const currentCache = fs.existsSync(cachePath)
    ? JSON.parse(fs.readFileSync(cachePath))
    : {};

  const writeToFile = (cache) => {
    fs.writeFileSync(cachePath, JSON.stringify(cache, null, 2));
  };

  return {
    put(key, value) {
      currentCache[key] = value;
      writeToFile(currentCache);
    },
    get(key) {
      return key in currentCache ? currentCache[key] : undefined;
    }
  };
})();

module.exports = { createDirSync, makeSlug, cache };
