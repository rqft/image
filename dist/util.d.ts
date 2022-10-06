export declare function view(buffer: BufferSource, shared?: boolean): Uint8Array;
export declare function clamp(min: number, max: number, value: number): number;
export declare function fclamp(min: number, max: number, value: number): number;
export declare type Typeof = "boolean" | "number" | "string" | "bigint" | "symbol" | "object" | "function" | "undefined";
export declare function is_object(value: object, criteria: Record<string, Typeof | `?${Typeof}`>): boolean;
