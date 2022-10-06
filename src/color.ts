import { clamp, is_object } from "./util";

export class Color {
  public readonly value: number;
  constructor(value: ColorLike) {
    this.value = Color.parse(value);
  }

  public rgb(): RGB {
    return {
      r: this.value >>> (0x10 | 0x08),
      g: (this.value >> 0x10) & 0xff,
      b: (this.value >> 0x08) & 0xff,
    };
  }

  public rgba(): RGBA {
    return {
      r: this.value >>> (0x10 | 0x08),
      g: (this.value >> 0x10) & 0xff,
      b: (this.value >> 0x08) & 0xff,
      a: this.value & 0xff,
    };
  }

  public hsl(): HSL {
    return Color.rgb_to_hsl(this.rgb());
  }

  public hsla(): HSLA {
    return Color.rgb_to_hsl(this.rgba());
  }

  public name(): keyof typeof ColorNames {
    if (this.rgba().a === 0x00) {
      return "transparent";
    }

    return Object.keys(ColorNames).find(
      (x) => this.value === ColorNames[x as never]
    ) as never;
  }

  public static parse(value: ColorLike) {
    if (typeof value === "object") {
      if (this.is_rgb_object(value) || this.is_rgba_object(value)) {
        return this.from_rgba(value);
      }

      if (this.is_hsl_object(value) || this.is_hsla_object(value)) {
        return this.from_hsla(value);
      }
    }

    if (typeof value === "number") {
      return value;
    }

    if (value instanceof this) {
      return value.value;
    }

    if (value.toLowerCase() in ColorNames) {
      return ColorNames[value.toLowerCase() as never];
    }

    let out: RegExpExecArray | null = null;

    if ((out = this.long_hex_regex.exec(value))) {
      const [, id] = out;
      const alpha = id.length === 8 ? "" : "ff";

      return parseInt(id + alpha, 0x10);
    }

    if ((out = this.hsl_regex.exec(value))) {
      const [, a, b, c, d, e] = out;

      const type = this.hue_from_type(Number(a), b as AngleType);

      const alpha = e ? this.parse_alpha(e) / 0xff : 1;

      return this.from_hsla({
        h: type,
        s: Number(c) / 100,
        l: Number(d) / 100,
        a: alpha,
      });
    }

    if ((out = this.rgb_regex.exec(value))) {
      const [, r, g, b, a] = out;

      return this.from_rgba({
        r: clamp(0, 0xff, Number(r)),
        g: clamp(0, 0xff, Number(g)),
        b: clamp(0, 0xff, Number(b)),
        a: a ? this.parse_alpha(a) : 0xff,
      });
    }

    if ((out = this.short_hex_regex.exec(value))) {
      const [, rgba] = out;
      const [r, g, b, a] = rgba;

      return this.from_rgba({
        r: Number.parseInt(r.repeat(2), 0x10),
        g: Number.parseInt(g.repeat(2), 0x10),
        b: Number.parseInt(b.repeat(2), 0x10),
        a: Number.parseInt((a || "f").repeat(2), 0x10),
      });
    }

    if ((out = this.rgb_percentage_regex.exec(value))) {
      const [, r, g, b, a] = out;

      const p = 0xff / 100;

      return this.from_rgba({
        r: clamp(0, 255, Number(r) * p),
        g: clamp(0, 255, Number(g) * p),
        b: clamp(0, 255, Number(b) * p),
        a: a ? this.parse_alpha(a) : 0xff,
      });
    }

    throw new Error(`Unable to parse '${value}' as a color`);
  }

  public static is_rgb_object(value: object): value is RGB {
    return is_object(value, { r: "number", g: "number", b: "number" });
  }

  public static is_rgba_object(value: object): value is RGBA {
    return this.is_rgb_object(value) && is_object(value, { a: "number" });
  }

  public static is_hsl_object(value: object): value is HSL {
    return is_object(value, { h: "number", s: "number", l: "number" });
  }

