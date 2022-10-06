"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Editor = void 0;
const color_1 = require("./color");
const typed_arrays_1 = require("./typed-arrays");
const util_1 = require("./util");
class Editor {
    width;
    height;
    u8;
    view;
    u32;
    constructor(width, height, source) {
        this.width = width;
        this.height = height;
        this.width |= 0;
        this.height |= 0;
        if (source) {
            this.u8 = (0, util_1.view)(source);
        }
        else {
            this.u8 = new typed_arrays_1.TypedArray.u8(4 * this.width * this.height);
        }
        this.view = new DataView(this.u8.buffer, this.u8.byteOffset, this.u8.byteLength);
        this.u32 = new Uint32Array(this.u8.buffer, this.u8.byteOffset, this.u8.byteLength / 4);
        if (this.u8.length !== 4 * this.width * this.height) {
            throw new RangeError("Invalid buffer capacity");
        }
    }
    clone() {
        return new Editor(this.width, this.height, this.u8);
    }
    get(x, y) {
        x |= 0;
        y |= 0;
        return this.view.getUint32(x + y * this.width, false);
    }
    set(x, y, value) {
        x |= 0;
        y |= 0;
        this.view.setUint32(x + y * this.width, value, false);
        return this;
    }
    resize_nearest(width, height) {
        width |= 0;
        height |= 0;
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
        this.width = width;
        this.height = height;
        this.u8 = new Uint8Array(u32.buffer);
        this.view = new DataView(u32.buffer);
        return this;
    }
    flip_horizontal() {
        let offset = 0;
        for (let y = 0; y < this.height; y++) {
            this.u32.subarray(offset, (offset += this.width)).reverse();
        }
        return this;
    }
    flip_vertical() {
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
    fill(value) {
        value = color_1.Color.parse(value);
        this.view.setUint32(0, value);
        this.u32.fill(this.u32[0]);
        return this;
    }
    fill_with(source) {
        let offset = 0;
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.height; x++) {
                this.view.setUint32(offset, color_1.Color.parse(source(x, y)), false);
                offset += 4;
            }
        }
        return this;
    }
    map(source) {
        return this.fill_with((x, y) => {
            return source(new color_1.Color(this.get(x, y)), x, y);
        });
    }
    saturation_additive(amount, scalar) {
        return this.map((value) => {
            const hsla = value.hsla();
            if (scalar) {
                hsla.s *= amount;
            }
            else {
                hsla.s += amount;
            }
            return hsla;
        });
    }
    luminosity(amount, scalar) {
        return this.map((value) => {
            const hsla = value.hsla();
            if (scalar) {
                hsla.l *= amount;
            }
            else {
                hsla.l += amount;
            }
            return hsla;
        });
    }
    rotate(degrees, resize = false) {
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
                this.width = height;
                this.height = width;
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
                        interpolate(input, output, w, h, y_sin + cos * (w - out_x), y_cos + sin * (w - out_x));
                    } while (w++ < width);
                } while (h++ < height);
                this.u8 = output.u8;
                this.width = width;
                this.height = height;
                this.view = new DataView(output.u8.buffer, output.u8.byteOffset, output.u8.byteLength);
                this.u32 = new Uint32Array(output.u8.buffer, output.u8.byteOffset, output.u8.byteLength / 4);
                return this;
            }
        }
    }
}
exports.Editor = Editor;
function interpolate(input, out, x0, y0, x1, y1) {
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
function pawn(point_a, point_b, weight, reference, input) {
    if (point_a > 0 &&
        point_b > 0 &&
        point_a < input.width &&
        point_b < input.height) {
        const offset = 4 * (point_a + point_b * input.width);
        const wa = weight * input.u8[3 + offset];
        reference.a += wa;
        reference.r += wa * input.u8[offset];
        reference.g += wa * input.u8[1 + offset];
        reference.b += wa * input.u8[2 + offset];
    }
}
