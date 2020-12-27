export { decode as decodeJpeg } from "https://deno.land/x/jpegts@1.1/mod.ts";
export { parse } from "https://deno.land/std@0.77.0/flags/mod.ts";
export { stringWidth } from "https://deno.land/x/gutenberg@0.1.5/unicode/width/mod.ts";
export * as colors from "https://deno.land/std@0.77.0/fmt/colors.ts";
import unpng from "https://cdn.skypack.dev/upng-js@v2.1.0";
export const decodePng = (unpng as any).decode;
export { GifReader } from "https://cdn.skypack.dev/omggif";
export * as tty from "https://deno.land/x/tty/mod.ts";
