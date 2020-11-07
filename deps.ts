export { decode as decodeJpeg } from "https://deno.land/x/jpegts@1.1/mod.ts";
export { parse } from "https://deno.land/std@0.77.0/flags/mod.ts";
export * as colors from "https://deno.land/std@0.77.0/fmt/colors.ts";
import unpng from "https://cdn.skypack.dev/upng-js@v2.2.0";
export const decodePng = (unpng as any).decode;
