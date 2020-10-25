import { decodeJpeg } from "./deps.ts";

const characters = ["#", "/", ".", " "];
const inverted = true;

const raw = await Deno.readFile("./man_shouting.jpg");

const decodedImage = decodeJpeg(raw);

const width = decodedImage.width;
const height = decodedImage.height;

let outputString = "";
for (let y = 0; y < height; y += width / 70) {
  for (let x = 0; x < width; x += width / 140) {
    const pixel = decodedImage.getPixel(Math.floor(x), Math.floor(y));
    const grayscaleValue = (pixel.r + pixel.g + pixel.b) / 3;
    let characterIndex = Math.floor(
      grayscaleValue / 255 * (characters.length - 0.5),
    );
    characterIndex = inverted ? characters.length - 1 - characterIndex : characterIndex;
    outputString += characters[characterIndex];
  }
  outputString += "\n";
}

console.log(outputString);
