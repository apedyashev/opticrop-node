"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var gm = require('gm');
var async = require('async');
var gd = require('node-gd');
var Promise = require('bluebird');
var GAMMA = 0.2;
var Opticrop = (function () {
    function Opticrop() {
    }
    /**
    *  Sets image to be cropped
    */
    Opticrop.prototype.setImage = function (imageFile) {
        this.image = imageFile;
        return this;
    };
    /**
    *  Sets target width
    */
    Opticrop.prototype.setWidth = function (width) {
        this.width = width;
        return this;
    };
    /**
    *  Sets target height
    */
    Opticrop.prototype.setHeight = function (height) {
        this.height = height;
        return this;
    };
    /**
    *  Crops image and saves it to outImage
    */
    Opticrop.prototype.cropTo = function (outImage, done) {
        if (done) {
            return this._cropTo(outImage, done);
        }
        var cropTo = Promise.promisify(this._cropTo, { context: this });
        return cropTo(outImage);
    };
    /**
    * Cropping routine that conforms to node.js convention of accepting a callback as last argumen
    */
    Opticrop.prototype._cropTo = function (outImage, done) {
        if (!this.image) {
            return done('Image to me cropped is not set. Please use the setImage() function');
        }
        if (!this.width) {
            return done('Cropped image width is not set. Please use the setWidth() function');
        }
        if (!this.height) {
            return done('Cropped image height is not set. Please use the setWidth() function');
        }
        this._crop(this.image, this.width, this.height, outImage, done);
    };
    /**
    * Smart cropping routine
    */
    Opticrop.prototype._crop = function (inImage, inWidth, inHeight, outImage, done) {
        var _this = this;
        var gmImage = gm(inImage);
        var gmInImage = gm(inImage);
        async.auto({
            size: function (cb) {
                gmImage.size(function (err, val) {
                    cb(err, val);
                });
            },
            createEdgedImage: ['size', function (cb, results) {
                    if ((inWidth > results.size.width) || (inHeight > results.size.height)) {
                        return cb("Target dimensions must be smaller or equal to source dimensions.");
                    }
                    var edgeFilterRadius = 1;
                    gmImage.edge(edgeFilterRadius)
                        .modulate(100, 0, 100)
                        .blackThreshold(15, 15, 15)
                        .write(outImage, function (err) {
                        cb(err, { resultFile: outImage });
                    });
                }],
            calculateCenter: ['size', 'createEdgedImage', function (cb, results) {
                    _this._createGdImage(results.createEdgedImage.resultFile, function (err, gdImage) {
                        if (err) {
                            console.log(err);
                            return cb(err);
                        }
                        var n = 100000;
                        var xcenter = 0;
                        var ycenter = 0;
                        var sum = 0;
                        for (var k = 0; k < n; k++) {
                            var i = _this._random(0, results.size.width - 1);
                            var j = _this._random(0, results.size.height - 1);
                            // get blue (why blue???) channels value
                            var val = gdImage.imageColorAt(i, j) & 0xFF;
                            sum += val;
                            xcenter += (i + 1) * val;
                            ycenter += (j + 1) * val;
                        }
                        xcenter /= sum;
                        ycenter /= sum;
                        // crop source img to target AR
                        var targetAspectRatio = inWidth / inHeight;
                        var wcrop0 = 0;
                        var hcrop0 = 0;
                        if (results.size.width / results.size.height > targetAspectRatio) {
                            // source AR wider than target
                            // crop width to target AR
                            wcrop0 = Math.round(targetAspectRatio * results.size.height);
                            hcrop0 = results.size.height;
                        }
                        else {
                            // crop height to target AR
                            wcrop0 = results.size.width;
                            hcrop0 = Math.round(results.size.width / targetAspectRatio);
                        }
                        ///////////////////////////
                        // crop at different scales
                        ///////////////////////////
                        // scale count: number of crop sizes to try
                        var nk = 9;
                        var hgap = hcrop0 - inHeight;
                        var hinc = (nk == 1) ? 0 : hgap / (nk - 1);
                        var wgap = wcrop0 - inWidth;
                        var winc = (nk == 1) ? 0 : wgap / (nk - 1);
                        // find window with highest normalized edginess
                        n = 10000;
                        var maxbetanorm = 0;
                        var maxparam = { 'w': 0, 'h': 0, 'x': 0, 'y': 0 };
                        var w0 = results.size.width;
                        var h0 = results.size.height;
                        // for k in [0...nk]
                        for (var k = 0; k < nk; k++) {
                            var hcrop = Math.round(hcrop0 - k * hinc);
                            var wcrop = Math.round(wcrop0 - k * winc);
                            var xcrop = xcenter - wcrop / 2;
                            var ycrop = ycenter - hcrop / 2;
                            if (xcrop < 0) {
                                xcrop = 0;
                            }
                            if (xcrop + wcrop > w0) {
                                xcrop = w0 - wcrop;
                            }
                            if (ycrop < 0) {
                                ycrop = 0;
                            }
                            if (ycrop + hcrop > h0) {
                                ycrop = h0 - hcrop;
                            }
                            var beta = 0;
                            // for c in [0...n]
                            for (var c = 0; c < n; c++) {
                                var i = _this._random(0, wcrop - 1);
                                var j = _this._random(0, hcrop - 1);
                                // get blue (why blue???) channels value
                                beta += gdImage.imageColorAt(i, j) & 0xFF;
                            }
                            var area = wcrop * hcrop;
                            var betanorm = beta / (n * Math.pow(area, GAMMA - 1));
                            // best image found, save it
                            if (betanorm > maxbetanorm) {
                                maxbetanorm = betanorm;
                                maxparam['w'] = wcrop;
                                maxparam['h'] = hcrop;
                                maxparam['x'] = xcrop;
                                maxparam['y'] = ycrop;
                            }
                        }
                        cb(null, {
                            width: maxparam['w'],
                            height: maxparam['h'],
                            x: maxparam['x'],
                            y: maxparam['y']
                        });
                    });
                }],
            cropImage: ['calculateCenter', function (cb, result) {
                    gmInImage.crop(result.calculateCenter.width, result.calculateCenter.height, result.calculateCenter.x, result.calculateCenter.y);
                    cb();
                }],
            scaleImage: ['calculateCenter', 'cropImage', function (cb) {
                    gmInImage.scale(inWidth, inHeight);
                    cb(null);
                }]
        }, function (err) {
            if (err) {
                return done(err);
            }
            gmInImage.write(outImage, done);
        });
    };
    Opticrop.prototype._random = function (low, high) {
        return Math.floor(Math.random() * (high - low) + low);
    };
    /**
    *  Creates image object in memory using GD library
    */
    Opticrop.prototype._createGdImage = function (fileName, done) {
        gm(fileName).format(function (err, format) {
            if (err) {
                return done('createGdImage error: ' + err);
            }
            var image = null;
            switch (format) {
                case 'JPEG': {
                    image = gd.createFromJpeg(fileName);
                    break;
                }
                case 'PNG': {
                    image = gd.createFromPng(fileName);
                    break;
                }
                case 'GIF': {
                    image = gd.createFromGif(fileName);
                    break;
                }
                default: {
                    return done("Unknown image format: " + format);
                }
            }
            done(null, image);
        });
    };
    return Opticrop;
}());
exports.Opticrop = Opticrop;
