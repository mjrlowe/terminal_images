import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.79.0/testing/asserts.ts";
import { getImageString, printImageString } from "../mod.ts";

Deno.test("cli, online jpg image, width 56, color", async () => {
  const p = await Deno.run({
    cmd: [
      "deno",
      "run",
      "--allow-net",
      "--unstable",
      "cli.ts",
      "--file",
      "https://deno.land/images/deno_city.jpeg",
      "--color",
      "--width=56",
    ],
    stdout: "piped",
    stderr: "piped",
  });
  const status = await p.status();
  const output = await p.output();
  await p.close();
  const stdout = new TextDecoder("utf-8").decode(output);
  const error = await p.stderrOutput();
  const stderr = new TextDecoder("utf-8").decode(error);

  const expected = await Deno.readTextFile(
    "./tests/outputs/denocity_color_56.txt"
  );
  console.log(stdout, stderr);

  assertEquals(
    stdout,
    expected,
  );
  assertEquals(
    stderr,
    "",
  );
  assertEquals(status.code, 0);
  assertEquals(status.success, true);
});

Deno.test("getImageString, online png image (with transparency), width 100, grayscale", async () => {
  const actual = await getImageString({
    path: "https://deno.land/images/hashrock_simple.png",
    width: 100,
  });
  const expected = await Deno.readTextFile(
    "./tests/outputs/denosimple_nocolor_100.txt"
  );
  assertEquals(actual, expected);
});
