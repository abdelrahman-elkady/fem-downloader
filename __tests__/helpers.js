const { createDirSync, makeSlug } = require('../helpers');
const { existsSync, rmdirSync } = require('fs');
const invalidCourseTitles = ['0-Javascript: The Hard Parts', '4-ui/ux'];

describe('createDirSync: slugifies invalid titles into valid paths', () => {
  invalidCourseTitles
    .map((title) => makeSlug(title).toLowerCase())
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
