const Opticrop = require('./lib/opticrop.js').Opticrop;
const async = require('async');
const util = require('util');
const inputFiles = ['example.jpg', 'example_flower.jpg', 'example_flower_left.jpg', 'example.png', 'example.gif'];
const filesDir = './images/';
const opticrop = new Opticrop;

async.each(inputFiles, (file, cb) => {
  console.time(file);
  const inFile = filesDir + file;
  const outFile = `${filesDir}cropped_${file}`;
  return opticrop
    .setImage(inFile)
    .setWidth(100)
    .setHeight(100)
    .cropTo(outFile)
    .then(() => {
      cb();
    })
    .catch((err) => {
      console.log('Error', err);
      cb(err);
    });
}, (err) => {
  if (err) {
    return console.log('Error: ' + err);
  } else {
    return console.log('\n All files were cropped without erros. Check the ./image directory \n');
  }
});

const testMemoryLeaks = process.env.TEST_MEMORY || 0;
if (testMemoryLeaks) {
  const memwatch = require('memwatch-next');
  memwatch.on('leak', (info) => {
    console.error('Memory leak detected:\n', info);
  });

  const mkdirp = require('mkdirp');
  // memory leaks test
  async.timesSeries(100, function(n, cb) {
    const outDir = `${filesDir}/leaks_test/`;
    mkdirp.sync(outDir);
    const outFile = `${outDir}${n}_cr_example.jpg`;
    const inFile = `${filesDir}example.jpg`;
    console.time(outFile);
    return opticrop.setImage(inFile).setWidth(100).setHeight(100).cropTo(outFile, function(err) {
      console.log('*** #' + n, err);
      console.log(util.inspect(Math.floor(process.memoryUsage().rss / (1024 * 1024)) + ' MB'));
      console.timeEnd(outFile);
      return cb();
    });
  }, (err, data) => {
    console.log('done. Err: ', err);
    return console.log(util.inspect(process.memoryUsage()));
  });
}
