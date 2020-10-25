import { decodeJpeg } from "./deps.ts";

const image_file_path = "./test_images/old_man.jpg";
const character_map = "█▓▒░ "; //"#/. ";

const inverted = true;

const raw = await Deno.readFile(image_file_path);

const decodedImage = decodeJpeg(raw);

const { columns, rows } = Deno.consoleSize(Deno.stdout.rid);


const pixelWidth = decodedImage.width;
const pixelHeight = decodedImage.height;

let outputString = "";
for (let y = 0; y < pixelHeight; y += pixelWidth / (columns-1)*2) {

  for (let x = 0; x < pixelWidth; x += pixelWidth / (columns-1)) {
    const pixel = decodedImage.getPixel(Math.floor(x), Math.floor(y));
    const grayscaleValue = (pixel.r + pixel.g + pixel.b) / 3;
    let characterIndex = Math.floor(
      grayscaleValue / 255 * (character_map.length - 0.5),
    );
    characterIndex = inverted ? character_map.length - 1 - characterIndex : characterIndex;
    outputString += character_map[characterIndex];
  }
  outputString += "\n";
}

console.log(outputString);
