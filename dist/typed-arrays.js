"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedArray = void 0;
var TypedArray;
(function (TypedArray) {
    TypedArray.i8 = Int8Array;
    TypedArray.u8 = Uint8Array;
    TypedArray.u8c = Uint8ClampedArray;
    TypedArray.i16 = Int16Array;
    TypedArray.u16 = Uint16Array;
    TypedArray.i32 = Int32Array;
    TypedArray.u32 = Uint32Array;
    TypedArray.f32 = Float32Array;
    TypedArray.f64 = Float64Array;
})(TypedArray = exports.TypedArray || (exports.TypedArray = {}));
