"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.is_object = exports.fclamp = exports.clamp = exports.view = void 0;
const typed_arrays_1 = require("./typed-arrays");
function view(buffer, shared = false) {
    if (buffer instanceof ArrayBuffer) {
        return new typed_arrays_1.TypedArray.u8(buffer);
    }
    if (shared && buffer instanceof SharedArrayBuffer) {
        return new typed_arrays_1.TypedArray.u8(buffer);
    }
    if (ArrayBuffer.isView(buffer)) {
        return new typed_arrays_1.TypedArray.u8(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    }
    throw new TypeError("Buffer is not of type ArrayBufferView | ArrayBuffer");
}
exports.view = view;
function clamp(min, max, value) {
    return Math.min(Math.max(Math.round(value), min), max);
}
exports.clamp = clamp;
function fclamp(min, max, value) {
    return Math.min(Math.max(value, min), max);
}
exports.fclamp = fclamp;
function is_object(value, criteria) {
    for (const [key, t] of Object.entries(criteria)) {
        let ks = key.split(".");
        let k = value;
        for (let z of ks) {
            if (z in value) {
                k = value[z];
            }
        }
        n: if (t.startsWith("?")) {
            if (k === undefined) {
                break n;
            }
            if (t !== typeof k) {
                return false;
            }
        }
        if (t !== typeof k) {
            return false;
        }
    }
    return true;
}
exports.is_object = is_object;
