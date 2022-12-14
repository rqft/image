import { Color, ColorLike } from "./color";
import { TypedArray } from "./typed-arrays";
import { clamp, view } from "./util";
// hm
export class Editor {
  public u8: TypedArray.u8;
  public view: DataView;
  public u32: TypedArray.u32;

  constructor(
    public width: number,
    public height: number,
    source?: BufferSource
  ) {
    this.width = this.width | 0;
    this.height = this.height | 0;

    if (source) {
      this.u8 = view(source);
    } else {
      this.u8 = new TypedArray.u8(4 * this.width * this.height);
    }

    this.view = new DataView(
      this.u8.buffer,
      this.u8.byteOffset,
      this.u8.byteLength
    );

    this.u32 = new Uint32Array(
      this.u8.buffer,
      this.u8.byteOffset,
      this.u8.byteLength / 4
    );

    if (this.u8.length !== 4 * this.width * this.height) {
      throw new RangeError("Invalid buffer capacity");
    }
  }

  public clone(): Editor {
    return new Editor(this.width, this.height, this.u8);
  }

  public get(x: number, y: number): Color {
    x |= 0;
    y |= 0;

    if (x < 0 || x > this.width) {
      throw new RangeError(`x value out of bounds {0 <= x <= ${this.width}}`);
    }

    if (y < 0 || y > this.height) {
      throw new RangeError(`y value out of bounds {0 <= y <= ${this.height}}`);
    }

    return new Color(this.view.getUint32(x + y * this.width, false));
  }

  public set(x: number, y: number, value: ColorLike): this {
    x |= 0;
    y |= 0;

    if (x < 0 || x > this.width) {
      throw new RangeError(`x value out of bounds {0 <= x <= ${this.width}}`);
    }

    if (y < 0 || y > this.height) {
      throw new RangeError(`y value out of bounds {0 <= y <= ${this.height}}`);
    }

    this.view.setUint32(x + y * this.width, Color.parse(value), false);
    return this;
  }

  public resize_nearest(width: number, height: number): Editor {
    width = width | 0;
    height = height | 0;

    const old = this.u32;
    const [old_width, old_height] = [this.width, this.height];

    const u32 = (this.u32 = new Uint32Array(width * height));

    const dw = 1 / width;
    const dh = 1 / height;

    const xw = dw * old_width;
    const yw = dh * old_height;

    for (let y = 0; y < height; y++) {
      const yo = y * width;
      const yy = old_width * (y * yw);

      for (let x = 0; x < width; x++) {
        u32[x + yo] = old[yy + x * xw];
      }
    }

    this.width = width as never;
    this.height = height as never;
    this.u8 = new Uint8Array(u32.buffer);
    this.view = new DataView(u32.buffer);

    return this as never;
  }

  public flip_horizontal(): this {
    let offset = 0;

    for (let y = 0; y < this.height; y++) {
      this.u32.subarray(offset, (offset += this.width)).reverse();
    }

    return this;
  }

  public flip_vertical(): this {
    for (let y = 0; y < this.height; y++) {
      const y_offset = y * this.width;
      const reverse_offset = this.width * (Math.floor(this.height / 2) - 1 - y);

      for (let x = 0; x < this.width; x++) {
        const x_offset = x + y_offset;
        const x_outset = x + reverse_offset;

        const top = this.u32[x_offset];
        const bottom = this.u32[x_outset];

        this.u32[x_outset] = top;
        this.u32[x_offset] = bottom;
      }
    }

    return this;
  }

  public fill(value: ColorLike) {
    value = Color.parse(value);
    this.view.setUint32(0, value);
    this.u32.fill(this.u32[0]!);

    return this;
  }

