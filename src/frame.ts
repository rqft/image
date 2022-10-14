import { Editor } from "./editor";

export class Frame extends Editor {
  constructor(editor: Editor, public duration: number = 0) {
    super(editor.width, editor.height, editor.u8);
  }

  public static of(editor: Editor, duration: number = 0) {
    return new this(editor, duration);
  }
}
