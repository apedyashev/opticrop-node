export declare type DoneCallback = (err?: any, data?: any) => void;
export declare type ImageSize = {
    width: number;
    height: number;
};
export declare type AutoFlowResult = {
    size: ImageSize;
    createEdgedImage: {
        resultFile: string;
    };
    calculateCenter: {
        width: number;
        height: number;
        x: number;
        y: number;
    };
};
export declare class Opticrop {
    private image;
    private width;
    private height;
    /**
     *  Sets image to be cropped
     */
    setImage(imageFile: string): this;
    /**
     *  Sets target width
     */
    setWidth(width: number): this;
    /**
     *  Sets target height
     */
    setHeight(height: number): this;
    /**
     *  Crops image and saves it to outImage
     */
    cropTo(outImage: string, done: DoneCallback): any;
    /**
     * Cropping routine that conforms to node.js convention of accepting a callback as last argumen
     */
    private _cropTo(outImage, done);
    /**
     * Smart cropping routine
     */
    private _crop(inImage, inWidth, inHeight, outImage, done);
    private _random(low, high);
    /**
     *  Creates image object in memory using GD library
     */
    private _createGdImage(fileName, done);
}
