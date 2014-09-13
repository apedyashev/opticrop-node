Opticrop  = require('./lib/opticrop.js')
async     = require('async')
util      = require('util')

opticrop = new Opticrop

inputFiles = ['example.jpg', 'example.png', 'example.gif']
filesDir = "./images/"
async.each inputFiles, (file, cb)->
  console.time(file);
  inFile = "#{filesDir}#{file}"
  outFile = "#{filesDir}cropped_#{file}"
  
  opticrop.setImage(inFile)
  .setWidth(100)
  .setHeight(100)
  .cropTo outFile, (err, data)->
    console.log "***", err, data
    console.timeEnd(file)
    
    cb err
, (err)->
  if err
    console.log "Error: " + err
  else
    console.log "All files were cropped without erros"

#inFile  = './images/example.jpg'
#out     = './images/example_cropped.jpg'
#console.time("dbsave");
#opticrop.setImage(inFile)
#  .setWidth(100).
#  setHeight(100)
#  .cropTo out, (err, data)->
#    console.log "***", err, data
#    console.timeEnd("dbsave");


# memory leaks test

#async.timesSeries 20, (n, cb)->
#  out = '/tmp/ocrop/cr_beautiful-girl-wallpapers-8.jpg'
#  inFile = '/tmp/ocrop/beautiful-girl-wallpapers-8.jpg'
#  opticrop.setImage(inFile).setWidth(100).setHeight(100).cropTo out, (err, data)->
#    console.log "*** ##{n}", err, data
#    console.log(util.inspect(process.memoryUsage()));
#    cb()
#, (err, data)->
#  console.log "done", err, data 
#  console.log(util.inspect(process.memoryUsage()));

