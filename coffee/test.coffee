Opticrop = require('./lib/opticrop.js')
async    = require('async')
util = require('util')

opticrop = new Opticrop

inFile  = './images/example.jpg'
out     = './images/example_cropped.jpg'
opticrop.setImage(inFile)
  .setWidth(100).
  setHeight(100)
  .cropTo out, (err, data)->
    console.log "***", err, data


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

