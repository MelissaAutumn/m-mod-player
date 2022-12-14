# M Mod Player

It's a module player. Built in Svelte, and powered by [libopenmpt](https://lib.openmpt.org/libopenmpt/) via web assembly!

## Module Files
Module files are packed music file format. You can find more information about them on [Wikipedia](https://en.wikipedia.org/wiki/Module_file#Structure).

Playback is handled entirely by [libopenmpt](https://lib.openmpt.org/libopenmpt/) via web assembly.

Note: I use the term Sequence on the front-end to mean a Sub Song. 

## Db.json

Right now we just read off of a json file. It's not great, but it does the job for now. 

To generate this db file, put your module files in `public/data/modules` (they can have sub-folders!), and run the index_modules script from the project root. (So `node scripts/index_modules.js`.)

## Libopenmpt Changes

Some adjustments have been made to the make it easier to call the extension API from javascript. You see / pull the changes [from my fork of OpenMPT](https://github.com/MelissaAutumn/openmpt).

If you plan to re-compile my fork of libopenmpt, please replace `var _scriptDir` with `var _scriptDir = './'`.

## License

Project code that was written by me is subject to the license listed in `/LICENSE`. Additional third party library licenses can be found under the `/license/` folder. 