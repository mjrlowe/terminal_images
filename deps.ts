export { decode as decodeJpeg } from "https://deno.land/x/jpegts@1.1/mod.ts";
export { parse } from "https://deno.land/std@0.74.0/flags/mod.ts";
import unpng from "https://cdn.skypack.dev/upng-js@v2.1.0";
export const decodePng = (unpng as any).decode;