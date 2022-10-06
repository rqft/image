import { Color, ColorLike } from "./color";
import { TypedArray } from "./typed-arrays";
export declare class Editor {
    width: number;
    height: number;
    u8: TypedArray.u8;
    view: DataView;
    u32: TypedArray.u32;
    constructor(width: number, height: number, source?: BufferSource);
    clone(): Editor;
    get(x: number, y: number): number;
    set(x: number, y: number, value: number): this;
    resize_nearest(width: number, height: number): this;
    flip_horizontal(): this;
    flip_vertical(): this;
    fill(value: ColorLike): this;
    fill_with(source: (x: number, y: number) => ColorLike): this;
    map(source: (value: Color, x: number, y: number) => ColorLike): this;
    saturation_additive(amount: number, scalar?: boolean): this;
    luminosity(amount: number, scalar?: boolean): this;
    rotate(degrees: number, resize?: boolean): this;
}
