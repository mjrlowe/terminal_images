import { imageSettings, printImageString } from "./mod.ts";
import { colors, parse } from "./deps.ts";
import version from "./version.ts";

const parsedArgs = parse(Deno.args);

const textImageSettings: imageSettings = {
  path: parsedArgs.file ?? parsedArgs.f,
};

if(typeof textImageSettings.path != "undefined"){

  if (parsedArgs["character-map"]) {
    textImageSettings.characterMap = String(parsedArgs["character-map"]);
  }
  if (parsedArgs.m) textImageSettings.characterMap = String(parsedArgs.m);

  if (parsedArgs.width) textImageSettings.width = parseInt(parsedArgs.width);
  if (parsedArgs.w) textImageSettings.width = parseInt(parsedArgs.w);

  if (parsedArgs.inverted !== undefined) {
    textImageSettings.inverted =
      !(parsedArgs.inverted === "false" || !parsedArgs.inverted);
  }
  if (parsedArgs.i !== undefined) {
    textImageSettings.inverted = !(parsedArgs.i === "false" || !parsedArgs.i);
  }

  if (parsedArgs.color !== undefined) {
    textImageSettings.color =
      !(parsedArgs.color === "false" || !parsedArgs.color);
  }
  if (parsedArgs.c !== undefined) {
    textImageSettings.color = !(parsedArgs.c === "false" || !parsedArgs.c);
  }

  await printImageString(textImageSettings);

}else if (parsedArgs.V){
  console.log(`terminal_images ${version}`)
}else if (parsedArgs.version){
  console.log(`terminal_images ${version}\ndeno ${Deno.version.deno}`)
}