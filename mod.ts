import { decodeJpeg, decodePng } from "./deps.ts";

const character_map = "█▓▒░ "; //"#@%M+:,. "

const inverted = false;

async function getImageString(image_file_path: string): Promise<string> {
  const raw = await Deno.readFile(image_file_path);

  const fileExtension = image_file_path.substr(
    image_file_path.lastIndexOf(".") + 1,
  ).toLowerCase();

  let decodedImage;
  switch (fileExtension) {
    case "jpg":
    case "jpeg":
      decodedImage = decodeJpeg(raw);
      break;

    case "png":
      decodedImage = decodePng(raw);
      break;

    default:
      throw `Image format ${fileExtension} not supported.`;
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

  const { columns, rows } = Deno.consoleSize(Deno.stdout.rid);

  const pixelWidth = decodedImage.width;
  const pixelHeight = decodedImage.height;

  const resolution = (columns < rows * 2)
    ? pixelWidth / columns
    : pixelHeight / (rows - 2) / 2;

  let outputString = "";
  for (let y = 0; y < pixelHeight; y += resolution * 2) {
    for (let x = 0; x < pixelWidth; x += resolution) {
      const pixel = decodedImage.getPixel(Math.floor(x), Math.floor(y));
      const grayscaleValue = (pixel.r + pixel.g + pixel.b) / 3;
      let characterIndex = Math.floor(
        grayscaleValue / 255 * (character_map.length - 0.5),
      );
      characterIndex = inverted
        ? character_map.length - 1 - characterIndex
        : characterIndex;

      if (character_map[characterIndex] === undefined) {
        outputString += "X";
      } else {
        outputString += character_map[characterIndex];
      }
    }
    outputString += "\n";
  }

  return outputString;
}

async function printImageString(image_file_path: string): Promise<void> {
  console.log(await getImageString(image_file_path));
}

export { getImageString, printImageString };
