gm        = require('gm')
async     = require('async')
utils     = require("./utils.js")
gd        = require 'node-gd'

GAMMA = 0.2

class Opticrop
    
  ###
    Sets image to be cropped
  ###
  setImage: (inImage)->
    @_image = inImage
    @
    
  ###
    Sets target width
  ###
  setWidth: (inWidth)->
    @_width = inWidth
    @
    
  ###
    Sets target height
  ###
  setHeight: (inHeight)->
    @_height = inHeight
    @
    
  ###
    Crops image and saves it to outImage
  ###
  cropTo: (outImage, done)->
    return done('Image to me cropped is not set. Please use the setImage() function') unless @_image?
    return done('Cropped image width is not set. Please use the setWidth() function') unless @_width?
    return done('Cropped image height is not set. Please use the setWidth() function') unless @_height?
    
    @_crop(@_image, @_width, @_height, outImage, done)
  
  
  ###
   Smart cropping routine
  ###
  _crop: (inImage, inWidth, inHeight, outImage, done)->
    gmImage   = gm(inImage)
    gmInImage = gm(inImage)
    
    async.auto
      size: (cb)->
        gmImage.size (err, val)->
          cb err, val
            
      createEdgedImage: ['size', (cb, results)=>
        if (inWidth > results.size.width) or (inHeight > results.size.height)
          return cb "Target dimensions must be smaller or equal to source dimensions."
        
        edgeFilterRadius = 1
        gmImage.edge(edgeFilterRadius)
        .modulate(100, 0, 100)
        .blackThreshold(15, 15, 15)
        .write outImage, (err)->
          cb err, {resultFile: outImage}
      ]
      ,calculateCenter: ['size', 'createEdgedImage', (cb, results)=>
        @_createGdImage results.createEdgedImage.resultFile, (err, gdImage)=>
          if(err)  
            console.log err
            return cb err
          xcenter = 0
          ycenter = 0
          sum = 0
          n = 100000
           
          for k in [0...n]
              i = utils.random(0, results.size.width - 1) #mt_rand(0, $w0-1);
              j = utils.random(0, results.size.height - 1) #mt_rand(0, $h0-1);
              # get blue (why blue???) channels value
              val = gdImage.imageColorAt(i, j) & 0xFF#pixels.get(j, i, 2) #imagecolorat($im, $i, $j) & 0xFF;
              sum += val
              xcenter += (i+1)*val
              ycenter += (j+1)*val
          xcenter /= sum
          ycenter /= sum
           
          
          # crop source img to target AR
          targetAspectRatio = inWidth/inHeight 
          if (results.size.width/results.size.height > targetAspectRatio) 
              # source AR wider than target
              # crop width to target AR
              wcrop0 = Math.round(targetAspectRatio*results.size.height)
              hcrop0 = results.size.height
          else 
              # crop height to target AR
              wcrop0 = results.size.width
              hcrop0 = Math.round(results.size.width/targetAspectRatio)
          
          #
          # crop at different scales
          #
          
          #scale count: number of crop sizes to try
          nk = 9
          hgap = hcrop0 - inHeight
          hinc = (nk == 1) ? 0 : hgap / (nk - 1)
          wgap = wcrop0 - inWidth
          winc = (nk == 1) ? 0 : wgap / (nk - 1)
          
          # find window with highest normalized edginess
          n = 10000
          maxbetanorm = 0
#          maxfile = ''
          maxparam = {'w':0, 'h':0, 'x':0, 'y':0}
          w0 = results.size.width
          h0 = results.size.height
          for k in [0...nk]
              hcrop = Math.round(hcrop0 - k*hinc);
              wcrop = Math.round(wcrop0 - k*winc);
              xcrop = xcenter - wcrop / 2
              ycrop = ycenter - hcrop / 2

              xcrop = 0 if (xcrop < 0) 
              xcrop = w0-wcrop if (xcrop+wcrop > w0) 
              ycrop = 0 if (ycrop < 0) 
              ycrop = h0-hcrop if (ycrop+hcrop > h0) 

              beta = 0
              for c in [0...n]
                i = utils.random(0, wcrop-1)
                j = utils.random(0, hcrop-1)
                # get blue (why blue???) channels value
                beta += gdImage.imageColorAt(i, j) & 0xFF #pixels.get(ycrop+j, xcrop+i, 2)  
              area = wcrop * hcrop;
              betanorm = beta / (n*Math.pow(area, GAMMA-1));

              # best image found, save it
              if (betanorm > maxbetanorm) 
                  maxbetanorm = betanorm
                  maxparam['w'] = wcrop
                  maxparam['h'] = hcrop
                  maxparam['x'] = xcrop
                  maxparam['y'] = ycrop
           # calling of teh destroy() crashes app with 'segmentation fault' when many images are cropped       
#          gdImage.destroy()
          cb null, {
            width: maxparam['w']
            height: maxparam['h']
            x: maxparam['x']
            y: maxparam['y']
          }
      ]
      ,cropImage: ['calculateCenter', (cb, result)=>
        gmInImage.crop(result.calculateCenter.width, result.calculateCenter.height,
          result.calculateCenter.x, result.calculateCenter.y)
        
        cb null 
      ]
      ,scaleImage: ['calculateCenter', 'cropImage', (cb, result)=>
        gmInImage.scale(inWidth, inHeight)
        cb null 
      ]
    ,(err, results)=>
      return done err if err
      
      gmInImage.write outImage, (err)=>
        done err
      
  ###
    Creates image object in memory using GD library
  ###
  _createGdImage: (inFile, done)->
    gm(inFile).format (err, format)=>
      return done("_createGdImage error: " + err) if err
      
      switch format
        when "JPEG" then image = gd.createFromJpeg(inFile)
        when "PNG"  then image = gd.createFromPng(inFile)
        when "GIF"  then image = gd.createFromGif(inFile)
        else return done "Unknown image format: #{format}"
        
      done null, image
  
      
module.exports = Opticrop