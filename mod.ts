import { decodeJpeg } from "./deps.ts";

const image_file_path = "./test_images/old_man.jpg";
const character_map = "█▓▒░ "; //"#@%M+:,. "

const inverted = false;

async function getImageString(image_file_path: string): Promise<string> {
  const raw = await Deno.readFile(image_file_path);

  const decodedImage = decodeJpeg(raw);

  const { columns, rows } = Deno.consoleSize(Deno.stdout.rid);

  const pixelWidth = decodedImage.width;
  const pixelHeight = decodedImage.height;

  const resolution = (columns < rows*2) ? pixelWidth / columns : pixelHeight / (rows - 2)/2;

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
      outputString += character_map[characterIndex];
    }
    outputString += "\n";
  }

  return outputString;
}

async function printImageString(image_file_path: string):Promise<void>{
  console.log(await getImageString(image_file_path));
}

export {getImageString, printImageString}