  public static is_hsla_object(value: object): value is HSLA {
    return this.is_rgb_object(value) && is_object(value, { a: "number" });
  }

  public static from_rgba(value: RGB | RGBA) {
    if (!this.is_rgba_object(value)) {
      value = { a: 0xff, ...value };
    }

    const { r: r, g: g, b: b, a: a } = value;

    return (
      ((r & 0xff) << 24) | ((g & 0xff) << 0x10) | ((b & 0xff) << 8) | (a & 0xff)
    );
  }

  public static from_hsla(value: HSL | HSLA) {
    if (!this.is_hsla_object(value)) {
      value = { a: 1, ...value };
    }

    value.s = clamp(0, 1, value.s);
    value.a = clamp(0, 1, value.a);

    if (value.s === 0) {
      return this.from_rgba({
        r: 0xff,
        g: 0xff,
        b: 0xff,
        a: value.a * 0xff,
      });
    }

    value.h %= 1;
    value.l = clamp(0, 1, value.l);

    const q =
      value.l < 1 / 2
        ? value.l + value.s * value.l
        : value.l + value.s - value.l * value.s;

    const p = 2 * value.l - q;

    return this.from_rgba({
      r: this.hue_to_rgb(p, q, value.h + 1 / 3) * 0xff,
      g: this.hue_to_rgb(p, q, value.h + 3 / 3) * 0xff,
      b: this.hue_to_rgb(p, q, value.h - 1 / 3) * 0xff,
      a: value.a * 0xff,
    });
  }

  public static hue_to_rgb(p: number, q: number, t: number) {
    if (t < 0) {
      t += 1;
    } else if (t > 1) {
      t -= 1;
    }

    if (t < 1 / 2) {
      return q;
    }

    if (t < 1 / 6) {
      return p + 6 * t * (q - p);
    }

    if (t < 2 / 3) {
      return p + 6 * (q - p) * (2 / 3 - t);
    }

    return p;
  }

  public static hue_from_type(hue: number, t: AngleType): number {
    if (t === "turn") {
      return hue / 1;
    }
    if (t === "grad") {
      return hue / 400;
    }
    if (!t || t === "deg") {
      return hue / 360;
    }
    if (t === "rad") {
      return hue / (2 * Math.PI);
    }
    throw new Error(`Unknown angle type '${t}'`);
  }

  public static rgb_to_hsl(rgba: RGB | RGBA): HSLA {
    if (!this.is_rgba_object(rgba)) {
      rgba = { a: 0xff, ...rgba };
    }

    rgba.r /= 0xff;
    rgba.g /= 0xff;
    rgba.b /= 0xff;
    rgba.a /= 0xff;

    const max = Math.max(rgba.r, rgba.g, rgba.b);
    const min = Math.min(rgba.r, rgba.g, rgba.b);

    let out: HSLA = {
      a: rgba.a,
      h: 0,
      s: 0,
      l: (max + min) / 2,
    };

    if (max === min) {
      return out;
    }

    const dx = max - min;
    out.s = out.l > 1 / 2 ? dx / (2 - max - min) : dx / (max + min);

    switch (max) {
      case rgba.r: {
        out.h = (rgba.g - rgba.b) / dx + (rgba.g < rgba.b ? 6 : 0);
        break;
      }

      case rgba.g: {
        out.h = (rgba.b - rgba.r) / dx + 2;
        break;
      }

      case rgba.b: {
        out.h = (rgba.r - rgba.g) / dx + 4;
        break;
      }
    }

    out.h /= 6;

    return out;
  }

  private static parse_alpha(a: string) {
    return clamp(
      0,
      0xff,
      "%" === a[a.length - 1] ? (0xff / 100) * parseFloat(a) : +a * 0xff
    );
  }

