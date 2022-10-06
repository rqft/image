export declare class Color {
    readonly value: number;
    constructor(value: ColorLike);
    rgb(): RGB;
    rgba(): RGBA;
    hsl(): HSL;
    hsla(): HSLA;
    name(): keyof typeof ColorNames;
    static parse(value: ColorLike): number;
    static is_rgb_object(value: object): value is RGB;
    static is_rgba_object(value: object): value is RGBA;
    static is_hsl_object(value: object): value is HSL;
    static is_hsla_object(value: object): value is HSLA;
    static from_rgba(value: RGB | RGBA): number;
    static from_hsla(value: HSL | HSLA): number;
    static hue_to_rgb(p: number, q: number, t: number): number;
    static hue_from_type(hue: number, t: AngleType): number;
    static rgb_to_hsl(rgba: RGB | RGBA): HSLA;
    private static parse_alpha;
    static readonly short_hex_regex: RegExp;
    static readonly long_hex_regex: RegExp;
    static readonly rgb_regex: RegExp;
    static readonly rgb_percentage_regex: RegExp;
    static readonly hsl_regex: RegExp;
}
export declare type ColorLike = Color | keyof typeof ColorNames | number | RGB | RGBA | HSL | HSLA | string;
export interface Alpha {
    a: number;
}
export interface RGB {
    r: number;
    g: number;
    b: number;
}
export interface RGBA extends RGB, Alpha {
}
export interface HSL {
    h: number;
    s: number;
    l: number;
}
export interface HSLA extends HSL, Alpha {
}
export declare type AngleType = "turn" | "grad" | "deg" | "rad";
export declare const ColorNames: {
    aliceblue: number;
    antiquewhite: number;
    aqua: number;
    aquamarine: number;
    azure: number;
    beige: number;
    bisque: number;
    black: number;
    blanchedalmond: number;
    blue: number;
    blueviolet: number;
    brown: number;
    burlywood: number;
    cadetblue: number;
    chartreuse: number;
    chocolate: number;
    coral: number;
    cornflowerblue: number;
    cornsilk: number;
    crimson: number;
    cyan: number;
    darkblue: number;
    darkcyan: number;
    darkgoldenrod: number;
    darkgray: number;
    darkgreen: number;
    darkgrey: number;
    darkkhaki: number;
    darkmagenta: number;
    darkolivegreen: number;
    darkorange: number;
    darkorchid: number;
    darkred: number;
    darksalmon: number;
    darkseagreen: number;
    darkslateblue: number;
    darkslategray: number;
    darkslategrey: number;
    darkturquoise: number;
    darkviolet: number;
    deeppink: number;
    deepskyblue: number;
    dimgray: number;
    dimgrey: number;
    dodgerblue: number;
    firebrick: number;
    floralwhite: number;
    forestgreen: number;
    fuchsia: number;
    gainsboro: number;
    ghostwhite: number;
    gold: number;
    goldenrod: number;
    gray: number;
    green: number;
    greenyellow: number;
    grey: number;
    honeydew: number;
    hotpink: number;
    indianred: number;
    indigo: number;
    ivory: number;
    khaki: number;
    lavender: number;
    lavenderblush: number;
    lawngreen: number;
    lemonchiffon: number;
    lightblue: number;
    lightcoral: number;
    lightcyan: number;
    lightgoldenrodyellow: number;
    lightgray: number;
    lightgreen: number;
    lightgrey: number;
    lightpink: number;
    lightsalmon: number;
    lightseagreen: number;
    lightskyblue: number;
    lightslategray: number;
    lightslategrey: number;
    lightsteelblue: number;
    lightyellow: number;
    lime: number;
    limegreen: number;
    linen: number;
    magenta: number;
    maroon: number;
    mediumaquamarine: number;
    mediumblue: number;
    mediumorchid: number;
    mediumpurple: number;
    mediumseagreen: number;
    mediumslateblue: number;
    mediumspringgreen: number;
    mediumturquoise: number;
    mediumvioletred: number;
    midnightblue: number;
    mintcream: number;
    mistyrose: number;
    moccasin: number;
    navajowhite: number;
    navy: number;
    oldlace: number;
    olive: number;
    olivedrab: number;
    orange: number;
    orangered: number;
    orchid: number;
    palegoldenrod: number;
    palegreen: number;
    paleturquoise: number;
    palevioletred: number;
    papayawhip: number;
    peachpuff: number;
    peru: number;
    pink: number;
    plum: number;
    powderblue: number;
    purple: number;
    rebeccapurple: number;
    red: number;
    rosybrown: number;
    royalblue: number;
    saddlebrown: number;
    salmon: number;
    sandybrown: number;
    seagreen: number;
    seashell: number;
    sienna: number;
    silver: number;
    skyblue: number;
    slateblue: number;
    slategray: number;
    slategrey: number;
    snow: number;
    springgreen: number;
    steelblue: number;
    tan: number;
    teal: number;
    thistle: number;
    tomato: number;
    transparent: number;
    turquoise: number;
    violet: number;
    wheat: number;
    white: number;
    whitesmoke: number;
    yellow: number;
    yellowgreen: number;
};