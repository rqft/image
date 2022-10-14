import { Editor } from "./editor";

export class Image extends Editor {
  constructor(width: number, height: number, source?: ArrayBufferLike) {
    super(width, height, source);
  }

  public encode(): Uint8Array {
    throw new Error("noimpl");
  }

  public static decode(_u8: ArrayBufferLike) {
    throw new Error("noimpl");
  }
}
