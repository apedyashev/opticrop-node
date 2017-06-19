const gm = require('gm');
const async = require('async');
const gd  = require('node-gd');
const Promise = require('bluebird');

const GAMMA = 0.2;
export type DoneCallback = (err?: any, data?: any) => void;
export type ImageSize = {width: number, height: number};
export type AutoFlowResult = {
  size: ImageSize,
  createEdgedImage: {resultFile: string},
  calculateCenter: {width: number, height: number, x: number, y: number},
};

export class Opticrop {
  private image: string;
  private width: number;
  private height: number;

  /**
   *  Sets image to be cropped
   */
  public setImage(imageFile: string) {
    this.image = imageFile;
    return this;
  }

  /**
   *  Sets target width
   */
  public setWidth(width: number) {
    this.width = width;
    return this;
  }

  /**
   *  Sets target height
   */
  public setHeight(height: number) {
    this.height = height;
    return this;
  }

  /**
   *  Crops image and saves it to outImage
   */
  public cropTo(outImage: string, done: DoneCallback) {
    if (done) {
      return this._cropTo(outImage, done);
    }
    const cropTo = Promise.promisify(this._cropTo, {context: this});
    return cropTo(outImage);
  }

  /**
   * Cropping routine that conforms to node.js convention of accepting a callback as last argumen
   */
  private _cropTo(outImage: string, done: DoneCallback) {
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
  }


  /**
   * Smart cropping routine
   */
  private _crop(inImage: string, inWidth: number, inHeight: number, outImage: string, done: DoneCallback) {
    const gmImage   = gm(inImage);
    const gmInImage = gm(inImage);

    async.auto({
      size(cb: DoneCallback) {
        gmImage.size((err: any, val: ImageSize) => {
          cb(err, val);
        });
      },

      createEdgedImage: ['size', (cb: DoneCallback, results: AutoFlowResult) => {
        if ((inWidth > results.size.width) || (inHeight > results.size.height)) {
          return cb('Target dimensions must be smaller or equal to source dimensions.');
        }

        const edgeFilterRadius = 1;
        gmImage.edge(edgeFilterRadius)
        .modulate(100, 0, 100)
        .blackThreshold(15, 15, 15)
        .write(outImage, (err: any) => {
          cb(err, {resultFile: outImage});
        });
      }],

      calculateCenter: ['size', 'createEdgedImage', (cb: DoneCallback, results: AutoFlowResult) => {
        this._createGdImage(results.createEdgedImage.resultFile, (err, gdImage) => {
          if (err) {
            return cb(err);
          }

          let n = 100000;
          let xcenter = 0;
          let ycenter = 0;
          let sum = 0;

          for (let k = 0; k < n; k++) {
            const i = this._random(0, results.size.width - 1);
            const j = this._random(0, results.size.height - 1);
            // get blue (why blue???) channels value
            const val = gdImage.imageColorAt(i, j) & 0xFF;
            sum += val;
            xcenter += (i + 1) * val;
            ycenter += (j + 1) * val;
          }

          xcenter /= sum;
          ycenter /= sum;

          // crop source img to target AR
          const targetAspectRatio = inWidth / inHeight;
          let wcrop0 = 0;
          let hcrop0 = 0;
          if ((results.size.width / results.size.height) > targetAspectRatio) {
            // source AR wider than target
            // crop width to target AR
            wcrop0 = Math.round(targetAspectRatio * results.size.height);
            hcrop0 = results.size.height;
          } else {
            // crop height to target AR
            wcrop0 = results.size.width;
            hcrop0 = Math.round(results.size.width / targetAspectRatio);
          }


          ///////////////////////////
          // crop at different scales
          ///////////////////////////

          // scale count: number of crop sizes to try
          const nk: number = 9;
          const hgap = hcrop0 - inHeight;
          const hinc = (nk === 1) ? 0 : hgap / (nk - 1);
          const wgap = wcrop0 - inWidth;
          const winc = (nk === 1) ? 0 : wgap / (nk - 1);

          // find window with highest normalized edginess
          n = 10000;
          let maxbetanorm = 0;
          const maxparam = {w: 0, h: 0, x: 0, y: 0};
          const w0 = results.size.width;
          const h0 = results.size.height;

          // for k in [0...nk]
          for (let k = 0; k < nk; k++) {
            const hcrop = Math.round(hcrop0 - k * hinc);
            const wcrop = Math.round(wcrop0 - k * winc);
            let xcrop = xcenter - wcrop / 2;
            let ycrop = ycenter - hcrop / 2;

            if (xcrop < 0) {
              xcrop = 0;
            }
            if ((xcrop + wcrop) > w0) {
              xcrop = w0 - wcrop;
            }
            if (ycrop < 0) {
              ycrop = 0;
            }
            if ((ycrop + hcrop) > h0) {
              ycrop = h0 - hcrop;
            }

            let beta = 0;
            // for c in [0...n]
            for (let c = 0; c < n; c++) {
              const i = this._random(0, wcrop - 1);
              const j = this._random(0, hcrop - 1);
              // get blue (why blue???) channels value
              beta += gdImage.imageColorAt(i, j) & 0xFF;
            }
            const area = wcrop * hcrop;
            const betanorm = beta / (n * Math.pow(area, GAMMA - 1));

            // best image found, save it
            if (betanorm > maxbetanorm) {
              maxbetanorm = betanorm;
              maxparam.w = wcrop;
              maxparam.h = hcrop;
              maxparam.x = xcrop;
              maxparam.y = ycrop;
            }
          }

          cb(null, {
            height: maxparam.h,
            width: maxparam.w,
            x: maxparam.x,
            y: maxparam.y,
          });
        });
      }],

      cropImage: ['calculateCenter', (cb: DoneCallback, result: AutoFlowResult) => {
        gmInImage.crop(
          result.calculateCenter.width,
          result.calculateCenter.height,
          result.calculateCenter.x,
          result.calculateCenter.y,
        );
        cb();
      }],

      scaleImage: ['calculateCenter', 'cropImage', (cb: DoneCallback) => {
        gmInImage.scale(inWidth, inHeight);
        cb(null);
      }],
    }, (err: any) => {
      if (err) {
        return done(err);
      }

      gmInImage.write(outImage, done);
    });
  }

  private _random(low: number, high: number) {
    return Math.floor(Math.random() * (high - low) + low);
  }

  /**
   *  Creates image object in memory using GD library
   */
  private _createGdImage(fileName: string, done: DoneCallback) {
    gm(fileName).format((err: any, format: string) => {
      if (err) {
        return done('createGdImage error: ' + err);
      }

      let image = null;
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
          return done(`Unknown image format: ${format}`);
        }
      }

      done(null, image);
    });
  }

}
