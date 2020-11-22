import { colors, decodeJpeg, decodePng, stringWidth } from "./deps.ts";

interface imageSettings {
  /** The local file path or URL of the image */
  path?: string;
  /** The raw data of a PNG or JPG image */
  raw?: Uint8Array;
  /** The character map to use when outputting the image */
  characterMap?: string | string[];
  /** The number of characters wide the output image is */
  width?: number;
  /** whether the character map should be inverted */
  inverted?: boolean;
  /** Whether the output image should be in color */
  color?: boolean;
}

interface rgb {
  r: number;
  g: number;
  b: number;
  a?: number;
}

const MIN_AUTO_WIDTH = 12;

/** Returns a promise which resolves to a string version of the image that can outputted to the console. */
async function getImageString(settings: imageSettings): Promise<string> {
  const characterMap = settings.characterMap
    ? [...settings.characterMap]
    : undefined;
  const inverted = settings.inverted ?? false;
  const color = settings.color ?? false;

  let raw;
  if(typeof settings.path !== "undefined"){

    const path = settings.path;

    //external file on the internet (requires --allow-net)
    if (path.startsWith("https://") || path.startsWith("http://")) {
      const response = await fetch(path);
      raw = new Uint8Array(await response.arrayBuffer());

    //local file (requires --allow-read)
    } else {
      raw = await Deno.readFile(path);
    }

  }else if(typeof settings.raw !== "undefined"){
    raw = settings.raw;
  } else{
    throw new Error("No file path or raw data specified.")
  }

  const imageFileType = getFileType(raw);
  if (imageFileType === "unknown") {
    if(settings.path){
      const fileExtension = settings.path.substr(
        settings.path.lastIndexOf(".") + 1,
      ).toLowerCase();
      throw new Error(`Image file type not supported. (${fileExtension})`);
    }else{
      throw new Error(`Image file type not supported.`)
    }
    
  }

  const decodedImage = decodeImage(raw, imageFileType);

  //currently requires --unstable
  const terminalWidth = Deno.consoleSize(Deno.stdout.rid).columns;
  const terminalHeight = Deno.consoleSize(Deno.stdout.rid).rows;

  const imagePixelWidth = decodedImage.width;
  const imagePixelHeight = decodedImage.height;

  let resolution;
  if (settings.width) {
    resolution = Math.ceil(imagePixelWidth / settings.width);
  } else {
    resolution = (terminalWidth < Math.max(terminalHeight, MIN_AUTO_WIDTH) * 2)
      ? imagePixelWidth / terminalWidth
      : imagePixelHeight / (Math.max(terminalHeight, MIN_AUTO_WIDTH) - 2) / 2;
  }

  let outputString = "";
  for (
    let y = resolution; y < imagePixelHeight - resolution; y += resolution * 2
  ) {
    for (
      let x: number = resolution / 2;
      x < imagePixelWidth - resolution / 2;
      x += 0
    ) {
      let char: string;
      if (characterMap === undefined) {
        let values = [
          decodedImage.getPixel(
            Math.floor(x - resolution / 4),
            Math.floor(y - resolution / 2),
          ),
          decodedImage.getPixel(
            Math.floor(x + resolution / 4),
            Math.floor(y - resolution / 2),
          ),
          decodedImage.getPixel(
            Math.floor(x - resolution / 4),
            Math.floor(y + resolution / 2),
          ),
          decodedImage.getPixel(
            Math.floor(x + resolution / 4),
            Math.floor(y + resolution / 2),
          ),
        ];

        const organisedValues = calculateGroups(values);
        let characterIndex = 0;
        let group0TotalColor = { r: 0, g: 0, b: 0 };
        let group1TotalColor = { r: 0, g: 0, b: 0 };
        let group0Count = 0;
        let group1Count = 0;

        /*
        Some terminals (e.g. the one in VSCode) leave a gap beneath the characters. 
        (Although most don't.) As a result, the background should be the same as 
        color at the bottom of the cell, so there isn't a sudden change in color
        at the bottom of each character.
        
        By default, group 1 is the foreground and group 0  is the background,
        but if the bottom of the cell is all group 1, this should be switched.
        */
        const switchColors = organisedValues[2].group === 1 &&
          organisedValues[3].group === 1;

        for (let value of organisedValues) {
          if (value.group === 0) {
            group0TotalColor.r += value.color.r;
            group0TotalColor.g += value.color.g;
            group0TotalColor.b += value.color.b;
            group0Count++;
          } else {
            group1TotalColor.r += value.color.r;
            group1TotalColor.g += value.color.g;
            group1TotalColor.b += value.color.b;
            group1Count++;
          }
          characterIndex += 2 ** value.id *
            (switchColors ? 1 - value.group : value.group);
        }

        const backgroundColor = {
          r: group0TotalColor.r / group0Count,
          g: group0TotalColor.g / group0Count,
          b: group0TotalColor.b / group0Count,
        };
        const foregroundColor = {
          r: group1TotalColor.r / group1Count,
          g: group1TotalColor.g / group1Count,
          b: group1TotalColor.b / group1Count,
        };

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

        char = " ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█"[characterIndex];
        char = colors.bgRgb24(
          colors.rgb24(char, foregroundColor),
          backgroundColor,
        );
        if (switchColors) char = colors.inverse(char);
      } else {
        const pixelColor = decodedImage.getPixel(Math.floor(x), Math.floor(y));
        const grayscaleValue = colorLightness(pixelColor);

        if (grayscaleValue === undefined) {
          throw `Error parsing pixel (${x}, ${y})`;
        }

        let characterIndex = Math.floor(
          grayscaleValue / 255 * (characterMap.length - 0.5),
        );
        characterIndex = inverted
          ? characterMap.length - 1 - characterIndex
          : characterIndex;

        char = color
          ? colors.rgb24(characterMap[characterIndex], pixelColor)
          : characterMap[characterIndex];
      }
      outputString += char;
      x += resolution * stringWidth(char);
    }
    outputString += "\n";
  }

  return outputString;
}