  public fill_with(source: (x: number, y: number) => ColorLike): this {
    let offset = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.height; x++) {
        this.view.setUint32(offset, Color.parse(source(x, y)), false);
        offset += 4;
      }
    }

    return this;
  }

  public map(source: (value: Color, x: number, y: number) => ColorLike): this {
    return this.fill_with((x, y) => {
      return source(new Color(this.get(x, y)), x, y);
    });
  }

  // HSLA modifiers
  public saturation(type: ModifyType, amount: number) {
    return this.map((value) => {
      const hsla = value.hsla();

      switch (type) {
        case "add": {
          hsla.s += amount;
          break;
        }
        case "scale": {
          hsla.s *= amount;
          break;
        }
        case "value": {
          hsla.s = amount;
          break;
        }
      }

      hsla.s = clamp(0, 1, hsla.l);

      return hsla;
    });
  }

  public luminosity(type: ModifyType, amount: number) {
    return this.map((value) => {
      const hsla = value.hsla();

      switch (type) {
        case "add": {
          hsla.l += amount;
          break;
        }
        case "scale": {
          hsla.l *= amount;
          break;
        }
        case "value": {
          hsla.l = amount;
          break;
        }
      }

      hsla.l = clamp(0, 1, hsla.l);

      return hsla;
    });
  }

  public hue_shift(amount: number) {
    amount %= 360;
    return this.map((value) => {
      const hsla = value.hsla();

      hsla.h += amount;

      if (hsla.h < 0) {
        hsla.h = 360 - hsla.h;
      }

      hsla.h %= 360;

      return hsla;
    });
  }

  /**
   * @alias grayscale
   */
  public greyscale() {
    return this.saturation("value", 0);
  }

  /**
   * @alias greyscale
   */
  public grayscale() {
    return this.saturation("value", 0);
  }

  // RGBA modifiers

  public red(type: ModifyType, amount: number) {
    return this.map((value) => {
      const rgba = value.rgba();

      switch (type) {
        case "add": {
          rgba.r += amount;
          break;
        }
        case "scale": {
          rgba.r *= amount;
          break;
        }
        case "value": {
          rgba.r = amount;
          break;
        }
      }

      rgba.r = clamp(0x00, 0xff, rgba.r);

      return rgba;
    });
  }

  public green(type: ModifyType, amount: number) {
    return this.map((value) => {
      const rgba = value.rgba();

      switch (type) {
        case "add": {
          rgba.g += amount;
          break;
        }
        case "scale": {
          rgba.g *= amount;
          break;
        }
        case "value": {
          rgba.g = amount;
          break;
        }
      }

      rgba.r = clamp(0x00, 0xff, rgba.r);

      return rgba;
    });
  }

  public blue(type: ModifyType, amount: number) {
    return this.map((value) => {
      const rgba = value.rgba();

      switch (type) {
        case "add": {
          rgba.b += amount;
          break;
        }
        case "scale": {
          rgba.b *= amount;
          break;
        }
        case "value": {
          rgba.b = amount;
          break;
        }
      }

      rgba.b = clamp(0x00, 0xff, rgba.r);

      return rgba;
    });
  }

  public alpha(type: ModifyType, amount: number) {
    return this.map((value) => {
      const rgba = value.rgba();

      switch (type) {
        case "add": {
          rgba.a += amount;
          break;
        }
        case "scale": {
          rgba.a *= amount;
          break;
        }
        case "value": {
          rgba.a = amount;
          break;
        }
      }

      rgba.a = clamp(0x00, 0xff, rgba.r);

      return rgba;
    });
  }

  public opacity(type: ModifyType, amount: number): this {
    return this.alpha(type, amount);
  }

  // other

  public invert(type: InvertType) {
    if (type === "all") {
      return this.map(({ value }) => {
        return ((0xffffffff - value) & 0xffffff00) | (value & 0xff);
      });
    }

    return this.map((color) => {
      const hsla = color.hsla();
      switch (type) {
        case "luminosity": {
          hsla.l = 1 - hsla.l;
          return hsla;
        }

        case "saturation": {
          hsla.s = 1 - hsla.s;
          return hsla;
        }

        case "luminosity": {
          hsla.l = 1 - hsla.l;
          return hsla;
        }

        default: {
          throw new RangeError(`Unknown inversion type '${type}'`);
        }
      }
    });
  }

  public crop([x1, y1]: [number, number], [x2, y2]: [number, number]): Editor {
    if (x1 >= x2 || y1 >= y2) {
      throw new RangeError(
        "ending point must be larger than the starting point"
      );
    }

    const out = Editor.new(x2 - x1, y2 - y1);
  }

  public rotate(degrees: number, resize: boolean = false): this {
    degrees %= 360;
    degrees |= 0;

    if (degrees < 0) {
      degrees = 360 - degrees;
    }

    switch (degrees) {
      case 0: {
        return this;
      }

      case 180: {
        this.u32.reverse();
        return this;
      }

      case 90: {
        const { width, height, u32: old } = this;

        this.width = height as never;
        this.height = width as never;

        for (let y = 0; y < width; y++) {
          const y_offset = y * width;
          const s_offset = y + width * (width - 1);

          for (let x = 0; x < height; x++) {
            this.u32[s_offset - x * width] = old[x + y_offset];
          }
        }

        return this;
      }

      case 270: {
        return this.rotate(180).rotate(90);
      }

      default: {
        const rad = Math.PI * ((360 - degrees) / 180);

        const [sin, cos] = [Math.sin(rad), Math.cos(rad)];

        const width = resize
          ? Math.abs(this.width * sin) + Math.abs(this.height * cos)
          : this.width;

        const height = resize
          ? Math.abs(this.width * cos) + Math.abs(this.height * sin)
          : this.height;

        const is_same_size = width === this.width && height === this.height;

        const input = is_same_size ? this.clone() : this;
        const output = {
          width,
          height,
          u8: is_same_size ? this.u8 : new Uint8Array(4 * width * height),
        };

        const out_x = (width - 1) / 2;
        const out_y = (height - 1) / 2;

        const source_x = (this.width - 1) / 2;
        const source_y = (this.height - 1) / 2;

        let h = 0;

        do {
          let w = 0;
          const y_sin = source_x - sin * (h - out_y);
          const y_cos = source_y - cos * (h - out_y);

          do {
            interpolate(
              input,
              output,
              w,
              h,
              y_sin + cos * (w - out_x),
              y_cos + sin * (w - out_x)
            );
          } while (w++ < width);
        } while (h++ < height);

        this.u8 = output.u8;
        this.width = width;
        this.height = height;
        this.view = new DataView(
          output.u8.buffer,
          output.u8.byteOffset,
          output.u8.byteLength
        );
        this.u32 = new Uint32Array(
          output.u8.buffer,
          output.u8.byteOffset,
          output.u8.byteLength / 4
        );

        return this;
      }
    }
  }

  public scale(amount: number) {
    return this.resize_nearest(amount * this.width, amount * this.height);
  }

  public place(source: Editor, [x1, y1]: [number, number]) {
    for (let y = y1; y < Math.min(source.height, this.height); y++) {
      for (let x = x1; x < Math.min(source.width, this.width); x++) {
        this.set(x, y, source.get(x - x1, y - y1));
      }
    }

    return this;
  }

  public size() {
    return this.width * this.height;
  }

  public *iterate() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        yield [x, y] as const;
      }
    }
  }

  public static new(w: number, h: number): Editor {
    return new this(w, h);
  }

  public static color(color: ColorLike, w: number, h: number): Editor {
    return this.new(w, h).fill(color);
  }
}

