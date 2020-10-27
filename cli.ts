import { printImageString, imageSettings } from "./mod.ts";
import { parse } from "./deps.ts";

const parsedArgs = parse(Deno.args);

console.log(Deno.args, parsedArgs)

const textImageSettings: imageSettings = {
  path: parsedArgs.file ?? parsedArgs.f 
};

if(parsedArgs["character-map"]) textImageSettings.characterMap = String(parsedArgs["character-map"]);
if(parsedArgs.m) textImageSettings.characterMap = String(parsedArgs.m);

if(parsedArgs.width) textImageSettings.width = parseInt(parsedArgs.width);
if(parsedArgs.w) textImageSettings.width = parseInt(parsedArgs.w);

if(parsedArgs.inverted !== undefined) textImageSettings.inverted = !(parsedArgs.inverted === "false" || !parsedArgs.inverted);
if(parsedArgs.i !== undefined) textImageSettings.inverted = !(parsedArgs.i === "false" || !parsedArgs.i);

if(parsedArgs.color !== undefined) textImageSettings.color = !(parsedArgs.color === "false" || !parsedArgs.color);
if(parsedArgs.c !== undefined) textImageSettings.color = !(parsedArgs.c === "false" || !parsedArgs.c);

await printImageString(textImageSettings);
