# terminal_images

**terminal_images** is a Deno module and CLI tool, written in TypeScript, for displaying images in the terminal.

Currently only PNG and JPG images are supported.

To install the CLI tool, run the following from the command line:

```shell
deno install --allow-read --allow-net --unstable https://x.nest.land/terminal_images@0.2.0/cli.ts
```

Then run 
```shell
terminal_images --file="https://deno.land/images/hashrock_simple.png" --character-map="   % @"
```
...and you should see something like this displayed in your terminal:
```
                 @@@@@@@@@@@@@@                 
            @@@@@@@@ @@    @@@@@@@@@            
         @@@@@       @@    @@     @@@@@         
       @@@@         @@@              @@@@       
     @@@@ @@@       @@                 @@@@     
    @@@   @@@                  @@        @@@    
  @@@@@  @@@      %%%%%%%%%%  @@@         @@@@  
  @@@@   @@   %%%%%%%%%%%%%%%%%%       @@  @@@  
 @@@        %%%%%%%%%%%%%%%%%%%%%%    @@@   @@@ 
@@@        %%%%%%%%%%%%   %%%%%%%%%   @@     @@@
@@@       %%%%%%%%%%%%%%%%%%%%%%%%%% @@@     @@@
@@@     @ %%%%%%%%%%%%%%%%%%%%%%%%%%%     @@@@@@
@@@    @@ %%%%%%%%%%%%%%%%%%%%%%%%%%%%    @@@@@@
@@@   @@@ %%%%%%%%%%%%%%%%%%%%%%%%%%%%    @@ @@@
@@@   @@    %%%%%%%%%%%%%%%%%%%%%%%%%%%  @@  @@@
 @@@  @     @@%%%%%%%%%%%%%%%%%%%%%%%%%     @@@ 
  @@@      @@@         %%%%%%%%%%%%%%%%%   @@@  
  @@@@     @@           %%%%%%%%%%%%%%%%  @@@@  
    @@@    @@         @@%%%%%%%%%%%%%%%%%@@@    
     @@@@       @@   @@@ %%%%%%%%%%%%%% @@@     
       @@@@    @@@   @@  %%%%%%%%%%%%@@@@       
         @@@@@@@@   @@@   %%%%%%%%@@@@@         
            @@@@@@@@      %% @@@@@@@            
                 @@@@@@@@@@@@@@                 
```
_Note that the size might be different, as by default it adapts to the size of your terminal._


 You can also use the module, which has exports two functions: `getImageString` and `printImageString`, which both take in an object with the same properties.
 
 Here is an example of how you can use it:

 ```ts
import { printImageString } from "https://x.nest.land/terminal_images@1.0.0/mod.ts";

printImageString({

  //replace this with the local path or URL of the image you want to print out
  path: "https://deno.land/images/deno_city.jpeg",

  //setting this to true overrides the character map
  // and prints it out as a pixelated and colored image
  color: true,

  //by default the size of the image is set to fit in the terminal, 
  //but you can override it with the width property
  width: 56
})
```

This should output something like this:

![pixelated terminal image](./images/color_terminal_output_example.png)

| Property | Type | Description | Default Value | CLI Flag |
|-|-|-|-|-|
| `path` | string | The path or URL of the image. | No default | `--file` or `-f` |
| `color` | boolean | Whether to use colored pixel blocks (█) for the output. If set to `true`, this will override the character map. | `false` | `--color` or `-c` |
| `characterMap` | string \| string[] | See the section on character maps for more information. | `"█▓▒░ "` | `--character-map` or `-m` |
| `inverted` | boolean | Whether the character map should be mapped from light to dark instead of dark to light. Normally you will want to set this to true if your terminal is in a dark theme. | `false` | `--inverted` or `-i` |
| `width` | number | The number of characters wide the image should be. | The maximum value where all of the image is visible at once | `--width` or `w` |

## Character map?

The "character map" is the characters that are used to display the image (when `color` is `false`).

The characters at the beginning of the character map should be the darkest and the ones at the end be the lightest. You can switch this around by using the `inverted` flag/property.

By default, the character map is set to `"█▓▒░ "`, but you can override this with any string you want. If you are using the module, you can set the character map to an array of strings, where each element will be used as a pixel color (rather than each character of the string).


Currently characters that JavaScript handles as having a length of greater than 1 (like emojis) do not work when you are using a character map string. _You can get them to work by using a character map array, but this isn't possible with the CLI tool._


## Todo

- [X] Add some color
- [X] Publish to nest.land
- [X] Add support for using images loaded from the web (rather than just locally)
- [X] Auto-detect file format (no need to rely on the file extension)
- [X] Allow the user to input an array of strings for the character map [added, but user can't do this when using the cli]
- [ ] Finish documentation for the user in README.md
- [X] Add some example output images
- [ ] Add some example character maps
- [ ] Add jsdoc documentation in the code
- [ ] Add some tests
- [ ] Add proper support for emojis and other characters that don't have length 1 in JavaScript
- [ ] Way to get higher resolution outputs for color mode?
- [ ] Better error handling (e.g. 404 when fetching image)
- [ ] Add support for webp images
- [ ] Add support for GIF images
- [ ] Add support for TIFF images