export type InvertType = "hue" | "saturation" | "luminosity" | "all";
export type ModifyType = "add" | "scale" | "value";

function interpolate(
  input: Editor,
  out: Readonly<{ width: number; u8: Uint8Array }>,
  x0: number,
  y0: number,
  x1: number,
  y1: number
) {
  const x2 = ~~x1;
  const y2 = ~~y1;
  const xq = x1 - x2;
  const yq = y1 - y2;
  const offset = 4 * (x0 + y0 * out.width);

  const ref = { r: 0, g: 0, b: 0, a: 0 };
  pawn(x2, y2, (1 - xq) * (1 - yq), ref, input);

  pawn(1 + x2, y2, xq * (1 - yq), ref, input);
  pawn(x2, 1 + y2, (1 - xq) * yq, ref, input);

  pawn(1 + x2, 1 + y2, xq * yq, ref, input);

  out.u8[3 + offset] = ref.a;
  out.u8[offset] = ref.r / ref.a;
  out.u8[1 + offset] = ref.g / ref.a;
  out.u8[2 + offset] = ref.b / ref.a;
}

function pawn(
  point_a: number,
  point_b: number,
  weight: number,
  reference: { r: any; g: any; b: any; a: any },
  input: { width: number; height: number; u8: Uint8Array }
) {
  if (
    point_a > 0 &&
    point_b > 0 &&
    point_a < input.width &&
    point_b < input.height
  ) {
    const offset = 4 * (point_a + point_b * input.width);

    const wa = weight * input.u8[3 + offset];

    reference.a += wa;
    reference.r += wa * input.u8[offset];
    reference.g += wa * input.u8[1 + offset];
    reference.b += wa * input.u8[2 + offset];
  }
}

new Editor(1, 1).opacity;
