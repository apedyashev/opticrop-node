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
    image: string;
    width: number;
    height: number;
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
    _cropTo(outImage: string, done: DoneCallback): void;
    /**
    * Smart cropping routine
    */
    _crop(inImage: string, inWidth: number, inHeight: number, outImage: string, done: DoneCallback): void;
    _random(low: number, high: number): number;
    /**
    *  Creates image object in memory using GD library
    */
    _createGdImage(fileName: string, done: DoneCallback): void;
}
