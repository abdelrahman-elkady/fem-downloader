const path = require('path');
const { createDirSync, makeSlug } = require(path.join(
  __dirname,
  '..',
  'helpers'
));
const { existsSync, rmdirSync } = require('fs');
const invalidCourseTitles = ['0-Javascript: The Hard Parts'];

describe('createDirSync: slugifies invalid titles into valid paths', () => {
  invalidCourseTitles
    .map((title) => makeSlug(title, { remove: /[*+~.()'"!:@]/g }).toLowerCase())
    .forEach((path) => {
      afterEach(() => {
        if (existsSync(`./${path}`)) {
          rmdirSync(`./${path}`);
        }
      });
      test(`Creates the directory if path is "./${path}"`, () => {
        createDirSync(`./${path}`);
        expect(existsSync(`./${path}`)).toBe(true);
      });
    });
});
