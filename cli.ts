import { printImageString, imageSettings } from "./mod.ts";
import { parse } from "./deps.ts";

const parsedArgs = parse(Deno.args);

const textImageSettings: imageSettings = {
  path: parsedArgs.file
};

if(parsedArgs["character-map"]) textImageSettings.characterMap = String(parsedArgs["character-map"]);
if(parsedArgs.width) textImageSettings.width = parseInt(parsedArgs.width);
if(parsedArgs.inverted !== undefined) textImageSettings.inverted = !(parsedArgs.inverted === "false" || !parsedArgs.inverted);
if(parsedArgs.color !== undefined) textImageSettings.color = !(parsedArgs.color === "false" || !parsedArgs.color);

await printImageString(textImageSettings);
