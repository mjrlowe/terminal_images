import {
  colors,
  stringWidth,
  tty
} from "./deps.ts";
import {
  decodeImageFromPath,
  decodeImageFromRawFile,
  decodeImageFromRawPixels,
} from "./decode.ts";
interface imageSettings {
  /** The local file path or URL of the image */
  path? : string;
  /** The raw data of a PNG or JPG image */
  rawFile? : Uint8Array;
  /** The raw data for the image: the rgb(a) array as well as the height and width */
  rawPixels? : rawPixelData;
  /** The character map to use when outputting the image */
  characterMap? : string | string[];
  /** The number of characters wide the output image is */
  width? : number;
  /** whether the character map should be inverted */
  inverted? : boolean;
  /** Whether the output image should be in color */
  color? : boolean;
  /** The alpha threshold for considering a pixel transparent or opaque */
  transparencyThreshold? : number;
  /** The number of times the image should loop if it is an animation */
  animationLoops? : number;
}

interface rawPixelData {
  width: number;
  height: number;
  data: Uint8Array;
}

interface rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

const MIN_AUTO_WIDTH = 12;

/** Returns a promise which resolves to a string version of the image that can outputted to the console. */
async function getImageStrings(settings: imageSettings): Promise < string[] > {
  const characterMap = settings.characterMap ?
    [...settings.characterMap] :
    undefined;
  const inverted = settings.inverted ?? false;
  const color = settings.color ?? true;
  const transparencyThreshold = settings.transparencyThreshold ?? 1;

  let decodedImage;
  if (typeof settings.path !== "undefined") {
    decodedImage = await decodeImageFromPath(settings.path);
  } else if (typeof settings.rawFile !== "undefined") {
    decodedImage = await decodeImageFromRawFile(settings.rawFile);
  } else if (typeof settings.rawPixels !== "undefined") {
    decodedImage = await decodeImageFromRawPixels(settings.rawPixels);
  } else {
    throw new Error("No file path or raw data specified.");
  }

  if (decodedImage.fileFormat === "unknown") {
    throw new Error(
      `Image file type not recognised. Only PNG, JPG and GIF formats are supported.`,
    );
  }

  const imagePixelWidth = decodedImage.width;
  const imagePixelHeight = decodedImage.height;

  let characterWidth;
  if (settings.width) {
    characterWidth = Math.ceil(imagePixelWidth / settings.width);
  } else {
    //currently requires --unstable
    const terminalWidth = Deno.consoleSize(Deno.stdout.rid).columns;
    const terminalHeight = Deno.consoleSize(Deno.stdout.rid).rows;

    characterWidth =
      (terminalWidth < Math.max(terminalHeight, MIN_AUTO_WIDTH) * 2) ?
      imagePixelWidth / terminalWidth :
      imagePixelHeight / (Math.max(terminalHeight, MIN_AUTO_WIDTH) - 2) / 2;
  }

  let outputStrings: string[] = [];

  for (let frameIndex = 0; frameIndex < decodedImage.numFrames; frameIndex++) {
    let outputString = "";
    for (
      let y = characterWidth; y < imagePixelHeight - characterWidth; y += characterWidth * 2
    ) {
      for (
        let x: number = characterWidth / 2; x < imagePixelWidth - characterWidth / 2; x += 0
      ) {
        let char: string;
        if (characterMap === undefined) {
          let values = [
            decodedImage.getPixel(
              Math.floor(x - characterWidth / 4),
              Math.floor(y - characterWidth / 2),
              frameIndex,
            ),
            decodedImage.getPixel(
              Math.floor(x + characterWidth / 4),
              Math.floor(y - characterWidth / 2),
              frameIndex,
            ),
            decodedImage.getPixel(
              Math.floor(x - characterWidth / 4),
              Math.floor(y + characterWidth / 2),
              frameIndex,
            ),
            decodedImage.getPixel(
              Math.floor(x + characterWidth / 4),
              Math.floor(y + characterWidth / 2),
              frameIndex,
            ),
          ];

          const organisedValues = calculateGroups(values);
          let characterIndex = 0;
          let group0TotalColor = {
            r: 0,
            g: 0,
            b: 0,
            a: 0
          };
          let group1TotalColor = {
            r: 0,
            g: 0,
            b: 0,
            a: 0
          };
          let group0Count = 0;
          let group1Count = 0;

          for (let value of organisedValues) {
            if (value.group === 0) {
              group0TotalColor.r += value.color.r;
              group0TotalColor.g += value.color.g;
              group0TotalColor.b += value.color.b;
              group0TotalColor.a += value.color.a;
              group0Count++;
            } else {
              group1TotalColor.r += value.color.r;
              group1TotalColor.g += value.color.g;
              group1TotalColor.b += value.color.b;
              group1TotalColor.a += value.color.a;
              group1Count++;
            }
          }

          const backgroundColor = {
            r: group0TotalColor.r / group0Count,
            g: group0TotalColor.g / group0Count,
            b: group0TotalColor.b / group0Count,
            a: group0TotalColor.a / group0Count,
          };
          const foregroundColor = {
            r: group1TotalColor.r / group1Count,
            g: group1TotalColor.g / group1Count,
            b: group1TotalColor.b / group1Count,
            a: group1TotalColor.a / group0Count,
          };

          /*
            Some terminals (e.g. the one in VSCode) leave a gap beneath the characters. 
            (Although most don't.) As a result, the background should be the same as 
            color at the bottom of the cell, so there isn't a sudden change in color
            at the bottom of each character.
            
            By default, group 1 is the foreground and group 0  is the background,
            but if the bottom of the cell is all group 1, this should be switched.

            If the foreground color is transparent, we need to switch colors as well, 
            since only the background can be displayed transparently.
            */
          let switchColors = (organisedValues[2].group === 1 &&
            organisedValues[3].group === 1 && backgroundColor.a > transparencyThreshold) || foregroundColor.a < transparencyThreshold;

          for (let value of organisedValues) {

            characterIndex += 2 ** value.id *
              (switchColors ? 1 - value.group : value.group);
          }

          if (!color) {
            const backgroundLightness = colorLightness(backgroundColor);
            const foregroundLightness = colorLightness(foregroundColor);
            backgroundColor.r = backgroundLightness;
            backgroundColor.g = backgroundLightness;
            backgroundColor.b = backgroundLightness;
            foregroundColor.r = foregroundLightness;
            foregroundColor.g = foregroundLightness;
            foregroundColor.b = foregroundLightness;
          }

          char = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█" [characterIndex];
          if (backgroundColor.a < transparencyThreshold && foregroundColor.a < transparencyThreshold) {
            char = " ";
          } else if (backgroundColor.a < transparencyThreshold) {
            char = colors.rgb24(char, foregroundColor)
          } else if (foregroundColor.a < transparencyThreshold) {
            char = colors.rgb24(char, backgroundColor)
          } else {
            char = colors.bgRgb24(
              colors.rgb24(char, foregroundColor),
              backgroundColor,
            );
            if (switchColors) char = colors.inverse(char);
          }
        } else {
          const pixelColor = decodedImage.getPixel(
            Math.floor(x),
            Math.floor(y),
            frameIndex,
          );
          const grayscaleValue = colorLightness(pixelColor);

          if (grayscaleValue === undefined) {
            throw `Error parsing pixel (${x}, ${y})`;
          }

          let characterIndex = Math.floor(
            grayscaleValue / 255 * (characterMap.length - 0.5),
          );
          characterIndex = inverted ?
            characterMap.length - 1 - characterIndex :
            characterIndex;

          char = color ?
            colors.rgb24(characterMap[characterIndex], pixelColor) :
            characterMap[characterIndex];
        }
        outputString += char;
        x += characterWidth * stringWidth(char);
      }
      if (y < imagePixelHeight - characterWidth * 3) outputString += "\n";
    }
    outputStrings.push(outputString);
  }
  return outputStrings;
}

