Opticrop = require('./opticrop.js').Opticrop

opticrop = new Opticrop

out = '/tmp/ocrop/cr_beautiful-girl-wallpapers-8.jpg'
inFile = '/tmp/ocrop/beautiful-girl-wallpapers-8.jpg'
opticrop._crop inFile, 100, 100, out, (err, data)->
  console.log "***", err, data


