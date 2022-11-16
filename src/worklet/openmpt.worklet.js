import Module from "./libopenmpt.js";

/**
 * IMPORTANT: You'll need to run this to "Compile" the finished worklet, since Firefox doesn't support imports here :(
 * > rollup src/worklet/openmpt.worklet.js --file public/worklet/openmpt.worklet.js --format iife
 */

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

/**
 * WebAudioWorkletProcessor for LibOpenMPT
 * All calls against the web assembly module (`this._libopenmpt`) are based off the c api (with an added underscore at the beginning.)
 * https://lib.openmpt.org/doc/group__libopenmpt__c.html
 */
class LibOpenMPTProcessor extends AudioWorkletProcessor {
  #destructorCalled = false;
  bufferPtr = null;
  modulePtr = null;
  leftBufferPtr = null;
  rightBufferPtr = null;

  looping = true;
  maxFramesPerChunk = 128;
  sampleRate = 44100;

  songMetaData = {};
  subSongs = [];
  commandData = [];

  currentPattern = 0;
  currentOrder = 0;
  orderCount = 0;


  constructor(options) {
    super();

    this._libopenmpt = Module.libopenmpt();

    if (!this._libopenmpt) {
      return;
    }

    this.sampleRate = options?.processorOptions?.sampleRate ?? this.sampleRate;

    this.leftBufferPtr = this._libopenmpt._malloc(4 * this.maxFramesPerChunk);
    this.rightBufferPtr = this._libopenmpt._malloc(4 * this.maxFramesPerChunk);

    this.port.onmessage = (e) => {
      this.onMessage(e);
    };
  }

  destruct() {
    // Prevent multiple calls
    if (this.#destructorCalled) {
      return;
    }

    this.#destructorCalled = true;

    if (this.leftBufferPtr) {
      this._libopenmpt._free(this.leftBufferPtr);
      this.leftBufferPtr = null;
    }
    if (this.rightBufferPtr) {
      this._libopenmpt._free(this.rightBufferPtr);
      this.rightBufferPtr = null;
    }
    this.destroyModule();

    this._libopenmpt = null;
  }

  onMessage(evt) {
    if (!evt.data.type) {
      return;
    }

    switch (evt.data.type) {
      case "data": {
        this.destroyModule();

        this.modulePtr = this.createModule(evt.data.value);
        if (this.modulePtr) {
          // A little awkward, but set our current looping preference
          this.setLoopMode(this.looping);
          this.retrieveMetaData();
          this.retrieveSubSongs();
          this.getTrack();
        }

        evt.data.value = null;
      }
        break;
      case "sequence":
        this.setSubsong(evt.data.value);
        break;
      case "loop":
        this.setLoopMode(evt.data.value);
        break;
      case "dispose":
        this.destruct();
        break;
    }
  }

  retrieveMetaData() {
    const keys = Utility.UTF8ToString(this._libopenmpt, this._libopenmpt._openmpt_module_get_metadata_keys(this.modulePtr)).split(';');
    const data = {};

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const allocStrKeyName = Utility.asciiToStack(this._libopenmpt, key);
      data[key] = Utility.UTF8ToString(this._libopenmpt, this._libopenmpt._openmpt_module_get_metadata(this.modulePtr, allocStrKeyName));
      this._libopenmpt._free(allocStrKeyName);
    }

    // Keep a local copy
    this.songMetaData = data;

