opticrop-node
=============

node.js port of [jueseph/Opticrop](https://github.com/jueseph/Opticrop)

Detect the most interesting part of picture and crops it

Installation
-------------
on Debian/Ubuntu
```
sudo apt-get install libgd2-xpm-dev 
npm install opticrop-node
```

on Mac OS/X
```
brew install gd
npm install opticrop-node
``` 

Example
-----
```JavaScript
Opticrop = require('opticrop-node');
opticrop = new Opticrop;
opticrop.setImage('./images/example.jpg')
  .setWidth(100)
  .setHeight(100)
  .cropTo('./images/cropped_example.jpg', function(err, data) {
    console.log("Cropping done", err, data);
  });
```

Version History
===============

0.1.1
-----
Cropping speed was increased by 3 times due to replacing of mikolalysenko/get-pixels with mikesmullin/node-gd

0.1.0
-----
Ported version of [jueseph/Opticrop](https://github.com/jueseph/Opticrop)