import { colors, decodeJpeg, decodePng } from "./deps.ts";

interface imageSettings {
  /** The local file path or URL of the image */
  path: string;
  /** The character map to use when outputting the image */
  characterMap?: string | string[];
  /** The number of characters wide the output image is */
  width?: number;
  /** whether the character map should be inverted */
  inverted?: boolean;
  /** Whether the output image should be in color */
  color?: boolean;
}

const MIN_AUTO_WIDTH = 12;

/** Returns a promise which resolves to a string version of the image that can outputted to the console. */
async function getImageString(settings: imageSettings): Promise<string> {
  const path = settings.path;
  const characterMap = settings.characterMap
    ? [...settings.characterMap]
    : ["█", "▓", "▒", "░", " "];
  const inverted = settings.inverted ?? false;
  const color = settings.color ?? false;

  let raw;

  //external file on the internet (requires --allow-net)
  if (path.startsWith("https://") || path.startsWith("http://")) {
    const response = await fetch(path);
    raw = new Uint8Array(await response.arrayBuffer());

    //local file (requires --allow-read)
  } else {
    raw = await Deno.readFile(path);
  }

  const imageFileType = getFileType(raw);
  if (imageFileType === "unknown") {
    const fileExtension = path.substr(
      path.lastIndexOf(".") + 1,
    ).toLowerCase();
    throw `Image file type not supported. (${fileExtension})`;
  }

  const decodedImage = decodeImage(raw, imageFileType);

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
  for (let y = resolution; y < imagePixelHeight; y += resolution * 2) {
    for (let x: number = resolution / 2; x < imagePixelWidth; x += resolution) {
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
          Math.floor(y - resolution / 2),
        ),
      ];

      const organisedValues = calculateGroups(values);
      let characterIndex = 0;
      let group1TotalColor = {r: 0, g:0, b:0};
      let group2TotalColor = {r: 0, g:0, b:0};
      let group1Count = 0;
      let group2Count = 0;
      for(let value of organisedValues){
        if(value.group === 1){
          group1TotalColor.r += value.color.r;
          group1TotalColor.g += value.color.g;
          group1TotalColor.b += value.color.b;
          group1Count++;
        }else{
          group2TotalColor.r += value.color.r;
          group2TotalColor.g += value.color.g;
          group2TotalColor.b += value.color.b;
          group2Count++;
        }
        // console.log(value.id, (value.group-1))
        characterIndex += 2**value.id * (value.group-1)

      }

      const foregroundColor = {r: group1TotalColor.r/group1Count,g: group1TotalColor.g/group1Count,b: group1TotalColor.b/group1Count}
      const backgroundColor = {r: group2TotalColor.r/group2Count,g: group2TotalColor.g/group2Count,b: group2TotalColor.b/group1Count}

      // console.log(characterIndex)
      outputString += colors.bgRgb24(colors.rgb24(" ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█"[characterIndex], foregroundColor), backgroundColor);
      // if (y == resolution && x == resolution / 2) calculateGroups(values);

      // const pixelColor = decodedImage.getPixel(Math.floor(x), Math.floor(y));
      // const grayscaleValue = (pixelColor.r + pixelColor.g + pixelColor.b) / 3;

      // if (grayscaleValue === undefined) {
      //   throw `Error parsing pixel (${x}, ${y})`;
      // }

      // let characterIndex = Math.floor(
      //   grayscaleValue / 255 * (characterMap.length - 0.5),
      // );
      // characterIndex = inverted
      //   ? characterMap.length - 1 - characterIndex
      //   : characterIndex;

      // outputString += color
      //   ? colors.rgb24("█", pixelColor)
      //   : characterMap[characterIndex];
    }
    outputString += "\n";
  }

  return outputString;
}

function calculateGroups(values: number[][]) {
  const group1: any = [];
  const group2: any = [];
  const allSortedNeighbors = values.map((color, idA) => {
    const neighbors = values.map((color, id) => {
      return { color, id };
    }).filter((v, idB) => idA !== idB).sort(
      (v1, v2) =>
        colorDistance(color, v1.color) - colorDistance(color, v2.color),
    )
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
            if (group1.length === 0) {
              group1.push(c1);
              group1.push(c2);
            } else {
              group2.push(c1);
              group2.push(c2);
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
    const group1Average = {
      r: (group1[0].color.r + group1[1].color.r) / 2,
      g: (group1[0].color.g + group1[1].color.g) / 2,
      b: (group1[0].color.b + group1[1].color.b) / 2,
      a: (group1[0].color.a + group1[1].color.a) / 2,
    };
    if (
      colorDistance(remainingColors[0], group1Average) <
        colorDistance(remainingColors[1], group1Average)
    ) {
      group1.push(remainingColors[0]);
      group2.push(remainingColors[1]);
    } else {
      group1.push(remainingColors[1]);
      group2.push(remainingColors[0]);
    }
  }

  return [
    ...group1.map((v: any) => {
      return { ...v, group: 1 };
    }),
    ...group2.map((v: any) => {
      return { ...v, group: 2 };
    }),
  ].sort((v1, v2) => v1.id-v2.id);
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

function colorDistance(color1: any, color2: any) {
  //neive pythagoras's theorem for now
  return ((color1.r - color2.r) ** 2 + (color1.g - color2.g) ** 2 +
    (color1.b - color2.b) ** 2) ** 0.5;
}

export { getImageString, printImageString };
export type { imageSettings };

//" ▘▝▀▖▌▞▛▗▚▐▜▄▙▟█"
