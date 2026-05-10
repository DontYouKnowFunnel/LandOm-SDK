declare module 'pako' {
  export function gzip(data: string | Uint8Array, options?: unknown): Uint8Array;
}
