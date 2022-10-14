import { ColorLike } from "./color";
import { Editor } from "./editor";
import { Frame } from "./frame";

export class Animation {
  constructor(public frames: Array<Frame>) {}

  public clone(): Animation {
    return new Animation(this.frames);
  }

  public map(fn: (frame: Frame) => Frame | Editor): this {
    this.frames = this.frames.map((x) => {
      const v = fn.bind(x)(x);
      if (v instanceof Frame) {
        return v;
      }

      return Frame.of(v, x.duration);
    });
    return this;
  }

  public resize_nearest(width: number, height: number): this {
    return this.map((x) => x.resize_nearest(width, height));
  }

  public flip_horizontal() {
    return this.map((x) => x.flip_horizontal());
  }

  public flip_vertical() {
    return this.map((x) => x.flip_vertical());
  }

  public fill(value: ColorLike) {
    return this.map((x) => x.fill(value));
  }

  public fill_with(source: (x: number, y: number) => ColorLike) {
    return this.map(x=>x.fill_with(source))
  }

  public iterate(
    frame: number
  ): Generator<readonly [number, number], void, unknown> {
    return this.get(frame).iterate();
  }

  public get(frame: number): Frame {
    return this.frames.at(frame)!;
  }

  public duration() {
    return this.frames.reduce((p, frame) => frame.duration + p, 0);
  }
}