    this.port.postMessage({
      type: 'metadata',
      value: this.songMetaData
    })
  }

  retrieveSubSongs() {
    const count = this._libopenmpt._openmpt_module_get_num_subsongs(this.modulePtr);
    const data = [];

    for (let i = 0; i < count; i++) {
      let name = Utility.UTF8ToString(this._libopenmpt, this._libopenmpt._openmpt_module_get_subsong_name(this.modulePtr, i));
      data.push(name.length === 0 ? ["Sequence", i+1].join(' ') : name);
    }

    // Keep a local copy
    this.subSongs = data;

    console.log(data);

    this.port.postMessage({
      type: 'subsongs',
      value: this.subSongs
    })
  }

  setSubsong(index) {
    this._libopenmpt._openmpt_module_select_subsong(this.modulePtr, index);
  }

  setLoopMode(loop) {
    this.looping = loop;
    this._libopenmpt._openmpt_module_set_repeat_count(this.modulePtr, this.looping ? -1 : 0);
  }

  createModule(buffer) {
    const byteArray = new Int8Array(buffer);
    this.bufferPtr = this._libopenmpt._malloc(byteArray.byteLength);
    this._libopenmpt.HEAPU8.set(byteArray, this.bufferPtr);
    return this._libopenmpt._openmpt_module_create_from_memory(this.bufferPtr, byteArray.byteLength, 0, 0, 0);
  }

  destroyModule() {
    if (this.modulePtr) {
      this._libopenmpt._openmpt_module_destroy(this.modulePtr);
      this.modulePtr = null;
    }
    if (this.bufferPtr) {
      this._libopenmpt._free(this.bufferPtr);
      this.bufferPtr = null;
    }
  }



  getTrack() {
    const channel_count = this._libopenmpt._openmpt_module_get_num_channels(this.modulePtr);

    const pattern_count = this._libopenmpt._openmpt_module_get_num_patterns(this.modulePtr);
    const command_data = [];

    for (let i = 0; i < pattern_count; i++) {
      const pattern_data = [];
      //let name = Utility.UTF8ToString(this._libopenmpt, this._libopenmpt._openmpt_module_get_pattern_name(this.modulePtr, i));
      const pattern_rows = this._libopenmpt._openmpt_module_get_pattern_num_rows(this.modulePtr, i);


      /*
       	int32_t  	pattern,
		int32_t  	row,
		int32_t  	channel,
		size_t  	width,
		int  	pad
       */
      for (let j = 0; j < pattern_rows; j++) {
        const row_commands = [];
        for (let k = 0; k < channel_count; k++) {
          const command = Utility.UTF8ToString(this._libopenmpt, this._libopenmpt._openmpt_module_format_pattern_row_channel(this.modulePtr, i, j, k, 1024, 0));
          row_commands.push(command);
        }
        pattern_data.push(row_commands);
      }

      command_data.push(pattern_data);
    }

    //console.log("Patterns!");
    //console.log(command_data);

    this.commandData = command_data;

    this.port.postMessage({
      type: 'patterns',
      value: command_data
    });

    this.orderCount = this._libopenmpt._openmpt_module_get_num_orders(this.modulePtr);

    this.currentPattern = 0;
    this.currentOrder = 0;
  }

  process(inputs, outputs, parameters) {
    if (!this.modulePtr || !this.leftBufferPtr || !this.rightBufferPtr) {
      this.destruct();
      return false;
    }

    const framesToRender = outputs[0][0].length;
    const framesPerChunk = Math.min(framesToRender, this.maxFramesPerChunk);

    const actualFramesPerChunk = this._libopenmpt._openmpt_module_read_float_stereo(this.modulePtr, this.sampleRate, framesPerChunk, this.leftBufferPtr, this.rightBufferPtr);

    if (actualFramesPerChunk === 0) {
      return this.looping;
    }

    const rawAudioLeft = this._libopenmpt.HEAPF32.subarray(this.leftBufferPtr / 4, this.leftBufferPtr / 4 + actualFramesPerChunk);
    const rawAudioRight = this._libopenmpt.HEAPF32.subarray(this.rightBufferPtr / 4, this.rightBufferPtr / 4 + actualFramesPerChunk);

    for (let i = 0; i < actualFramesPerChunk; ++i) {
      outputs[0][0][i] = rawAudioLeft[i];
      outputs[0][1][i] = rawAudioRight[i];
    }


    let log = false;
    const current_order = this._libopenmpt._openmpt_module_get_current_order(this.modulePtr);
    const next_order = current_order + 1;
    const pattern = this._libopenmpt._openmpt_module_get_current_pattern(this.modulePtr);
    const next_pattern = this._libopenmpt._openmpt_module_get_order_pattern(this.modulePtr, next_order < this.orderCount ? next_order : 0);

    if (log) {
      console.log("Current order index", this.currentOrder);
      console.log("Next order index", next_order);
      console.log("Current pattern", this.currentPattern);
      console.log("Next pattern", next_pattern);
    }

    this.port.postMessage({
      pattern: pattern,
      next_pattern: next_pattern,
      row: this._libopenmpt._openmpt_module_get_current_row(this.modulePtr),
      type: 'current_data'
    });


    return true;
  }
}

registerProcessor("libopenmpt-processor", LibOpenMPTProcessor);
