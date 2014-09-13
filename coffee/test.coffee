Opticrop  = require('./lib/opticrop.js')
async     = require('async')
util      = require('util')


inputFiles = ['example.jpg', 'example.png', 'example.gif']
filesDir = "./images/"
opticrop = new Opticrop
async.each inputFiles, (file, cb)->
  console.time(file);
  inFile = "#{filesDir}#{file}"
  outFile = "#{filesDir}cropped_#{file}"
  
  opticrop.setImage(inFile)
  .setWidth(100)
  .setHeight(100)
  .cropTo outFile, (err)->
    console.log "***", err
    console.timeEnd(file)
    
    cb err
, (err)->
  if err
    console.log "Error: " + err
  else
    console.log "All files were cropped without erros"

# memory leaks test

#opticrop = new Opticrop
#async.timesSeries 100, (n, cb)->
#  outFile = "#{filesDir}#{n}_cr_example.jpg"
#  inFile  = "#{filesDir}example.jpg"
#  console.time(outFile);
#  opticrop.setImage(inFile).setWidth(100).setHeight(100).cropTo outFile, (err)->
#    console.log "*** ##{n}", err
#    console.log(util.inspect(Math.floor(process.memoryUsage().rss/(1024*1024)) + " MB"));
#    console.timeEnd(outFile)
#    cb()
#, (err, data)->
#  console.log "done. Err: ", err 
#  console.log(util.inspect(process.memoryUsage()))
  