/* 
This function splits the four colors of a cell into two groups, 
which are used to decide a background and foreground color,
and choose which character to use to display the cell.
The algorithm used below tries to make the two groups
have similar colors within the group.
*/
function calculateGroups(values: rgba[]) {
  const groups: any = [
    [],
    []
  ];
  const allSortedNeighbors = values.map((color, idA) => {
    const neighbors = values.map((color, id) => {
      return {
        color,
        id
      };
    }).filter((v, idB) => idA !== idB).sort(
      (v1, v2) =>
      colorDistance(color, v1.color) - colorDistance(color, v2.color),
    );
    return {
      id: idA,
      neighbors,
      added: false,
      color,
    };
  });

  for (let c1 of allSortedNeighbors) {
    if (!c1.added) {
      for (let c2 of allSortedNeighbors) {
        if (c1.id !== c2.id && !c2.added) {
          //both each others' closest neighbor
          if (c1.neighbors[0].id === c2.id && c2.neighbors[0].id === c1.id) {
            if (groups[0].length === 0) {
              groups[0].push(c1);
              groups[0].push(c2);
            } else {
              groups[1].push(c1);
              groups[1].push(c2);
            }
            c1.added = true;
            c2.added = true;
          }
        }
      }
    }
  }

  const remainingColors = allSortedNeighbors.filter((v) => !v.added);
  if (remainingColors.length > 0) {
    const group0Average = {
      r: (groups[0][0].color.r + groups[0][1].color.r) / 2,
      g: (groups[0][0].color.g + groups[0][1].color.g) / 2,
      b: (groups[0][0].color.b + groups[0][1].color.b) / 2,
      a: (groups[0][0].color.a + groups[0][1].color.a) / 2,
    };
    if (
      colorDistance(remainingColors[0].color, group0Average) <
      colorDistance(remainingColors[1].color, group0Average)
    ) {
      groups[0].push(remainingColors[0]);
      groups[1].push(remainingColors[1]);
    } else {
      groups[0].push(remainingColors[1]);
      groups[1].push(remainingColors[0]);
    }
  }

  return [
    ...groups[0].map((v: any) => {
      return {
        ...v,
        group: 0
      };
    }),
    ...groups[1].map((v: any) => {
      return {
        ...v,
        group: 1
      };
    }),
  ].sort((v1, v2) => v1.id - v2.id);
}

