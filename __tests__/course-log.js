jest.mock('date-fns', () => {
  return {
    format(date, format) {
      return '1977-05-20';
    }
  };
});

jest.mock('../fem', () => {
  const downloadCourseList = async () => {
    return Promise.resolve(['fake-course-1', 'fake-course-2']);
  };
  return {
    downloadCourseList
  };
});

const { getCourseList } = require('../course-log');
const fs = require('fs');
const path = require('path');

afterEach(() => {
  jest.resetAllMocks();
  fs.unlinkSync(path.join(__dirname, '..', '1977-05-20.courses.js'));
});

test('Creates a new log file', async () => {
  const list = await getCourseList();
  expect(list).toHaveLength(2);
  expect(
    fs.existsSync(path.join(__dirname, '..', '1977-05-20.courses.js'))
  ).toBe(true);
});

test('Removes older log files', async () => {
  fs.writeFileSync(path.join(__dirname, '..', '1977-05-19.courses.js'), '');
  const list = await getCourseList();
  expect(list).toHaveLength(2);
  expect(
    fs.existsSync(path.join(__dirname, '..', '1977-05-19.courses.js'))
  ).toBe(false);
});