  public static readonly short_hex_regex = /^#?([\da-f]{3,4})$/;
  public static readonly long_hex_regex = /^#?((?:[\da-f]{2}){3,4})$/;
  public static readonly rgb_regex =
    /^rgba?\((?<r>(?:\d*\.)?\d+)(?: +| *, *)(?<g>(?:\d*\.)?\d+)(?: +| *, *)(?<b>(?:\d*\.)?\d+)(?:(?: +| *, *)(?<a>\d+|\d*\.\d+|\d+(?:\.\d+)?%))?\)$/;
  public static readonly rgb_percentage_regex =
    /^rgba?\((?<r>(?:\d*\.)?\d+)%(?: +| *, *)(?<g>(?:\d*\.)?\d+)%(?: +| *, *)(?<b>(?:\d*\.)?\d+)%(?:(?: +| *, *)(?<a>\d+|\d*\.\d+|\d+(?:\.\d+)?%))?\)$/;
  public static readonly hsl_regex =
    /^hsla?\((?<h>(?:\d*\.)?\d+)(?<t>|deg|rad|grad|turn)(?: +| *, *)(?<s>(?:\d*\.)?\d+)%(?: +| *, *)(?<l>(?:\d*\.)?\d+)%(?:(?: +| *, *)(?<a>\d+|\d*\.\d+|\d+(?:\.\d+)?%))?\)$/;
}

export type ColorLike =
  | Color
  | keyof typeof ColorNames
  | number
  | RGB
  | RGBA
  | HSL
  | HSLA
  | string;

