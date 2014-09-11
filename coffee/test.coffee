Opticrop = require('./lib/opticrop.js')

opticrop = new Opticrop

out = '/tmp/ocrop/cr_beautiful-girl-wallpapers-8.jpg'
inFile = '/tmp/ocrop/beautiful-girl-wallpapers-8.jpg'
opticrop.setImage(inFile).setWidth(100).setHeight(100).cropTo out, (err, data)->
  console.log "***", err, data