/** Outputs the image to the console. */
async function printImage(settings: imageSettings): Promise < void > {
  const outputStrings = await getImageStrings(settings);

  //const width = stringWidth(outputStrings[0].split("\n")[0]);
  const height = (outputStrings[0]?.match(/\n/g)?.length ?? 0) + 1;
  tty.hideCursorSync();

  //If it is an animation, add an extra frame so we end where we started.
  const numFrames = outputStrings.length === 1 ? 1 : outputStrings.length * (settings.animationLoops ?? 1) + 1;

  for (let frameIndex = 0; frameIndex < numFrames; frameIndex++) {
    setTimeout(async () => {
      
      console.log(outputStrings[frameIndex%outputStrings.length])
      tty.goUpSync(height);

      if (frameIndex === numFrames - 1) {
        tty.goDownSync(height + 1);
        tty.showCursor();

      }
    }, frameIndex * 200);

  }
}

function colorDistance(color1: rgba, color2: rgba) {
  //calculate the visual distance between colors using pythagoras's theorem in rgba space
  //not totally accurate but it's fast and simple
  return ((color1.r - color2.r) ** 2 + (color1.g - color2.g) ** 2 +
    (color1.b - color2.b) ** 2 +
    (color1.a - color2.a) ** 2) ** 0.5;
}

function colorLightness(color: rgba) {
  return (color.r + color.g + color.b) / 3;
}

export {
  getImageStrings,
  printImage
};

export type {
  imageSettings
};