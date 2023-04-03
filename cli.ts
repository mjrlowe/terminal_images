import { imageSettings, printImage } from "./mod.ts";
import { parse } from "./deps.ts";
import version from "./version.ts";

const parsedArgs = parse(Deno.args);

const textImageSettings: imageSettings = {
  path: parsedArgs.file ?? parsedArgs.f ?? parsedArgs._?.[0],
};

if (typeof textImageSettings.path != "undefined") {
  if (parsedArgs["character-map"]) {
    textImageSettings.characterMap = String(parsedArgs["character-map"]);
  } else if (parsedArgs.m) {
    textImageSettings.characterMap = String(parsedArgs.m);
  }

  if (parsedArgs.width) textImageSettings.width = parseInt(parsedArgs.width);
  else if (parsedArgs.w) textImageSettings.width = parseInt(parsedArgs.w);

  if (parsedArgs.inverted !== undefined) {
    textImageSettings.inverted =
      !(parsedArgs.inverted === "false" || !parsedArgs.inverted);
  } else if (parsedArgs.i !== undefined) {
    textImageSettings.inverted = !(parsedArgs.i === "false" || !parsedArgs.i);
  }

  if (parsedArgs.color !== undefined) {
    textImageSettings.color =
      !(parsedArgs.color === "false" || !parsedArgs.color);
  } else if (parsedArgs.n !== undefined) {
    textImageSettings.color = !parsedArgs.n;
  }

  if (parsedArgs["animation-loops"] !== undefined) {
    textImageSettings.animationLoops = parseInt(parsedArgs["animation-loops"]);
  } else if (parsedArgs.l !== undefined) {
    textImageSettings.animationLoops = parseInt(parsedArgs.l);
  }

  if (parsedArgs["transparency-threshold"] !== undefined) {
    textImageSettings.transparencyThreshold = parseInt(
      parsedArgs["transparency-threshold"],
    );
  } else if (parsedArgs.t !== undefined) {
    textImageSettings.transparencyThreshold = parseInt(parsedArgs.t);
  }

  await printImage(textImageSettings);
} else if (parsedArgs.V) {
  console.log(`terminal_images ${version}`);
} else if (parsedArgs.version) {
  console.log(`terminal_images ${version}\ndeno ${Deno.version.deno}`);
} else if (parsedArgs.h || parsedArgs.help) {
  console.log(`
INFO OPTIONS
-h, --help
  Prints help information
-V, --version
  Prints version information

IMAGE PRINTING OPTIONS
<path> [OR -f, --file <path>] 
  The image URL/path of the input image (required)
-w, --width <width>
  The number of characters wide the output image should be
-m, --character-map <character-map>
  The character map to use for the output image
-i, --inverted
  Inverts the character map
-n, --no-color
  Sets to output image to not be in color
-l, --animation-loops
  If the image is animated, this controls the number of times the animation loops
-t, --transparency-threshold
  The alpha threshold for considering a pixel transparent or opaque
`);
} else {
  console.error("Invalid command. Run --help for usage information.");
}
