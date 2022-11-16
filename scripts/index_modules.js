#!/usr/local/bin/node

/**
 * Module Indexer
 *
 * This will retrieve all the module files in the specific `module_folder` directory, and write a db.json file containing their file name, category (folder), meta data, and sequences (subsongs)
 */

import {readdirSync, readFileSync, writeFileSync} from 'node:fs';

import libopenmpt from '../src/worklet/libopenmpt.js';

const _libopenmpt = libopenmpt.libopenmpt();

const module_folder = 'public/data/modules';


// Pls ignore this copy and past job from the worklet.
class Utility {
  static UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

  static UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
    if (endPtr - idx > 16 && heapOrArray.buffer && Utility.UTF8Decoder) {
      return Utility.UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
    }
    var str = "";
    while (idx < endPtr) {
      var u0 = heapOrArray[idx++];
      if (!(u0 & 128)) {
        str += String.fromCharCode(u0);
        continue
      }
      var u1 = heapOrArray[idx++] & 63;
      if ((u0 & 224) == 192) {
        str += String.fromCharCode((u0 & 31) << 6 | u1);
        continue
      }
      var u2 = heapOrArray[idx++] & 63;
      if ((u0 & 240) == 224) {
        u0 = (u0 & 15) << 12 | u1 << 6 | u2
      } else {
        u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
      }
      if (u0 < 65536) {
        str += String.fromCharCode(u0)
      } else {
        var ch = u0 - 65536;
        str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
      }
    }
    return str
  }

  static UTF8ToString(libopenmpt, ptr, maxBytesToRead) {
    return ptr ? Utility.UTF8ArrayToString(libopenmpt.HEAPU8, ptr, maxBytesToRead) : ""
  }

  static stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
    if (!(maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
      var u = str.charCodeAt(i);
      if (u >= 55296 && u <= 57343) {
        var u1 = str.charCodeAt(++i);
        u = 65536 + ((u & 1023) << 10) | u1 & 1023
      }
      if (u <= 127) {
        if (outIdx >= endIdx) break;
        heap[outIdx++] = u
      } else if (u <= 2047) {
        if (outIdx + 1 >= endIdx) break;
        heap[outIdx++] = 192 | u >> 6;
        heap[outIdx++] = 128 | u & 63
      } else if (u <= 65535) {
        if (outIdx + 2 >= endIdx) break;
        heap[outIdx++] = 224 | u >> 12;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63
      } else {
        if (outIdx + 3 >= endIdx) break;
        heap[outIdx++] = 240 | u >> 18;
        heap[outIdx++] = 128 | u >> 12 & 63;
        heap[outIdx++] = 128 | u >> 6 & 63;
        heap[outIdx++] = 128 | u & 63
      }
    }
    heap[outIdx] = 0;
    return outIdx - startIdx
  }

  static lengthBytesUTF8(str) {
    let len = 0;
    for (let i = 0; i < str.length; ++i) {
      let c = str.charCodeAt(i);
      if (c <= 127) {
        len++
      } else if (c <= 2047) {
        len += 2
      } else if (c >= 55296 && c <= 57343) {
        len += 4;
        ++i
      } else {
        len += 3
      }
    }
    return len
  }


  static writeAsciiToMemory(libopenmpt, str, buffer, dontAddNull) {
    for (let i = 0; i < str.length; ++i) {
      libopenmpt.HEAP8[buffer++ >> 0] = str.charCodeAt(i)
    }
    if (!dontAddNull) libopenmpt.HEAP8[buffer >> 0] = 0
  }

  static asciiToStack(libopenmpt, str) {
    const stackStr = libopenmpt._malloc(str.length + 1);
    Utility.writeAsciiToMemory(libopenmpt, str, stackStr);
    return stackStr;
  }

  static freeStackString(libopenmpt, stackStr) {
    libopenmpt._free(stackStr);
  }
}

const create_module_ptr = (buffer) => {
  const byteArray = new Int8Array(buffer);
  const bufferPtr = _libopenmpt._malloc(byteArray.byteLength);
  _libopenmpt.HEAPU8.set(byteArray, bufferPtr);
  return [_libopenmpt._openmpt_module_create_from_memory(bufferPtr, byteArray.byteLength, 0, 0, 0), bufferPtr];
}
const delete_module_ptr = (ptr, buffer_ptr) => {
  if (buffer_ptr) {
    _libopenmpt._free(buffer_ptr);
  }
  if (ptr) {
    _libopenmpt._openmpt_module_destroy(ptr);
  }
}
const retrieve_meta_data = (ptr) => {
  const keys = Utility.UTF8ToString(_libopenmpt, _libopenmpt._openmpt_module_get_metadata_keys(ptr)).split(';');
  const data = {};

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const allocStrKeyName = Utility.asciiToStack(_libopenmpt, key);
    data[key] = Utility.UTF8ToString(_libopenmpt, _libopenmpt._openmpt_module_get_metadata(ptr, allocStrKeyName));
    _libopenmpt._free(allocStrKeyName);
  }

  return data;
}
const retrieve_sequences = (ptr) => {
  const count = _libopenmpt._openmpt_module_get_num_subsongs(ptr);
  const data = [];

  for (let i = 0; i < count; i++) {
    const allocStrName = Utility.asciiToStack(_libopenmpt, i);
    let name = Utility.UTF8ToString(_libopenmpt, _libopenmpt._openmpt_module_get_subsong_name(ptr, allocStrName));
    data.push(name.length === 0 ? ["Sequence", i + 1].join(' ') : name);
    _libopenmpt._free(allocStrName);
  }

  return data;
}


const main = () => {

  console.log("Reading module folder: ", module_folder);

  const directories_to_check = [module_folder];
  const modules_to_index = [];

  // Crawl through any folder and grab all of their files
  while (directories_to_check.length > 0) {
    const folder_name = directories_to_check.splice(0, 1)[0];

    const data = readdirSync(folder_name, {withFileTypes: true});

    for (const key in data) {
      const item = data[key];
      const full_path = [folder_name, item.name].join('/');

      if (item.isDirectory()) {
        directories_to_check.push(full_path);
      } else if (item.isFile()) {
        modules_to_index.push(full_path);
      }
    }
  }

  const song_data = {};

  // Retrieve all of the meta data
  for (const index in modules_to_index) {
    const module_path = modules_to_index[index];
    const data = readFileSync(module_path);

    // Create module ptr
    const [ptr, buffer_ptr] = create_module_ptr(data);

    // Not a module file, oops!
    if (!ptr) {
      delete_module_ptr(ptr, buffer_ptr);
      continue;
    }

    song_data[module_path] = {
      file_name: module_path.split('/').splice(-1)[0],
      category: module_path.split('/').splice(-2)[0],
      meta_data: retrieve_meta_data(ptr),
      sequences: retrieve_sequences(ptr),
    }

    // Okay clean it up
    delete_module_ptr(ptr, buffer_ptr);
  }

  console.log("Retrieved and indexed ", Object.keys(song_data).length, " module files.");
  writeFileSync('./src/db.json', JSON.stringify(song_data));
  console.log("Song database written to /src/db.json");
};

main();