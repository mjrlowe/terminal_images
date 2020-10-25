import { printImageString } from "./mod.ts";
import { parse } from "./deps.ts";

const parsedArgs = parse(Deno.args);

await printImageString(parsedArgs.file);
