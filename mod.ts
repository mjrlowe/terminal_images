import { decodeJpeg, decodePng, colors } from "./deps.ts";

interface imageSettings {
  path: string;
  characterMap?: string;
  width?: number;
  inverted?: boolean;
  color?: boolean;
}

const MIN_AUTO_WIDTH = 12;

async function getImageString(settings: imageSettings): Promise<string> {
  const path = settings.path;
  const characterMap = settings.characterMap ?? "█▓▒░ ";
  const inverted = settings.inverted ?? false;
  const color = settings.color ?? false;

  let raw;

  //external file on the internet (requires --allow-net)
  if(path.startsWith("https://") || path.startsWith("http://")){

    const response = await fetch(path)
    raw = new Uint8Array(await response.arrayBuffer());

  //local file (requires --allow-read)
  }else{

    raw = await Deno.readFile(path);

  }

  const fileExtension = path.substr(
    path.lastIndexOf(".") + 1,
  ).toLowerCase();

  const decodedImage = decodeImage(raw, fileExtension);

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
    for (let x = resolution/2; x < imagePixelWidth; x += resolution) {
      const pixelColor = decodedImage.getPixel(Math.floor(x), Math.floor(y));
      const grayscaleValue = (pixelColor.r + pixelColor.g + pixelColor.b) / 3;

      if(grayscaleValue === undefined) throw `Error parsing pixel (${x}, ${y})`

      let characterIndex = Math.floor(
        grayscaleValue / 255 * (characterMap.length - 0.5),
      );
      characterIndex = inverted
        ? characterMap.length - 1 - characterIndex
        : characterIndex;

      outputString += color ? colors.rgb24("█", pixelColor) : characterMap[characterIndex];
    }
    outputString += "\n";
  }

  return outputString;
}

async function printImageString(settings: imageSettings): Promise<void> {
  console.log(await getImageString(settings));
}

function decodeImage(raw:Uint8Array, format:string) {
  let decodedImage;
  switch (format) {
    case "jpg":
    case "jpeg":
      decodedImage = decodeJpeg(raw);
      break;

    case "png":
      decodedImage = decodePng(raw);
      break;

    default:
      throw `Image format ${format} not supported.`;
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

export { getImageString, printImageString };
export type {imageSettings};
