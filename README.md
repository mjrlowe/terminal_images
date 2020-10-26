# terminal_images

> This module is WIP. Expect breaking changes.

**terminal_images** is a Deno module and CLI tool, written in TypeScript, for displaying images in the terminal.

Currently only PNG and JPG images are supported.

Run
```shell
deno run --allow-read --unstable https://deno.land/x/terminal_images/cli.ts --file="./path/to/image.jpg"
```
to see a basic demo.

## Todo

- [X] Add some color 🌈
- [ ] Add some tests
- [ ] Add some example output images
- [ ] Add some example character maps
- [ ] Add documentation for the user in README.md
- [ ] Add jsdoc documentation in the code
- [ ] Publish to nest.land
- [X] Add support for using images loaded from the web (rather than just locally)
- [ ] Auto-detect file format (no need to rely on the file extension)
- [ ] Add support for webp images
- [ ] Add support for GIF images
- [ ] Allow the user to input an array of strings for the character map
- [ ] Way to get higher resolution outputs for color mode?