/* 
This function splits the four colors of a cell into two groups, 
which are used to decide a background and foreground color,
and choose which character to use to display the cell.
The algorithm used below tries to make the two groups
have similar colors within the group.
*/
function calculateGroups(values: rgb[]) {
  const groups: any = [[], []];
  const allSortedNeighbors = values.map((color, idA) => {
    const neighbors = values.map((color, id) => {
      return { color, id };
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
      return { ...v, group: 0 };
    }),
    ...groups[1].map((v: any) => {
      return { ...v, group: 1 };
    }),
  ].sort((v1, v2) => v1.id - v2.id);
}

/** Outputs the image to the console. */
async function printImageString(settings: imageSettings): Promise<void> {
  console.log(await getImageString(settings));
}

function decodeImage(raw: Uint8Array, format: string) {
  let decodedImage;
  switch (format) {
    case "jpg":
      decodedImage = decodeJpeg(raw);
      break;

    case "png":
      decodedImage = decodePng(raw);
      break;

    default:
      throw `Image format ${format} not supported. Also, this error message should be unreachable. :/`;
  }

  decodedImage.getPixel = function (x: number, y: number) {
    const index = x + (y * this.width);
    let pixelData;

    //with transparency values
    if (this.width * this.height * 4 <= this.data.length) {
      pixelData = {
        r: this.data[index * 4],
        g: this.data[index * 4 + 1],
        b: this.data[index * 4 + 2],
        a: this.data[index * 4 + 3],
      };

      //no transparency values
    } else if (this.width * this.height * 3 <= this.data.length) {
      pixelData = {
        r: this.data[index * 3],
        g: this.data[index * 3 + 1],
        b: this.data[index * 3 + 2],
      };
      //grayscale
    } else {
      pixelData = {
        r: this.data[index],
        g: this.data[index],
        b: this.data[index],
      };
    }
    return pixelData;
  };
  return decodedImage;
}

function getFileType(raw: Uint8Array): string {
  const PNG_SIGNATURE = [
    137,
    80,
    78,
    71,
    13,
    10,
    26,
    10,
    0,
    0,
    0,
    13,
    73,
    72,
    68,
    82,
  ];
  const JPG_SIGNATURE = [255, 216, 255];

  if (
    String(raw.slice(0, PNG_SIGNATURE.length)) === String(PNG_SIGNATURE)
  ) {
    return "png";
  }
  if (
    String(raw.slice(0, JPG_SIGNATURE.length)) === String(JPG_SIGNATURE)
  ) {
    return "jpg";
  }

  return "unknown";
}

function colorDistance(color1: rgb, color2: rgb) {
  //neive pythagoras's theorem for now
  return ((color1.r - color2.r) ** 2 + (color1.g - color2.g) ** 2 +
    (color1.b - color2.b) ** 2) ** 0.5;
}

function colorLightness(color: rgb) {
  return (color.r + color.g + color.b) / 3;
}

export { getImageString, printImageString };
export type { imageSettings };
