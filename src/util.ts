import { TypedArray } from "./typed-arrays";

export function view(buffer: BufferSource, shared: boolean = false) {
  if (buffer instanceof ArrayBuffer) {
    return new TypedArray.u8(buffer);
  }

  if (shared && buffer instanceof SharedArrayBuffer) {
    return new TypedArray.u8(buffer);
  }

  if (ArrayBuffer.isView(buffer)) {
    return new TypedArray.u8(
      buffer.buffer,
      buffer.byteOffset,
      buffer.byteLength
    );
  }

  throw new TypeError("Buffer is not of type ArrayBufferView | ArrayBuffer");
}

export function clamp(min: number, max: number, value: number) {
  return Math.min(Math.max(Math.round(value), min), max);
}

export function fclamp(min: number, max: number, value: number) {
  return Math.min(Math.max(value, min), max);
}

export type Typeof =
  | "boolean"
  | "number"
  | "string"
  | "bigint"
  | "symbol"
  | "object"
  | "function"
  | "undefined";
export function is_object(
  value: object,
  criteria: Record<string, Typeof | `?${Typeof}`>
): boolean {
  for (const [key, t] of Object.entries(criteria)) {
    let ks = key.split(".");
    let k = value;
    for (let z of ks) {
      if (z in value) {
        k = value[z as never];
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