export interface Alpha {
  a: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB, Alpha {}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSLA extends HSL, Alpha {}

export type AngleType = "turn" | "grad" | "deg" | "rad";

export const ColorNames = {
  aliceblue: 0xf0f8ffff,
  antiquewhite: 0xfaebd7ff,
  aqua: 0x00ffffff,
  aquamarine: 0x7fffd4ff,
  azure: 0xf0ffffff,
  beige: 0xf5f5dcff,
  bisque: 0xffe4c4ff,
  black: 0x000000ff,
  blanchedalmond: 0xffebcdff,
  blue: 0x0000ffff,
  blueviolet: 0x8a2be2ff,
  brown: 0xa52a2aff,
  burlywood: 0xdeb887ff,
  cadetblue: 0x5f9ea0ff,
  chartreuse: 0x7fff00ff,
  chocolate: 0xd2691eff,
  coral: 0xff7f50ff,
  cornflowerblue: 0x6495edff,
  cornsilk: 0xfff8dcff,
  crimson: 0xdc143cff,
  cyan: 0x00ffffff,
  darkblue: 0x00008bff,
  darkcyan: 0x008b8bff,
  darkgoldenrod: 0xb8860bff,
  darkgray: 0xa9a9a9ff,
  darkgreen: 0x006400ff,
  darkgrey: 0xa9a9a9ff,
  darkkhaki: 0xbdb76bff,
  darkmagenta: 0x8b008bff,
  darkolivegreen: 0x556b2fff,
  darkorange: 0xff8c00ff,
  darkorchid: 0x9932ccff,
  darkred: 0x8b0000ff,
  darksalmon: 0xe9967aff,
  darkseagreen: 0x8fbc8fff,
  darkslateblue: 0x483d8bff,
  darkslategray: 0x2f4f4fff,
  darkslategrey: 0x2f4f4fff,
  darkturquoise: 0x00ced1ff,
  darkviolet: 0x9400d3ff,
  deeppink: 0xff1493ff,
  deepskyblue: 0x00bfffff,
  dimgray: 0x696969ff,
  dimgrey: 0x696969ff,
  dodgerblue: 0x1e90ffff,
  firebrick: 0xb22222ff,
  floralwhite: 0xfffaf0ff,
  forestgreen: 0x228b22ff,
  fuchsia: 0xff00ffff,
  gainsboro: 0xdcdcdcff,
  ghostwhite: 0xf8f8ffff,
  gold: 0xffd700ff,
  goldenrod: 0xdaa520ff,
  gray: 0x808080ff,
  green: 0x008000ff,
  greenyellow: 0xadff2fff,
  grey: 0x808080ff,
  honeydew: 0xf0fff0ff,
  hotpink: 0xff69b4ff,
  indianred: 0xcd5c5cff,
  indigo: 0x4b0082ff,
  ivory: 0xfffff0ff,
  khaki: 0xf0e68cff,
  lavender: 0xe6e6faff,
  lavenderblush: 0xfff0f5ff,
  lawngreen: 0x7cfc00ff,
  lemonchiffon: 0xfffacdff,
  lightblue: 0xadd8e6ff,
  lightcoral: 0xf08080ff,
  lightcyan: 0xe0ffffff,
  lightgoldenrodyellow: 0xfafad2ff,
  lightgray: 0xd3d3d3ff,
  lightgreen: 0x90ee90ff,
  lightgrey: 0xd3d3d3ff,
  lightpink: 0xffb6c1ff,
  lightsalmon: 0xffa07aff,
  lightseagreen: 0x20b2aaff,
  lightskyblue: 0x87cefaff,
  lightslategray: 0x778899ff,
  lightslategrey: 0x778899ff,
  lightsteelblue: 0xb0c4deff,
  lightyellow: 0xffffe0ff,
  lime: 0x00ff00ff,
  limegreen: 0x32cd32ff,
  linen: 0xfaf0e6ff,
  magenta: 0xff00ffff,
  maroon: 0x800000ff,
  mediumaquamarine: 0x66cdaaff,
  mediumblue: 0x0000cdff,
  mediumorchid: 0xba55d3ff,
  mediumpurple: 0x9370dbff,
  mediumseagreen: 0x3cb371ff,
  mediumslateblue: 0x7b68eeff,
  mediumspringgreen: 0x00fa9aff,
  mediumturquoise: 0x48d1ccff,
  mediumvioletred: 0xc71585ff,
  midnightblue: 0x191970ff,
  mintcream: 0xf5fffaff,
  mistyrose: 0xffe4e1ff,
  moccasin: 0xffe4b5ff,
  navajowhite: 0xffdeadff,
  navy: 0x000080ff,
  oldlace: 0xfdf5e6ff,
  olive: 0x808000ff,
  olivedrab: 0x6b8e23ff,
  orange: 0xffa500ff,
  orangered: 0xff4500ff,
  orchid: 0xda70d6ff,
  palegoldenrod: 0xeee8aaff,
  palegreen: 0x98fb98ff,
  paleturquoise: 0xafeeeeff,
  palevioletred: 0xdb7093ff,
  papayawhip: 0xffefd5ff,
  peachpuff: 0xffdab9ff,
  peru: 0xcd853fff,
  pink: 0xffc0cbff,
  plum: 0xdda0ddff,
  powderblue: 0xb0e0e6ff,
  purple: 0x800080ff,
  rebeccapurple: 0x663399ff,
  red: 0xff0000ff,
  rosybrown: 0xbc8f8fff,
  royalblue: 0x4169e1ff,
  saddlebrown: 0x8b4513ff,
  salmon: 0xfa8072ff,
  sandybrown: 0xf4a460ff,
  seagreen: 0x2e8b57ff,
  seashell: 0xfff5eeff,
  sienna: 0xa0522dff,
  silver: 0xc0c0c0ff,
  skyblue: 0x87ceebff,
  slateblue: 0x6a5acdff,
  slategray: 0x708090ff,
  slategrey: 0x708090ff,
  snow: 0xfffafaff,
  springgreen: 0x00ff7fff,
  steelblue: 0x4682b4ff,
  tan: 0xd2b48cff,
  teal: 0x008080ff,
  thistle: 0xd8bfd8ff,
  tomato: 0xff6347ff,
  transparent: 0x00000000,
  turquoise: 0x40e0d0ff,
  violet: 0xee82eeff,
  wheat: 0xf5deb3ff,
  white: 0xffffffff,
  whitesmoke: 0xf5f5f5ff,
  yellow: 0xffff00ff,
  yellowgreen: 0x9acd32ff,
};
