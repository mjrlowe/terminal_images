import {printImageString} from "./mod.ts";

printImageString({
  raw: new Uint8Array(new ArrayBuffer(5)),//await Deno.readFile("./test_images/flowers.jpg"),
  color: true
})