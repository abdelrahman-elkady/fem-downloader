const path = require('path');
const fs = require('fs');
const { downloadCourseList } = require('./fem');
const glob = require('glob');
const { promisify } = require('util');
const { format } = require('date-fns');

const getCourseList = async () => {
  const today = format(new Date(), 'YYYY-MM-DD');
  const listFiles = promisify(glob);
  const files = await listFiles(path.join(__dirname, '*.courses.js'));
  const [todayLogFile] = files.filter((path) => path.includes(today));

  if (todayLogFile) {
    return require(todayLogFile);
  } else {
    files.forEach((file) => fs.unlinkSync(file));
    const newLogFile = path.join(__dirname, `${today}.courses.js`);
    const courseSlugs = await downloadCourseList();
    fs.writeFileSync(
      newLogFile,
      `module.exports = ${JSON.stringify(courseSlugs, null, 2)}`
    );
    return require(newLogFile);
  }
};

module.exports = { getCourseList };
