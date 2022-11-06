var libopenmpt = (() => {
  // no imports allowed in audioworkletnodes
  var _scriptDir = './';//import.meta.url;

  return (
    function (libopenmpt) {
      libopenmpt = libopenmpt || {};

      var Module = typeof libopenmpt != "undefined" ? libopenmpt : {};
      var readyPromiseResolve, readyPromiseReject;
      Module["ready"] = new Promise(function (resolve, reject) {
        readyPromiseResolve = resolve;
        readyPromiseReject = reject
      });
      var moduleOverrides = Object.assign({}, Module);
      var arguments_ = [];
      var thisProgram = "./this.program";
      var quit_ = (status, toThrow) => {
        throw toThrow
      };
      var ENVIRONMENT_IS_WEB = typeof window == "object";
      var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
      var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
      var scriptDirectory = "";

      function locateFile(path) {
        if (Module["locateFile"]) {
          return Module["locateFile"](path, scriptDirectory)
        }
        return scriptDirectory + path
      }

      var read_, readAsync, readBinary, setWindowTitle;

      function logExceptionOnExit(e) {
        if (e instanceof ExitStatus) return;
        let toLog = e;
        err("exiting due to exception: " + toLog)
      }

      if (ENVIRONMENT_IS_NODE) {
        if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = require("path").dirname(scriptDirectory) + "/"
        } else {
          scriptDirectory = __dirname + "/"
        }
        var fs, nodePath;
        if (typeof require === "function") {
          fs = require("fs");
          nodePath = require("path")
        }
        read_ = (filename, binary) => {
          var ret = tryParseAsDataURI(filename);
          if (ret) {
            return binary ? ret : ret.toString()
          }
          filename = nodePath["normalize"](filename);
          return fs.readFileSync(filename, binary ? undefined : "utf8")
        };
        readBinary = filename => {
          var ret = read_(filename, true);
          if (!ret.buffer) {
            ret = new Uint8Array(ret)
          }
          return ret
        };
        readAsync = (filename, onload, onerror) => {
          var ret = tryParseAsDataURI(filename);
          if (ret) {
            onload(ret)
          }
          filename = nodePath["normalize"](filename);
          fs.readFile(filename, function (err, data) {
            if (err) onerror(err); else onload(data.buffer)
          })
        };
        if (process["argv"].length > 1) {
          thisProgram = process["argv"][1].replace(/\\/g, "/")
        }
        arguments_ = process["argv"].slice(2);
        process["on"]("uncaughtException", function (ex) {
          if (!(ex instanceof ExitStatus)) {
            throw ex
          }
        });
        process["on"]("unhandledRejection", function (reason) {
          throw reason
        });
        quit_ = (status, toThrow) => {
          if (keepRuntimeAlive()) {
            process["exitCode"] = status;
            throw toThrow
          }
          logExceptionOnExit(toThrow);
          process["exit"](status)
        };
        Module["inspect"] = function () {
          return "[Emscripten Module object]"
        }
      } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
        if (ENVIRONMENT_IS_WORKER) {
          scriptDirectory = self.location.href
        } else if (typeof document != "undefined" && document.currentScript) {
          scriptDirectory = document.currentScript.src
        }
        if (_scriptDir) {
          scriptDirectory = _scriptDir
        }
        if (scriptDirectory.indexOf("blob:") !== 0) {
          scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
        } else {
          scriptDirectory = ""
        }
        {
          read_ = url => {
            try {
              var xhr = new XMLHttpRequest;
              xhr.open("GET", url, false);
              xhr.send(null);
              return xhr.responseText
            } catch (err) {
              var data = tryParseAsDataURI(url);
              if (data) {
                return intArrayToString(data)
              }
              throw err
            }
          };
          if (ENVIRONMENT_IS_WORKER) {
            readBinary = url => {
              try {
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                xhr.responseType = "arraybuffer";
                xhr.send(null);
                return new Uint8Array(xhr.response)
              } catch (err) {
                var data = tryParseAsDataURI(url);
                if (data) {
                  return data
                }
                throw err
              }
            }
          }
          readAsync = (url, onload, onerror) => {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = () => {
              if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                onload(xhr.response);
                return
              }
              var data = tryParseAsDataURI(url);
              if (data) {
                onload(data.buffer);
                return
              }
              onerror()
            };
            xhr.onerror = onerror;
            xhr.send(null)
          }
        }
        setWindowTitle = title => document.title = title
      } else {
      }
      var out = Module["print"] || console.log.bind(console);
      var err = Module["printErr"] || console.warn.bind(console);
      Object.assign(Module, moduleOverrides);
      moduleOverrides = null;
      if (Module["arguments"]) arguments_ = Module["arguments"];
      if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
      if (Module["quit"]) quit_ = Module["quit"];
      var wasmBinary;
      if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
      var noExitRuntime = Module["noExitRuntime"] || true;
      if (typeof WebAssembly != "object") {
        abort("no native wasm support detected")
      }
      var wasmMemory;
      var ABORT = false;
      var EXITSTATUS;

      function assert(condition, text) {
        if (!condition) {
          abort(text)
        }
      }

      var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

      function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
        var endIdx = idx + maxBytesToRead;
        var endPtr = idx;
        while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
        if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
          return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
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

      function UTF8ToString(ptr, maxBytesToRead) {
        return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
      }

      function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
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

      function lengthBytesUTF8(str) {
        var len = 0;
        for (var i = 0; i < str.length; ++i) {
          var c = str.charCodeAt(i);
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

      var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

      function updateGlobalBufferAndViews(buf) {
        buffer = buf;
        Module["HEAP8"] = HEAP8 = new Int8Array(buf);
        Module["HEAP16"] = HEAP16 = new Int16Array(buf);
        Module["HEAP32"] = HEAP32 = new Int32Array(buf);
        Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
        Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
        Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
        Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
        Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
      }

      var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 16777216;
      var wasmTable;
      var __ATPRERUN__ = [];
      var __ATINIT__ = [];
      var __ATPOSTRUN__ = [];
      var runtimeInitialized = false;

      function keepRuntimeAlive() {
        return noExitRuntime
      }

      function preRun() {
        if (Module["preRun"]) {
          if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
          while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
          }
        }
        callRuntimeCallbacks(__ATPRERUN__)
      }

      function initRuntime() {
        runtimeInitialized = true;
        if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
        FS.ignorePermissions = false;
        TTY.init();
        callRuntimeCallbacks(__ATINIT__)
      }

      function postRun() {
        if (Module["postRun"]) {
          if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
          while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
          }
        }
        callRuntimeCallbacks(__ATPOSTRUN__)
      }

      function addOnPreRun(cb) {
        __ATPRERUN__.unshift(cb)
      }

      function addOnInit(cb) {
        __ATINIT__.unshift(cb)
      }

      function addOnPostRun(cb) {
        __ATPOSTRUN__.unshift(cb)
      }

      var runDependencies = 0;
      var runDependencyWatcher = null;
      var dependenciesFulfilled = null;

      function getUniqueRunDependency(id) {
        return id
      }

      function addRunDependency(id) {
        runDependencies++;
        if (Module["monitorRunDependencies"]) {
          Module["monitorRunDependencies"](runDependencies)
        }
      }

      function removeRunDependency(id) {
        runDependencies--;
        if (Module["monitorRunDependencies"]) {
          Module["monitorRunDependencies"](runDependencies)
        }
        if (runDependencies == 0) {
          if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
          }
          if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
          }
        }
      }

      function abort(what) {
        {
          if (Module["onAbort"]) {
            Module["onAbort"](what)
          }
        }
        what = "Aborted(" + what + ")";
        err(what);
        ABORT = true;
        EXITSTATUS = 1;
        what += ". Build with -sASSERTIONS for more info.";
        var e = new WebAssembly.RuntimeError(what);
        readyPromiseReject(e);
        throw e
      }

      var dataURIPrefix = "data:application/octet-stream;base64,";

      function isDataURI(filename) {
        return filename.startsWith(dataURIPrefix)
      }

      var wasmBinaryFile;
      if (!isDataURI(wasmBinaryFile)) {
        wasmBinaryFile = locateFile(wasmBinaryFile)
      }

      function getBinary(file) {
        try {
          if (file == wasmBinaryFile && wasmBinary) {
            return new Uint8Array(wasmBinary)
          }
          var binary = tryParseAsDataURI(file);
          if (binary) {
            return binary
          }
          if (readBinary) {
            return readBinary(file)
          }
          throw"sync fetching of the wasm failed: you can preload it to Module['wasmBinary'] manually, or emcc.py will do that for you when generating HTML (but not JS)"
        } catch (err) {
          abort(err)
        }
      }

      function instantiateSync(file, info) {
        var instance;
        var module;
        var binary;
        try {
          binary = getBinary(file);
          module = new WebAssembly.Module(binary);
          instance = new WebAssembly.Instance(module, info)
        } catch (e) {
          var str = e.toString();
          err("failed to compile wasm module: " + str);
          if (str.includes("imported Memory") || str.includes("memory import")) {
            err("Memory size incompatibility issues may be due to changing INITIAL_MEMORY at runtime to something too large. Use ALLOW_MEMORY_GROWTH to allow any size memory (and also make sure not to set INITIAL_MEMORY at runtime to something smaller than it was at compile time).")
          }
          throw e
        }
        return [instance, module]
      }

      function createWasm() {
        var info = {"a": asmLibraryArg};

        function receiveInstance(instance, module) {
          var exports = instance.exports;
          Module["asm"] = exports;
          wasmMemory = Module["asm"]["ta"];
          updateGlobalBufferAndViews(wasmMemory.buffer);
          wasmTable = Module["asm"]["Ye"];
          addOnInit(Module["asm"]["ua"]);
          removeRunDependency("wasm-instantiate")
        }

        addRunDependency("wasm-instantiate");
        if (Module["instantiateWasm"]) {
          try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            return exports
          } catch (e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            readyPromiseReject(e)
          }
        }
        var result = instantiateSync(wasmBinaryFile, info);
        receiveInstance(result[0]);
        return Module["asm"]
      }

      var tempDouble;
      var tempI64;

      function ExitStatus(status) {
        this.name = "ExitStatus";
        this.message = "Program terminated with exit(" + status + ")";
        this.status = status
      }

      function callRuntimeCallbacks(callbacks) {
        while (callbacks.length > 0) {
          callbacks.shift()(Module)
        }
      }

      function intArrayToString(array) {
        var ret = [];
        for (var i = 0; i < array.length; i++) {
          var chr = array[i];
          if (chr > 255) {
            if (ASSERTIONS) {
              assert(false, "Character code " + chr + " (" + String.fromCharCode(chr) + ")  at offset " + i + " not in 0x00-0xFF.")
            }
            chr &= 255
          }
          ret.push(String.fromCharCode(chr))
        }
        return ret.join("")
      }

      function ___assert_fail(condition, filename, line, func) {
        abort("Assertion failed: " + UTF8ToString(condition) + ", at: " + [filename ? UTF8ToString(filename) : "unknown filename", line, func ? UTF8ToString(func) : "unknown function"])
      }

      function ___cxa_allocate_exception(size) {
        return _malloc(size + 24) + 24
      }

      var exceptionCaught = [];

      function exception_addRef(info) {
        info.add_ref()
      }

      var uncaughtExceptionCount = 0;

      function ___cxa_begin_catch(ptr) {
        var info = new ExceptionInfo(ptr);
        if (!info.get_caught()) {
          info.set_caught(true);
          uncaughtExceptionCount--
        }
        info.set_rethrown(false);
        exceptionCaught.push(info);
        exception_addRef(info);
        return info.get_exception_ptr()
      }

      var exceptionLast = 0;

      function ExceptionInfo(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
        this.set_type = function (type) {
          HEAPU32[this.ptr + 4 >> 2] = type
        };
        this.get_type = function () {
          return HEAPU32[this.ptr + 4 >> 2]
        };
        this.set_destructor = function (destructor) {
          HEAPU32[this.ptr + 8 >> 2] = destructor
        };
        this.get_destructor = function () {
          return HEAPU32[this.ptr + 8 >> 2]
        };
        this.set_refcount = function (refcount) {
          HEAP32[this.ptr >> 2] = refcount
        };
        this.set_caught = function (caught) {
          caught = caught ? 1 : 0;
          HEAP8[this.ptr + 12 >> 0] = caught
        };
        this.get_caught = function () {
          return HEAP8[this.ptr + 12 >> 0] != 0
        };
        this.set_rethrown = function (rethrown) {
          rethrown = rethrown ? 1 : 0;
          HEAP8[this.ptr + 13 >> 0] = rethrown
        };
        this.get_rethrown = function () {
          return HEAP8[this.ptr + 13 >> 0] != 0
        };
        this.init = function (type, destructor) {
          this.set_adjusted_ptr(0);
          this.set_type(type);
          this.set_destructor(destructor);
          this.set_refcount(0);
          this.set_caught(false);
          this.set_rethrown(false)
        };
        this.add_ref = function () {
          var value = HEAP32[this.ptr >> 2];
          HEAP32[this.ptr >> 2] = value + 1
        };
        this.release_ref = function () {
          var prev = HEAP32[this.ptr >> 2];
          HEAP32[this.ptr >> 2] = prev - 1;
          return prev === 1
        };
        this.set_adjusted_ptr = function (adjustedPtr) {
          HEAPU32[this.ptr + 16 >> 2] = adjustedPtr
        };
        this.get_adjusted_ptr = function () {
          return HEAPU32[this.ptr + 16 >> 2]
        };
        this.get_exception_ptr = function () {
          var isPointer = ___cxa_is_pointer_type(this.get_type());
          if (isPointer) {
            return HEAPU32[this.excPtr >> 2]
          }
          var adjusted = this.get_adjusted_ptr();
          if (adjusted !== 0) return adjusted;
          return this.excPtr
        }
      }

      function ___cxa_free_exception(ptr) {
        return _free(new ExceptionInfo(ptr).ptr)
      }

      function getWasmTableEntry(funcPtr) {
        return wasmTable.get(funcPtr)
      }

      function exception_decRef(info) {
        if (info.release_ref() && !info.get_rethrown()) {
          var destructor = info.get_destructor();
          if (destructor) {
            getWasmTableEntry(destructor)(info.excPtr)
          }
          ___cxa_free_exception(info.excPtr)
        }
      }

      function ___cxa_end_catch() {
        _setThrew(0);
        var info = exceptionCaught.pop();
        exception_decRef(info);
        exceptionLast = 0
      }

      function ___resumeException(ptr) {
        if (!exceptionLast) {
          exceptionLast = ptr
        }
        throw ptr
      }

      function ___cxa_find_matching_catch_17() {
        var thrown = exceptionLast;
        if (!thrown) {
          setTempRet0(0);
          return 0
        }
        var info = new ExceptionInfo(thrown);
        info.set_adjusted_ptr(thrown);
        var thrownType = info.get_type();
        if (!thrownType) {
          setTempRet0(0);
          return thrown
        }
        for (var i = 0; i < arguments.length; i++) {
          var caughtType = arguments[i];
          if (caughtType === 0 || caughtType === thrownType) {
            break
          }
          var adjusted_ptr_addr = info.ptr + 16;
          if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
            setTempRet0(caughtType);
            return thrown
          }
        }
        setTempRet0(thrownType);
        return thrown
      }

      function ___cxa_find_matching_catch_2() {
        var thrown = exceptionLast;
        if (!thrown) {
          setTempRet0(0);
          return 0
        }
        var info = new ExceptionInfo(thrown);
        info.set_adjusted_ptr(thrown);
        var thrownType = info.get_type();
        if (!thrownType) {
          setTempRet0(0);
          return thrown
        }
        for (var i = 0; i < arguments.length; i++) {
          var caughtType = arguments[i];
          if (caughtType === 0 || caughtType === thrownType) {
            break
          }
          var adjusted_ptr_addr = info.ptr + 16;
          if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
            setTempRet0(caughtType);
            return thrown
          }
        }
        setTempRet0(thrownType);
        return thrown
      }

      function ___cxa_find_matching_catch_3() {
        var thrown = exceptionLast;
        if (!thrown) {
          setTempRet0(0);
          return 0
        }
        var info = new ExceptionInfo(thrown);
        info.set_adjusted_ptr(thrown);
        var thrownType = info.get_type();
        if (!thrownType) {
          setTempRet0(0);
          return thrown
        }
        for (var i = 0; i < arguments.length; i++) {
          var caughtType = arguments[i];
          if (caughtType === 0 || caughtType === thrownType) {
            break
          }
          var adjusted_ptr_addr = info.ptr + 16;
          if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
            setTempRet0(caughtType);
            return thrown
          }
        }
        setTempRet0(thrownType);
        return thrown
      }

      function ___cxa_find_matching_catch_4() {
        var thrown = exceptionLast;
        if (!thrown) {
          setTempRet0(0);
          return 0
        }
        var info = new ExceptionInfo(thrown);
        info.set_adjusted_ptr(thrown);
        var thrownType = info.get_type();
        if (!thrownType) {
          setTempRet0(0);
          return thrown
        }
        for (var i = 0; i < arguments.length; i++) {
          var caughtType = arguments[i];
          if (caughtType === 0 || caughtType === thrownType) {
            break
          }
          var adjusted_ptr_addr = info.ptr + 16;
          if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
            setTempRet0(caughtType);
            return thrown
          }
        }
        setTempRet0(thrownType);
        return thrown
      }

      function ___cxa_find_matching_catch_6() {
        var thrown = exceptionLast;
        if (!thrown) {
          setTempRet0(0);
          return 0
        }
        var info = new ExceptionInfo(thrown);
        info.set_adjusted_ptr(thrown);
        var thrownType = info.get_type();
        if (!thrownType) {
          setTempRet0(0);
          return thrown
        }
        for (var i = 0; i < arguments.length; i++) {
          var caughtType = arguments[i];
          if (caughtType === 0 || caughtType === thrownType) {
            break
          }
          var adjusted_ptr_addr = info.ptr + 16;
          if (___cxa_can_catch(caughtType, thrownType, adjusted_ptr_addr)) {
            setTempRet0(caughtType);
            return thrown
          }
        }
        setTempRet0(thrownType);
        return thrown
      }

      function ___cxa_rethrow() {
        var info = exceptionCaught.pop();
        if (!info) {
          abort("no exception to throw")
        }
        var ptr = info.excPtr;
        if (!info.get_rethrown()) {
          exceptionCaught.push(info);
          info.set_rethrown(true);
          info.set_caught(false);
          uncaughtExceptionCount++
        }
        exceptionLast = ptr;
        throw ptr
      }

      function ___cxa_throw(ptr, type, destructor) {
        var info = new ExceptionInfo(ptr);
        info.init(type, destructor);
        exceptionLast = ptr;
        uncaughtExceptionCount++;
        throw ptr
      }

      function ___cxa_uncaught_exceptions() {
        return uncaughtExceptionCount
      }

      var nowIsMonotonic = true;

      function __emscripten_get_now_is_monotonic() {
        return nowIsMonotonic
      }

      function _abort() {
        abort("")
      }

      function _emscripten_date_now() {
        return Date.now()
      }

      var _emscripten_get_now;
      if (ENVIRONMENT_IS_NODE) {
        _emscripten_get_now = () => {
          var t = process["hrtime"]();
          return t[0] * 1e3 + t[1] / 1e6
        }
      } else _emscripten_get_now = () => performance.now();

      function getHeapMax() {
        return 2147483648
      }

      function emscripten_realloc_buffer(size) {
        try {
          wasmMemory.grow(size - buffer.byteLength + 65535 >>> 16);
          updateGlobalBufferAndViews(wasmMemory.buffer);
          return 1
        } catch (e) {
        }
      }

      function _emscripten_resize_heap(requestedSize) {
        var oldSize = HEAPU8.length;
        requestedSize = requestedSize >>> 0;
        var maxHeapSize = getHeapMax();
        if (requestedSize > maxHeapSize) {
          return false
        }
        let alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
        for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
          var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
          overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
          var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
          var replacement = emscripten_realloc_buffer(newSize);
          if (replacement) {
            return true
          }
        }
        return false
      }

      var ENV = {};

      function getExecutableName() {
        return thisProgram || "./this.program"
      }

      function getEnvStrings() {
        if (!getEnvStrings.strings) {
          var lang = (typeof navigator == "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
          var env = {
            "USER": "web_user",
            "LOGNAME": "web_user",
            "PATH": "/",
            "PWD": "/",
            "HOME": "/home/web_user",
            "LANG": lang,
            "_": getExecutableName()
          };
          for (var x in ENV) {
            if (ENV[x] === undefined) delete env[x]; else env[x] = ENV[x]
          }
          var strings = [];
          for (var x in env) {
            strings.push(x + "=" + env[x])
          }
          getEnvStrings.strings = strings
        }
        return getEnvStrings.strings
      }

      function writeAsciiToMemory(str, buffer, dontAddNull) {
        for (var i = 0; i < str.length; ++i) {
          HEAP8[buffer++ >> 0] = str.charCodeAt(i)
        }
        if (!dontAddNull) HEAP8[buffer >> 0] = 0
      }

      var PATH = {
        isAbs: path => path.charAt(0) === "/", splitPath: filename => {
          var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
          return splitPathRe.exec(filename).slice(1)
        }, normalizeArray: (parts, allowAboveRoot) => {
          var up = 0;
          for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
              parts.splice(i, 1)
            } else if (last === "..") {
              parts.splice(i, 1);
              up++
            } else if (up) {
              parts.splice(i, 1);
              up--
            }
          }
          if (allowAboveRoot) {
            for (; up; up--) {
              parts.unshift("..")
            }
          }
          return parts
        }, normalize: path => {
          var isAbsolute = PATH.isAbs(path), trailingSlash = path.substr(-1) === "/";
          path = PATH.normalizeArray(path.split("/").filter(p => !!p), !isAbsolute).join("/");
          if (!path && !isAbsolute) {
            path = "."
          }
          if (path && trailingSlash) {
            path += "/"
          }
          return (isAbsolute ? "/" : "") + path
        }, dirname: path => {
          var result = PATH.splitPath(path), root = result[0], dir = result[1];
          if (!root && !dir) {
            return "."
          }
          if (dir) {
            dir = dir.substr(0, dir.length - 1)
          }
          return root + dir
        }, basename: path => {
          if (path === "/") return "/";
          path = PATH.normalize(path);
          path = path.replace(/\/$/, "");
          var lastSlash = path.lastIndexOf("/");
          if (lastSlash === -1) return path;
          return path.substr(lastSlash + 1)
        }, join: function () {
          var paths = Array.prototype.slice.call(arguments);
          return PATH.normalize(paths.join("/"))
        }, join2: (l, r) => {
          return PATH.normalize(l + "/" + r)
        }
      };

      function getRandomDevice() {
        if (typeof crypto == "object" && typeof crypto["getRandomValues"] == "function") {
          var randomBuffer = new Uint8Array(1);
          return () => {
            crypto.getRandomValues(randomBuffer);
            return randomBuffer[0]
          }
        } else if (ENVIRONMENT_IS_NODE) {
          try {
            var crypto_module = require("crypto");
            return () => crypto_module["randomBytes"](1)[0]
          } catch (e) {
          }
        }
        return () => abort("randomDevice")
      }

      var PATH_FS = {
        resolve: function () {
          var resolvedPath = "", resolvedAbsolute = false;
          for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path != "string") {
              throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
              return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = PATH.isAbs(path)
          }
          resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(p => !!p), !resolvedAbsolute).join("/");
          return (resolvedAbsolute ? "/" : "") + resolvedPath || "."
        }, relative: (from, to) => {
          from = PATH_FS.resolve(from).substr(1);
          to = PATH_FS.resolve(to).substr(1);

          function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
              if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
              if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
          }

          var fromParts = trim(from.split("/"));
          var toParts = trim(to.split("/"));
          var length = Math.min(fromParts.length, toParts.length);
          var samePartsLength = length;
          for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
              samePartsLength = i;
              break
            }
          }
          var outputParts = [];
          for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
          }
          outputParts = outputParts.concat(toParts.slice(samePartsLength));
          return outputParts.join("/")
        }
      };

      function intArrayFromString(stringy, dontAddNull, length) {
        var len = length > 0 ? length : lengthBytesUTF8(stringy) + 1;
        var u8array = new Array(len);
        var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
        if (dontAddNull) u8array.length = numBytesWritten;
        return u8array
      }

      var TTY = {
        ttys: [], init: function () {
        }, shutdown: function () {
        }, register: function (dev, ops) {
          TTY.ttys[dev] = {input: [], output: [], ops: ops};
          FS.registerDevice(dev, TTY.stream_ops)
        }, stream_ops: {
          open: function (stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
              throw new FS.ErrnoError(43)
            }
            stream.tty = tty;
            stream.seekable = false
          }, close: function (stream) {
            stream.tty.ops.fsync(stream.tty)
          }, fsync: function (stream) {
            stream.tty.ops.fsync(stream.tty)
          }, read: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
              throw new FS.ErrnoError(60)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = stream.tty.ops.get_char(stream.tty)
              } catch (e) {
                throw new FS.ErrnoError(29)
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(6)
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset + i] = result
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now()
            }
            return bytesRead
          }, write: function (stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
              throw new FS.ErrnoError(60)
            }
            try {
              for (var i = 0; i < length; i++) {
                stream.tty.ops.put_char(stream.tty, buffer[offset + i])
              }
            } catch (e) {
              throw new FS.ErrnoError(29)
            }
            if (length) {
              stream.node.timestamp = Date.now()
            }
            return i
          }
        }, default_tty_ops: {
          get_char: function (tty) {
            if (!tty.input.length) {
              var result = null;
              if (ENVIRONMENT_IS_NODE) {
                var BUFSIZE = 256;
                var buf = Buffer.alloc(BUFSIZE);
                var bytesRead = 0;
                try {
                  bytesRead = fs.readSync(process.stdin.fd, buf, 0, BUFSIZE, -1)
                } catch (e) {
                  if (e.toString().includes("EOF")) bytesRead = 0; else throw e
                }
                if (bytesRead > 0) {
                  result = buf.slice(0, bytesRead).toString("utf-8")
                } else {
                  result = null
                }
              } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                result = window.prompt("Input: ");
                if (result !== null) {
                  result += "\n"
                }
              } else if (typeof readline == "function") {
                result = readline();
                if (result !== null) {
                  result += "\n"
                }
              }
              if (!result) {
                return null
              }
              tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
          }, put_char: function (tty, val) {
            if (val === null || val === 10) {
              out(UTF8ArrayToString(tty.output, 0));
              tty.output = []
            } else {
              if (val != 0) tty.output.push(val)
            }
          }, fsync: function (tty) {
            if (tty.output && tty.output.length > 0) {
              out(UTF8ArrayToString(tty.output, 0));
              tty.output = []
            }
          }
        }, default_tty1_ops: {
          put_char: function (tty, val) {
            if (val === null || val === 10) {
              err(UTF8ArrayToString(tty.output, 0));
              tty.output = []
            } else {
              if (val != 0) tty.output.push(val)
            }
          }, fsync: function (tty) {
            if (tty.output && tty.output.length > 0) {
              err(UTF8ArrayToString(tty.output, 0));
              tty.output = []
            }
          }
        }
      };

      function mmapAlloc(size) {
        abort()
      }

      var MEMFS = {
        ops_table: null, mount: function (mount) {
          return MEMFS.createNode(null, "/", 16384 | 511, 0)
        }, createNode: function (parent, name, mode, dev) {
          if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(63)
          }
          if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
              dir: {
                node: {
                  getattr: MEMFS.node_ops.getattr,
                  setattr: MEMFS.node_ops.setattr,
                  lookup: MEMFS.node_ops.lookup,
                  mknod: MEMFS.node_ops.mknod,
                  rename: MEMFS.node_ops.rename,
                  unlink: MEMFS.node_ops.unlink,
                  rmdir: MEMFS.node_ops.rmdir,
                  readdir: MEMFS.node_ops.readdir,
                  symlink: MEMFS.node_ops.symlink
                }, stream: {llseek: MEMFS.stream_ops.llseek}
              },
              file: {
                node: {getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr},
                stream: {
                  llseek: MEMFS.stream_ops.llseek,
                  read: MEMFS.stream_ops.read,
                  write: MEMFS.stream_ops.write,
                  allocate: MEMFS.stream_ops.allocate,
                  mmap: MEMFS.stream_ops.mmap,
                  msync: MEMFS.stream_ops.msync
                }
              },
              link: {
                node: {
                  getattr: MEMFS.node_ops.getattr,
                  setattr: MEMFS.node_ops.setattr,
                  readlink: MEMFS.node_ops.readlink
                }, stream: {}
              },
              chrdev: {
                node: {getattr: MEMFS.node_ops.getattr, setattr: MEMFS.node_ops.setattr},
                stream: FS.chrdev_stream_ops
              }
            }
          }
          var node = FS.createNode(parent, name, mode, dev);
          if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
          } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
          } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
          } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
          }
          node.timestamp = Date.now();
          if (parent) {
            parent.contents[name] = node;
            parent.timestamp = node.timestamp
          }
          return node
        }, getFileDataAsTypedArray: function (node) {
          if (!node.contents) return new Uint8Array(0);
          if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
          return new Uint8Array(node.contents)
        }, expandFileStorage: function (node, newCapacity) {
          var prevCapacity = node.contents ? node.contents.length : 0;
          if (prevCapacity >= newCapacity) return;
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) >>> 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity);
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0)
        }, resizeFileStorage: function (node, newSize) {
          if (node.usedBytes == newSize) return;
          if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0
          } else {
            var oldContents = node.contents;
            node.contents = new Uint8Array(newSize);
            if (oldContents) {
              node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize
          }
        }, node_ops: {
          getattr: function (node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
              attr.size = 4096
            } else if (FS.isFile(node.mode)) {
              attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
              attr.size = node.link.length
            } else {
              attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
          }, setattr: function (node, attr) {
            if (attr.mode !== undefined) {
              node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
              node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
              MEMFS.resizeFileStorage(node, attr.size)
            }
          }, lookup: function (parent, name) {
            throw FS.genericErrors[44]
          }, mknod: function (parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
          }, rename: function (old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
              var new_node;
              try {
                new_node = FS.lookupNode(new_dir, new_name)
              } catch (e) {
              }
              if (new_node) {
                for (var i in new_node.contents) {
                  throw new FS.ErrnoError(55)
                }
              }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.parent.timestamp = Date.now();
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            new_dir.timestamp = old_node.parent.timestamp;
            old_node.parent = new_dir
          }, unlink: function (parent, name) {
            delete parent.contents[name];
            parent.timestamp = Date.now()
          }, rmdir: function (parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
              throw new FS.ErrnoError(55)
            }
            delete parent.contents[name];
            parent.timestamp = Date.now()
          }, readdir: function (node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
              if (!node.contents.hasOwnProperty(key)) {
                continue
              }
              entries.push(key)
            }
            return entries
          }, symlink: function (parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
          }, readlink: function (node) {
            if (!FS.isLink(node.mode)) {
              throw new FS.ErrnoError(28)
            }
            return node.link
          }
        }, stream_ops: {
          read: function (stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
              buffer.set(contents.subarray(position, position + size), offset)
            } else {
              for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
          }, write: function (stream, buffer, offset, length, position, canOwn) {
            if (buffer.buffer === HEAP8.buffer) {
              canOwn = false
            }
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
              if (canOwn) {
                node.contents = buffer.subarray(offset, offset + length);
                node.usedBytes = length;
                return length
              } else if (node.usedBytes === 0 && position === 0) {
                node.contents = buffer.slice(offset, offset + length);
                node.usedBytes = length;
                return length
              } else if (position + length <= node.usedBytes) {
                node.contents.set(buffer.subarray(offset, offset + length), position);
                return length
              }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) {
              node.contents.set(buffer.subarray(offset, offset + length), position)
            } else {
              for (var i = 0; i < length; i++) {
                node.contents[position + i] = buffer[offset + i]
              }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
          }, llseek: function (stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
              position += stream.position
            } else if (whence === 2) {
              if (FS.isFile(stream.node.mode)) {
                position += stream.node.usedBytes
              }
            }
            if (position < 0) {
              throw new FS.ErrnoError(28)
            }
            return position
          }, allocate: function (stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
          }, mmap: function (stream, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
              throw new FS.ErrnoError(43)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (!(flags & 2) && contents.buffer === buffer) {
              allocated = false;
              ptr = contents.byteOffset
            } else {
              if (position > 0 || position + length < contents.length) {
                if (contents.subarray) {
                  contents = contents.subarray(position, position + length)
                } else {
                  contents = Array.prototype.slice.call(contents, position, position + length)
                }
              }
              allocated = true;
              ptr = mmapAlloc(length);
              if (!ptr) {
                throw new FS.ErrnoError(48)
              }
              HEAP8.set(contents, ptr)
            }
            return {ptr: ptr, allocated: allocated}
          }, msync: function (stream, buffer, offset, length, mmapFlags) {
            MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
          }
        }
      };

      function asyncLoad(url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
        readAsync(url, arrayBuffer => {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (dep) removeRunDependency(dep)
        }, event => {
          if (onerror) {
            onerror()
          } else {
            throw'Loading data file "' + url + '" failed.'
          }
        });
        if (dep) addRunDependency(dep)
      }

      var FS = {
        root: null,
        mounts: [],
        devices: {},
        streams: [],
        nextInode: 1,
        nameTable: null,
        currentPath: "/",
        initialized: false,
        ignorePermissions: true,
        ErrnoError: null,
        genericErrors: {},
        filesystems: null,
        syncFSRequests: 0,
        lookupPath: (path, opts = {}) => {
          path = PATH_FS.resolve(FS.cwd(), path);
          if (!path) return {path: "", node: null};
          var defaults = {follow_mount: true, recurse_count: 0};
          opts = Object.assign(defaults, opts);
          if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(32)
          }
          var parts = PATH.normalizeArray(path.split("/").filter(p => !!p), false);
          var current = FS.root;
          var current_path = "/";
          for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
              break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
              if (!islast || islast && opts.follow_mount) {
                current = current.mounted.root
              }
            }
            if (!islast || opts.follow) {
              var count = 0;
              while (FS.isLink(current.mode)) {
                var link = FS.readlink(current_path);
                current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                var lookup = FS.lookupPath(current_path, {recurse_count: opts.recurse_count + 1});
                current = lookup.node;
                if (count++ > 40) {
                  throw new FS.ErrnoError(32)
                }
              }
            }
          }
          return {path: current_path, node: current}
        },
        getPath: node => {
          var path;
          while (true) {
            if (FS.isRoot(node)) {
              var mount = node.mount.mountpoint;
              if (!path) return mount;
              return mount[mount.length - 1] !== "/" ? mount + "/" + path : mount + path
            }
            path = path ? node.name + "/" + path : node.name;
            node = node.parent
          }
        },
        hashName: (parentid, name) => {
          var hash = 0;
          for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
          }
          return (parentid + hash >>> 0) % FS.nameTable.length
        },
        hashAddNode: node => {
          var hash = FS.hashName(node.parent.id, node.name);
          node.name_next = FS.nameTable[hash];
          FS.nameTable[hash] = node
        },
        hashRemoveNode: node => {
          var hash = FS.hashName(node.parent.id, node.name);
          if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
          } else {
            var current = FS.nameTable[hash];
            while (current) {
              if (current.name_next === node) {
                current.name_next = node.name_next;
                break
              }
              current = current.name_next
            }
          }
        },
        lookupNode: (parent, name) => {
          var errCode = FS.mayLookup(parent);
          if (errCode) {
            throw new FS.ErrnoError(errCode, parent)
          }
          var hash = FS.hashName(parent.id, name);
          for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
              return node
            }
          }
          return FS.lookup(parent, name)
        },
        createNode: (parent, name, mode, rdev) => {
          var node = new FS.FSNode(parent, name, mode, rdev);
          FS.hashAddNode(node);
          return node
        },
        destroyNode: node => {
          FS.hashRemoveNode(node)
        },
        isRoot: node => {
          return node === node.parent
        },
        isMountpoint: node => {
          return !!node.mounted
        },
        isFile: mode => {
          return (mode & 61440) === 32768
        },
        isDir: mode => {
          return (mode & 61440) === 16384
        },
        isLink: mode => {
          return (mode & 61440) === 40960
        },
        isChrdev: mode => {
          return (mode & 61440) === 8192
        },
        isBlkdev: mode => {
          return (mode & 61440) === 24576
        },
        isFIFO: mode => {
          return (mode & 61440) === 4096
        },
        isSocket: mode => {
          return (mode & 49152) === 49152
        },
        flagModes: {"r": 0, "r+": 2, "w": 577, "w+": 578, "a": 1089, "a+": 1090},
        modeStringToFlags: str => {
          var flags = FS.flagModes[str];
          if (typeof flags == "undefined") {
            throw new Error("Unknown file open mode: " + str)
          }
          return flags
        },
        flagsToPermissionString: flag => {
          var perms = ["r", "w", "rw"][flag & 3];
          if (flag & 512) {
            perms += "w"
          }
          return perms
        },
        nodePermissions: (node, perms) => {
          if (FS.ignorePermissions) {
            return 0
          }
          if (perms.includes("r") && !(node.mode & 292)) {
            return 2
          } else if (perms.includes("w") && !(node.mode & 146)) {
            return 2
          } else if (perms.includes("x") && !(node.mode & 73)) {
            return 2
          }
          return 0
        },
        mayLookup: dir => {
          var errCode = FS.nodePermissions(dir, "x");
          if (errCode) return errCode;
          if (!dir.node_ops.lookup) return 2;
          return 0
        },
        mayCreate: (dir, name) => {
          try {
            var node = FS.lookupNode(dir, name);
            return 20
          } catch (e) {
          }
          return FS.nodePermissions(dir, "wx")
        },
        mayDelete: (dir, name, isdir) => {
          var node;
          try {
            node = FS.lookupNode(dir, name)
          } catch (e) {
            return e.errno
          }
          var errCode = FS.nodePermissions(dir, "wx");
          if (errCode) {
            return errCode
          }
          if (isdir) {
            if (!FS.isDir(node.mode)) {
              return 54
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
              return 10
            }
          } else {
            if (FS.isDir(node.mode)) {
              return 31
            }
          }
          return 0
        },
        mayOpen: (node, flags) => {
          if (!node) {
            return 44
          }
          if (FS.isLink(node.mode)) {
            return 32
          } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
              return 31
            }
          }
          return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
        },
        MAX_OPEN_FDS: 4096,
        nextfd: (fd_start = 0, fd_end = FS.MAX_OPEN_FDS) => {
          for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
              return fd
            }
          }
          throw new FS.ErrnoError(33)
        },
        getStream: fd => FS.streams[fd],
        createStream: (stream, fd_start, fd_end) => {
          if (!FS.FSStream) {
            FS.FSStream = function () {
              this.shared = {}
            };
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
              object: {
                get: function () {
                  return this.node
                }, set: function (val) {
                  this.node = val
                }
              }, isRead: {
                get: function () {
                  return (this.flags & 2097155) !== 1
                }
              }, isWrite: {
                get: function () {
                  return (this.flags & 2097155) !== 0
                }
              }, isAppend: {
                get: function () {
                  return this.flags & 1024
                }
              }, flags: {
                get: function () {
                  return this.shared.flags
                }, set: function (val) {
                  this.shared.flags = val
                }
              }, position: {
                get: function () {
                  return this.shared.position
                }, set: function (val) {
                  this.shared.position = val
                }
              }
            })
          }
          stream = Object.assign(new FS.FSStream, stream);
          var fd = FS.nextfd(fd_start, fd_end);
          stream.fd = fd;
          FS.streams[fd] = stream;
          return stream
        },
        closeStream: fd => {
          FS.streams[fd] = null
        },
        chrdev_stream_ops: {
          open: stream => {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
              stream.stream_ops.open(stream)
            }
          }, llseek: () => {
            throw new FS.ErrnoError(70)
          }
        },
        major: dev => dev >> 8,
        minor: dev => dev & 255,
        makedev: (ma, mi) => ma << 8 | mi,
        registerDevice: (dev, ops) => {
          FS.devices[dev] = {stream_ops: ops}
        },
        getDevice: dev => FS.devices[dev],
        getMounts: mount => {
          var mounts = [];
          var check = [mount];
          while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
          }
          return mounts
        },
        syncfs: (populate, callback) => {
          if (typeof populate == "function") {
            callback = populate;
            populate = false
          }
          FS.syncFSRequests++;
          if (FS.syncFSRequests > 1) {
            err("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
          }
          var mounts = FS.getMounts(FS.root.mount);
          var completed = 0;

          function doCallback(errCode) {
            FS.syncFSRequests--;
            return callback(errCode)
          }

          function done(errCode) {
            if (errCode) {
              if (!done.errored) {
                done.errored = true;
                return doCallback(errCode)
              }
              return
            }
            if (++completed >= mounts.length) {
              doCallback(null)
            }
          }

          mounts.forEach(mount => {
            if (!mount.type.syncfs) {
              return done(null)
            }
            mount.type.syncfs(mount, populate, done)
          })
        },
        mount: (type, opts, mountpoint) => {
          var root = mountpoint === "/";
          var pseudo = !mountpoint;
          var node;
          if (root && FS.root) {
            throw new FS.ErrnoError(10)
          } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {follow_mount: false});
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
              throw new FS.ErrnoError(10)
            }
            if (!FS.isDir(node.mode)) {
              throw new FS.ErrnoError(54)
            }
          }
          var mount = {type: type, opts: opts, mountpoint: mountpoint, mounts: []};
          var mountRoot = type.mount(mount);
          mountRoot.mount = mount;
          mount.root = mountRoot;
          if (root) {
            FS.root = mountRoot
          } else if (node) {
            node.mounted = mount;
            if (node.mount) {
              node.mount.mounts.push(mount)
            }
          }
          return mountRoot
        },
        unmount: mountpoint => {
          var lookup = FS.lookupPath(mountpoint, {follow_mount: false});
          if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(28)
          }
          var node = lookup.node;
          var mount = node.mounted;
          var mounts = FS.getMounts(mount);
          Object.keys(FS.nameTable).forEach(hash => {
            var current = FS.nameTable[hash];
            while (current) {
              var next = current.name_next;
              if (mounts.includes(current.mount)) {
                FS.destroyNode(current)
              }
              current = next
            }
          });
          node.mounted = null;
          var idx = node.mount.mounts.indexOf(mount);
          node.mount.mounts.splice(idx, 1)
        },
        lookup: (parent, name) => {
          return parent.node_ops.lookup(parent, name)
        },
        mknod: (path, mode, dev) => {
          var lookup = FS.lookupPath(path, {parent: true});
          var parent = lookup.node;
          var name = PATH.basename(path);
          if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(28)
          }
          var errCode = FS.mayCreate(parent, name);
          if (errCode) {
            throw new FS.ErrnoError(errCode)
          }
          if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(63)
          }
          return parent.node_ops.mknod(parent, name, mode, dev)
        },
        create: (path, mode) => {
          mode = mode !== undefined ? mode : 438;
          mode &= 4095;
          mode |= 32768;
          return FS.mknod(path, mode, 0)
        },
        mkdir: (path, mode) => {
          mode = mode !== undefined ? mode : 511;
          mode &= 511 | 512;
          mode |= 16384;
          return FS.mknod(path, mode, 0)
        },
        mkdirTree: (path, mode) => {
          var dirs = path.split("/");
          var d = "";
          for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
              FS.mkdir(d, mode)
            } catch (e) {
              if (e.errno != 20) throw e
            }
          }
        },
        mkdev: (path, mode, dev) => {
          if (typeof dev == "undefined") {
            dev = mode;
            mode = 438
          }
          mode |= 8192;
          return FS.mknod(path, mode, dev)
        },
        symlink: (oldpath, newpath) => {
          if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(44)
          }
          var lookup = FS.lookupPath(newpath, {parent: true});
          var parent = lookup.node;
          if (!parent) {
            throw new FS.ErrnoError(44)
          }
          var newname = PATH.basename(newpath);
          var errCode = FS.mayCreate(parent, newname);
          if (errCode) {
            throw new FS.ErrnoError(errCode)
          }
          if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(63)
          }
          return parent.node_ops.symlink(parent, newname, oldpath)
        },
        rename: (old_path, new_path) => {
          var old_dirname = PATH.dirname(old_path);
          var new_dirname = PATH.dirname(new_path);
          var old_name = PATH.basename(old_path);
          var new_name = PATH.basename(new_path);
          var lookup, old_dir, new_dir;
          lookup = FS.lookupPath(old_path, {parent: true});
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, {parent: true});
          new_dir = lookup.node;
          if (!old_dir || !new_dir) throw new FS.ErrnoError(44);
          if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(75)
          }
          var old_node = FS.lookupNode(old_dir, old_name);
          var relative = PATH_FS.relative(old_path, new_dirname);
          if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(28)
          }
          relative = PATH_FS.relative(new_path, old_dirname);
          if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(55)
          }
          var new_node;
          try {
            new_node = FS.lookupNode(new_dir, new_name)
          } catch (e) {
          }
          if (old_node === new_node) {
            return
          }
          var isdir = FS.isDir(old_node.mode);
          var errCode = FS.mayDelete(old_dir, old_name, isdir);
          if (errCode) {
            throw new FS.ErrnoError(errCode)
          }
          errCode = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
          if (errCode) {
            throw new FS.ErrnoError(errCode)
          }
          if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(63)
          }
          if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(10)
          }
          if (new_dir !== old_dir) {
            errCode = FS.nodePermissions(old_dir, "w");
            if (errCode) {
              throw new FS.ErrnoError(errCode)
            }
          }
          FS.hashRemoveNode(old_node);
          try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
          } catch (e) {
            throw e
          } finally {
            FS.hashAddNode(old_node)
          }
        },
        rmdir: path => {
          var lookup = FS.lookupPath(path, {parent: true});
          var parent = lookup.node;
          var name = PATH.basename(path);
          var node = FS.lookupNode(parent, name);
          var errCode = FS.mayDelete(parent, name, true);
          if (errCode) {
            throw new FS.ErrnoError(errCode)
          }
          if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(63)
          }
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
          }
          parent.node_ops.rmdir(parent, name);
          FS.destroyNode(node)
        },
        readdir: path => {
          var lookup = FS.lookupPath(path, {follow: true});
          var node = lookup.node;
          if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(54)
          }
          return node.node_ops.readdir(node)
        },
        unlink: path => {
          var lookup = FS.lookupPath(path, {parent: true});
          var parent = lookup.node;
          if (!parent) {
            throw new FS.ErrnoError(44)
          }
          var name = PATH.basename(path);
          var node = FS.lookupNode(parent, name);
          var errCode = FS.mayDelete(parent, name, false);
          if (errCode) {
            throw new FS.ErrnoError(errCode)
          }
          if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(63)
          }
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(10)
          }
          parent.node_ops.unlink(parent, name);
          FS.destroyNode(node)
        },
        readlink: path => {
          var lookup = FS.lookupPath(path);
          var link = lookup.node;
          if (!link) {
            throw new FS.ErrnoError(44)
          }
          if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(28)
          }
          return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
        },
        stat: (path, dontFollow) => {
          var lookup = FS.lookupPath(path, {follow: !dontFollow});
          var node = lookup.node;
          if (!node) {
            throw new FS.ErrnoError(44)
          }
          if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(63)
          }
          return node.node_ops.getattr(node)
        },
        lstat: path => {
          return FS.stat(path, true)
        },
        chmod: (path, mode, dontFollow) => {
          var node;
          if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {follow: !dontFollow});
            node = lookup.node
          } else {
            node = path
          }
          if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
          }
          node.node_ops.setattr(node, {mode: mode & 4095 | node.mode & ~4095, timestamp: Date.now()})
        },
        lchmod: (path, mode) => {
          FS.chmod(path, mode, true)
        },
        fchmod: (fd, mode) => {
          var stream = FS.getStream(fd);
          if (!stream) {
            throw new FS.ErrnoError(8)
          }
          FS.chmod(stream.node, mode)
        },
        chown: (path, uid, gid, dontFollow) => {
          var node;
          if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {follow: !dontFollow});
            node = lookup.node
          } else {
            node = path
          }
          if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
          }
          node.node_ops.setattr(node, {timestamp: Date.now()})
        },
        lchown: (path, uid, gid) => {
          FS.chown(path, uid, gid, true)
        },
        fchown: (fd, uid, gid) => {
          var stream = FS.getStream(fd);
          if (!stream) {
            throw new FS.ErrnoError(8)
          }
          FS.chown(stream.node, uid, gid)
        },
        truncate: (path, len) => {
          if (len < 0) {
            throw new FS.ErrnoError(28)
          }
          var node;
          if (typeof path == "string") {
            var lookup = FS.lookupPath(path, {follow: true});
            node = lookup.node
          } else {
            node = path
          }
          if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(63)
          }
          if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(31)
          }
          if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(28)
          }
          var errCode = FS.nodePermissions(node, "w");
          if (errCode) {
            throw new FS.ErrnoError(errCode)
          }
          node.node_ops.setattr(node, {size: len, timestamp: Date.now()})
        },
        ftruncate: (fd, len) => {
          var stream = FS.getStream(fd);
          if (!stream) {
            throw new FS.ErrnoError(8)
          }
          if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(28)
          }
          FS.truncate(stream.node, len)
        },
        utime: (path, atime, mtime) => {
          var lookup = FS.lookupPath(path, {follow: true});
          var node = lookup.node;
          node.node_ops.setattr(node, {timestamp: Math.max(atime, mtime)})
        },
        open: (path, flags, mode) => {
          if (path === "") {
            throw new FS.ErrnoError(44)
          }
          flags = typeof flags == "string" ? FS.modeStringToFlags(flags) : flags;
          mode = typeof mode == "undefined" ? 438 : mode;
          if (flags & 64) {
            mode = mode & 4095 | 32768
          } else {
            mode = 0
          }
          var node;
          if (typeof path == "object") {
            node = path
          } else {
            path = PATH.normalize(path);
            try {
              var lookup = FS.lookupPath(path, {follow: !(flags & 131072)});
              node = lookup.node
            } catch (e) {
            }
          }
          var created = false;
          if (flags & 64) {
            if (node) {
              if (flags & 128) {
                throw new FS.ErrnoError(20)
              }
            } else {
              node = FS.mknod(path, mode, 0);
              created = true
            }
          }
          if (!node) {
            throw new FS.ErrnoError(44)
          }
          if (FS.isChrdev(node.mode)) {
            flags &= ~512
          }
          if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(54)
          }
          if (!created) {
            var errCode = FS.mayOpen(node, flags);
            if (errCode) {
              throw new FS.ErrnoError(errCode)
            }
          }
          if (flags & 512 && !created) {
            FS.truncate(node, 0)
          }
          flags &= ~(128 | 512 | 131072);
          var stream = FS.createStream({
            node: node,
            path: FS.getPath(node),
            flags: flags,
            seekable: true,
            position: 0,
            stream_ops: node.stream_ops,
            ungotten: [],
            error: false
          });
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
          }
          if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (!(path in FS.readFiles)) {
              FS.readFiles[path] = 1
            }
          }
          return stream
        },
        close: stream => {
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
          }
          if (stream.getdents) stream.getdents = null;
          try {
            if (stream.stream_ops.close) {
              stream.stream_ops.close(stream)
            }
          } catch (e) {
            throw e
          } finally {
            FS.closeStream(stream.fd)
          }
          stream.fd = null
        },
        isClosed: stream => {
          return stream.fd === null
        },
        llseek: (stream, offset, whence) => {
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
          }
          if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(70)
          }
          if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(28)
          }
          stream.position = stream.stream_ops.llseek(stream, offset, whence);
          stream.ungotten = [];
          return stream.position
        },
        read: (stream, buffer, offset, length, position) => {
          if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
          }
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
          }
          if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(8)
          }
          if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
          }
          if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(28)
          }
          var seeking = typeof position != "undefined";
          if (!seeking) {
            position = stream.position
          } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
          }
          var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
          if (!seeking) stream.position += bytesRead;
          return bytesRead
        },
        write: (stream, buffer, offset, length, position, canOwn) => {
          if (length < 0 || position < 0) {
            throw new FS.ErrnoError(28)
          }
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
          }
          if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
          }
          if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(31)
          }
          if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(28)
          }
          if (stream.seekable && stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
          }
          var seeking = typeof position != "undefined";
          if (!seeking) {
            position = stream.position
          } else if (!stream.seekable) {
            throw new FS.ErrnoError(70)
          }
          var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
          if (!seeking) stream.position += bytesWritten;
          return bytesWritten
        },
        allocate: (stream, offset, length) => {
          if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(8)
          }
          if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(28)
          }
          if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(8)
          }
          if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(43)
          }
          if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(138)
          }
          stream.stream_ops.allocate(stream, offset, length)
        },
        mmap: (stream, length, position, prot, flags) => {
          if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(2)
          }
          if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(2)
          }
          if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(43)
          }
          return stream.stream_ops.mmap(stream, length, position, prot, flags)
        },
        msync: (stream, buffer, offset, length, mmapFlags) => {
          if (!stream.stream_ops.msync) {
            return 0
          }
          return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
        },
        munmap: stream => 0,
        ioctl: (stream, cmd, arg) => {
          if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(59)
          }
          return stream.stream_ops.ioctl(stream, cmd, arg)
        },
        readFile: (path, opts = {}) => {
          opts.flags = opts.flags || 0;
          opts.encoding = opts.encoding || "binary";
          if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
          }
          var ret;
          var stream = FS.open(path, opts.flags);
          var stat = FS.stat(path);
          var length = stat.size;
          var buf = new Uint8Array(length);
          FS.read(stream, buf, 0, length, 0);
          if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
          } else if (opts.encoding === "binary") {
            ret = buf
          }
          FS.close(stream);
          return ret
        },
        writeFile: (path, data, opts = {}) => {
          opts.flags = opts.flags || 577;
          var stream = FS.open(path, opts.flags, opts.mode);
          if (typeof data == "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
          } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
          } else {
            throw new Error("Unsupported data type")
          }
          FS.close(stream)
        },
        cwd: () => FS.currentPath,
        chdir: path => {
          var lookup = FS.lookupPath(path, {follow: true});
          if (lookup.node === null) {
            throw new FS.ErrnoError(44)
          }
          if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(54)
          }
          var errCode = FS.nodePermissions(lookup.node, "x");
          if (errCode) {
            throw new FS.ErrnoError(errCode)
          }
          FS.currentPath = lookup.path
        },
        createDefaultDirectories: () => {
          FS.mkdir("/tmp");
          FS.mkdir("/home");
          FS.mkdir("/home/web_user")
        },
        createDefaultDevices: () => {
          FS.mkdir("/dev");
          FS.registerDevice(FS.makedev(1, 3), {read: () => 0, write: (stream, buffer, offset, length, pos) => length});
          FS.mkdev("/dev/null", FS.makedev(1, 3));
          TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
          TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
          FS.mkdev("/dev/tty", FS.makedev(5, 0));
          FS.mkdev("/dev/tty1", FS.makedev(6, 0));
          var random_device = getRandomDevice();
          FS.createDevice("/dev", "random", random_device);
          FS.createDevice("/dev", "urandom", random_device);
          FS.mkdir("/dev/shm");
          FS.mkdir("/dev/shm/tmp")
        },
        createSpecialDirectories: () => {
          FS.mkdir("/proc");
          var proc_self = FS.mkdir("/proc/self");
          FS.mkdir("/proc/self/fd");
          FS.mount({
            mount: () => {
              var node = FS.createNode(proc_self, "fd", 16384 | 511, 73);
              node.node_ops = {
                lookup: (parent, name) => {
                  var fd = +name;
                  var stream = FS.getStream(fd);
                  if (!stream) throw new FS.ErrnoError(8);
                  var ret = {parent: null, mount: {mountpoint: "fake"}, node_ops: {readlink: () => stream.path}};
                  ret.parent = ret;
                  return ret
                }
              };
              return node
            }
          }, {}, "/proc/self/fd")
        },
        createStandardStreams: () => {
          if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
          } else {
            FS.symlink("/dev/tty", "/dev/stdin")
          }
          if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
          } else {
            FS.symlink("/dev/tty", "/dev/stdout")
          }
          if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
          } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
          }
          var stdin = FS.open("/dev/stdin", 0);
          var stdout = FS.open("/dev/stdout", 1);
          var stderr = FS.open("/dev/stderr", 1)
        },
        ensureErrnoError: () => {
          if (FS.ErrnoError) return;
          FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function (errno) {
              this.errno = errno
            };
            this.setErrno(errno);
            this.message = "FS error"
          };
          FS.ErrnoError.prototype = new Error;
          FS.ErrnoError.prototype.constructor = FS.ErrnoError;
          [44].forEach(code => {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
          })
        },
        staticInit: () => {
          FS.ensureErrnoError();
          FS.nameTable = new Array(4096);
          FS.mount(MEMFS, {}, "/");
          FS.createDefaultDirectories();
          FS.createDefaultDevices();
          FS.createSpecialDirectories();
          FS.filesystems = {"MEMFS": MEMFS}
        },
        init: (input, output, error) => {
          FS.init.initialized = true;
          FS.ensureErrnoError();
          Module["stdin"] = input || Module["stdin"];
          Module["stdout"] = output || Module["stdout"];
          Module["stderr"] = error || Module["stderr"];
          FS.createStandardStreams()
        },
        quit: () => {
          FS.init.initialized = false;
          for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
              continue
            }
            FS.close(stream)
          }
        },
        getMode: (canRead, canWrite) => {
          var mode = 0;
          if (canRead) mode |= 292 | 73;
          if (canWrite) mode |= 146;
          return mode
        },
        findObject: (path, dontResolveLastLink) => {
          var ret = FS.analyzePath(path, dontResolveLastLink);
          if (!ret.exists) {
            return null
          }
          return ret.object
        },
        analyzePath: (path, dontResolveLastLink) => {
          try {
            var lookup = FS.lookupPath(path, {follow: !dontResolveLastLink});
            path = lookup.path
          } catch (e) {
          }
          var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
          };
          try {
            var lookup = FS.lookupPath(path, {parent: true});
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {follow: !dontResolveLastLink});
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
          } catch (e) {
            ret.error = e.errno
          }
          return ret
        },
        createPath: (parent, path, canRead, canWrite) => {
          parent = typeof parent == "string" ? parent : FS.getPath(parent);
          var parts = path.split("/").reverse();
          while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
              FS.mkdir(current)
            } catch (e) {
            }
            parent = current
          }
          return current
        },
        createFile: (parent, name, properties, canRead, canWrite) => {
          var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
          var mode = FS.getMode(canRead, canWrite);
          return FS.create(path, mode)
        },
        createDataFile: (parent, name, data, canRead, canWrite, canOwn) => {
          var path = name;
          if (parent) {
            parent = typeof parent == "string" ? parent : FS.getPath(parent);
            path = name ? PATH.join2(parent, name) : parent
          }
          var mode = FS.getMode(canRead, canWrite);
          var node = FS.create(path, mode);
          if (data) {
            if (typeof data == "string") {
              var arr = new Array(data.length);
              for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
              data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, 577);
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
          }
          return node
        },
        createDevice: (parent, name, input, output) => {
          var path = PATH.join2(typeof parent == "string" ? parent : FS.getPath(parent), name);
          var mode = FS.getMode(!!input, !!output);
          if (!FS.createDevice.major) FS.createDevice.major = 64;
          var dev = FS.makedev(FS.createDevice.major++, 0);
          FS.registerDevice(dev, {
            open: stream => {
              stream.seekable = false
            }, close: stream => {
              if (output && output.buffer && output.buffer.length) {
                output(10)
              }
            }, read: (stream, buffer, offset, length, pos) => {
              var bytesRead = 0;
              for (var i = 0; i < length; i++) {
                var result;
                try {
                  result = input()
                } catch (e) {
                  throw new FS.ErrnoError(29)
                }
                if (result === undefined && bytesRead === 0) {
                  throw new FS.ErrnoError(6)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
              }
              if (bytesRead) {
                stream.node.timestamp = Date.now()
              }
              return bytesRead
            }, write: (stream, buffer, offset, length, pos) => {
              for (var i = 0; i < length; i++) {
                try {
                  output(buffer[offset + i])
                } catch (e) {
                  throw new FS.ErrnoError(29)
                }
              }
              if (length) {
                stream.node.timestamp = Date.now()
              }
              return i
            }
          });
          return FS.mkdev(path, mode, dev)
        },
        forceLoadFile: obj => {
          if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
          if (typeof XMLHttpRequest != "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
          } else if (read_) {
            try {
              obj.contents = intArrayFromString(read_(obj.url), true);
              obj.usedBytes = obj.contents.length
            } catch (e) {
              throw new FS.ErrnoError(29)
            }
          } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
          }
        },
        createLazyFile: (parent, name, url, canRead, canWrite) => {
          function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
          }

          LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
              return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
          };
          LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
          };
          LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = (from, to) => {
              if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
              if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
              var xhr = new XMLHttpRequest;
              xhr.open("GET", url, false);
              if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
              xhr.responseType = "arraybuffer";
              if (xhr.overrideMimeType) {
                xhr.overrideMimeType("text/plain; charset=x-user-defined")
              }
              xhr.send(null);
              if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
              if (xhr.response !== undefined) {
                return new Uint8Array(xhr.response || [])
              }
              return intArrayFromString(xhr.responseText || "", true)
            };
            var lazyArray = this;
            lazyArray.setDataGetter(chunkNum => {
              var start = chunkNum * chunkSize;
              var end = (chunkNum + 1) * chunkSize - 1;
              end = Math.min(end, datalength - 1);
              if (typeof lazyArray.chunks[chunkNum] == "undefined") {
                lazyArray.chunks[chunkNum] = doXHR(start, end)
              }
              if (typeof lazyArray.chunks[chunkNum] == "undefined") throw new Error("doXHR failed!");
              return lazyArray.chunks[chunkNum]
            });
            if (usesGzip || !datalength) {
              chunkSize = datalength = 1;
              datalength = this.getter(0).length;
              chunkSize = datalength;
              out("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
          };
          if (typeof XMLHttpRequest != "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw"Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
              length: {
                get: function () {
                  if (!this.lengthKnown) {
                    this.cacheLength()
                  }
                  return this._length
                }
              }, chunkSize: {
                get: function () {
                  if (!this.lengthKnown) {
                    this.cacheLength()
                  }
                  return this._chunkSize
                }
              }
            });
            var properties = {isDevice: false, contents: lazyArray}
          } else {
            var properties = {isDevice: false, url: url}
          }
          var node = FS.createFile(parent, name, properties, canRead, canWrite);
          if (properties.contents) {
            node.contents = properties.contents
          } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
          }
          Object.defineProperties(node, {
            usedBytes: {
              get: function () {
                return this.contents.length
              }
            }
          });
          var stream_ops = {};
          var keys = Object.keys(node.stream_ops);
          keys.forEach(key => {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
              FS.forceLoadFile(node);
              return fn.apply(null, arguments)
            }
          });

          function writeChunks(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
              for (var i = 0; i < size; i++) {
                buffer[offset + i] = contents[position + i]
              }
            } else {
              for (var i = 0; i < size; i++) {
                buffer[offset + i] = contents.get(position + i)
              }
            }
            return size
          }

          stream_ops.read = (stream, buffer, offset, length, position) => {
            FS.forceLoadFile(node);
            return writeChunks(stream, buffer, offset, length, position)
          };
          stream_ops.mmap = (stream, length, position, prot, flags) => {
            FS.forceLoadFile(node);
            var ptr = mmapAlloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(48)
            }
            writeChunks(stream, HEAP8, ptr, length, position);
            return {ptr: ptr, allocated: true}
          };
          node.stream_ops = stream_ops;
          return node
        },
        createPreloadedFile: (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) => {
          var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
          var dep = getUniqueRunDependency("cp " + fullname);

          function processData(byteArray) {
            function finish(byteArray) {
              if (preFinish) preFinish();
              if (!dontCreateFile) {
                FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
              }
              if (onload) onload();
              removeRunDependency(dep)
            }

            if (Browser.handledByPreloadPlugin(byteArray, fullname, finish, () => {
              if (onerror) onerror();
              removeRunDependency(dep)
            })) {
              return
            }
            finish(byteArray)
          }

          addRunDependency(dep);
          if (typeof url == "string") {
            asyncLoad(url, byteArray => processData(byteArray), onerror)
          } else {
            processData(url)
          }
        },
        indexedDB: () => {
          return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
        },
        DB_NAME: () => {
          return "EM_FS_" + window.location.pathname
        },
        DB_VERSION: 20,
        DB_STORE_NAME: "FILE_DATA",
        saveFilesToDB: (paths, onload, onerror) => {
          onload = onload || (() => {
          });
          onerror = onerror || (() => {
          });
          var indexedDB = FS.indexedDB();
          try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
          } catch (e) {
            return onerror(e)
          }
          openRequest.onupgradeneeded = () => {
            out("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
          };
          openRequest.onsuccess = () => {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0, fail = 0, total = paths.length;

            function finish() {
              if (fail == 0) onload(); else onerror()
            }

            paths.forEach(path => {
              var putRequest = files.put(FS.analyzePath(path).object.contents, path);
              putRequest.onsuccess = () => {
                ok++;
                if (ok + fail == total) finish()
              };
              putRequest.onerror = () => {
                fail++;
                if (ok + fail == total) finish()
              }
            });
            transaction.onerror = onerror
          };
          openRequest.onerror = onerror
        },
        loadFilesFromDB: (paths, onload, onerror) => {
          onload = onload || (() => {
          });
          onerror = onerror || (() => {
          });
          var indexedDB = FS.indexedDB();
          try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
          } catch (e) {
            return onerror(e)
          }
          openRequest.onupgradeneeded = onerror;
          openRequest.onsuccess = () => {
            var db = openRequest.result;
            try {
              var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch (e) {
              onerror(e);
              return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0, fail = 0, total = paths.length;

            function finish() {
              if (fail == 0) onload(); else onerror()
            }

            paths.forEach(path => {
              var getRequest = files.get(path);
              getRequest.onsuccess = () => {
                if (FS.analyzePath(path).exists) {
                  FS.unlink(path)
                }
                FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                ok++;
                if (ok + fail == total) finish()
              };
              getRequest.onerror = () => {
                fail++;
                if (ok + fail == total) finish()
              }
            });
            transaction.onerror = onerror
          };
          openRequest.onerror = onerror
        }
      };
      var SYSCALLS = {
        DEFAULT_POLLMASK: 5, calculateAt: function (dirfd, path, allowEmpty) {
          if (PATH.isAbs(path)) {
            return path
          }
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd()
          } else {
            var dirstream = SYSCALLS.getStreamFromFD(dirfd);
            dir = dirstream.path
          }
          if (path.length == 0) {
            if (!allowEmpty) {
              throw new FS.ErrnoError(44)
            }
            return dir
          }
          return PATH.join2(dir, path)
        }, doStat: function (func, path, buf) {
          try {
            var stat = func(path)
          } catch (e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
              return -54
            }
            throw e
          }
          HEAP32[buf >> 2] = stat.dev;
          HEAP32[buf + 8 >> 2] = stat.ino;
          HEAP32[buf + 12 >> 2] = stat.mode;
          HEAPU32[buf + 16 >> 2] = stat.nlink;
          HEAP32[buf + 20 >> 2] = stat.uid;
          HEAP32[buf + 24 >> 2] = stat.gid;
          HEAP32[buf + 28 >> 2] = stat.rdev;
          tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
          HEAP32[buf + 48 >> 2] = 4096;
          HEAP32[buf + 52 >> 2] = stat.blocks;
          tempI64 = [Math.floor(stat.atime.getTime() / 1e3) >>> 0, (tempDouble = Math.floor(stat.atime.getTime() / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 56 >> 2] = tempI64[0], HEAP32[buf + 60 >> 2] = tempI64[1];
          HEAPU32[buf + 64 >> 2] = 0;
          tempI64 = [Math.floor(stat.mtime.getTime() / 1e3) >>> 0, (tempDouble = Math.floor(stat.mtime.getTime() / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 72 >> 2] = tempI64[0], HEAP32[buf + 76 >> 2] = tempI64[1];
          HEAPU32[buf + 80 >> 2] = 0;
          tempI64 = [Math.floor(stat.ctime.getTime() / 1e3) >>> 0, (tempDouble = Math.floor(stat.ctime.getTime() / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 88 >> 2] = tempI64[0], HEAP32[buf + 92 >> 2] = tempI64[1];
          HEAPU32[buf + 96 >> 2] = 0;
          tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 104 >> 2] = tempI64[0], HEAP32[buf + 108 >> 2] = tempI64[1];
          return 0
        }, doMsync: function (addr, stream, len, flags, offset) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(43)
          }
          if (flags & 2) {
            return 0
          }
          var buffer = HEAPU8.slice(addr, addr + len);
          FS.msync(stream, buffer, offset, len, flags)
        }, varargs: undefined, get: function () {
          SYSCALLS.varargs += 4;
          var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
          return ret
        }, getStr: function (ptr) {
          var ret = UTF8ToString(ptr);
          return ret
        }, getStreamFromFD: function (fd) {
          var stream = FS.getStream(fd);
          if (!stream) throw new FS.ErrnoError(8);
          return stream
        }
      };

      function _environ_get(__environ, environ_buf) {
        var bufSize = 0;
        getEnvStrings().forEach(function (string, i) {
          var ptr = environ_buf + bufSize;
          HEAPU32[__environ + i * 4 >> 2] = ptr;
          writeAsciiToMemory(string, ptr);
          bufSize += string.length + 1
        });
        return 0
      }

      function _environ_sizes_get(penviron_count, penviron_buf_size) {
        var strings = getEnvStrings();
        HEAPU32[penviron_count >> 2] = strings.length;
        var bufSize = 0;
        strings.forEach(function (string) {
          bufSize += string.length + 1
        });
        HEAPU32[penviron_buf_size >> 2] = bufSize;
        return 0
      }

      function _fd_close(fd) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          FS.close(stream);
          return 0
        } catch (e) {
          if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
          return e.errno
        }
      }

      function doReadv(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAPU32[iov >> 2];
          var len = HEAPU32[iov + 4 >> 2];
          iov += 8;
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break
        }
        return ret
      }

      function _fd_read(fd, iov, iovcnt, pnum) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          var num = doReadv(stream, iov, iovcnt);
          HEAPU32[pnum >> 2] = num;
          return 0
        } catch (e) {
          if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
          return e.errno
        }
      }

      function convertI32PairToI53Checked(lo, hi) {
        return hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN
      }

      function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
        try {
          var offset = convertI32PairToI53Checked(offset_low, offset_high);
          if (isNaN(offset)) return 61;
          var stream = SYSCALLS.getStreamFromFD(fd);
          FS.llseek(stream, offset, whence);
          tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
          if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
          return 0
        } catch (e) {
          if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
          return e.errno
        }
      }

      function doWritev(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAPU32[iov >> 2];
          var len = HEAPU32[iov + 4 >> 2];
          iov += 8;
          var curr = FS.write(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr
        }
        return ret
      }

      function _fd_write(fd, iov, iovcnt, pnum) {
        try {
          var stream = SYSCALLS.getStreamFromFD(fd);
          var num = doWritev(stream, iov, iovcnt);
          HEAPU32[pnum >> 2] = num;
          return 0
        } catch (e) {
          if (typeof FS == "undefined" || !(e instanceof FS.ErrnoError)) throw e;
          return e.errno
        }
      }

      function _llvm_eh_typeid_for(type) {
        return type
      }

      function __isLeapYear(year) {
        return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
      }

      function __arraySum(array, index) {
        var sum = 0;
        for (var i = 0; i <= index; sum += array[i++]) {
        }
        return sum
      }

      var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
      var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

      function __addDays(date, days) {
        var newDate = new Date(date.getTime());
        while (days > 0) {
          var leap = __isLeapYear(newDate.getFullYear());
          var currentMonth = newDate.getMonth();
          var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR)[currentMonth];
          if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
              newDate.setMonth(currentMonth + 1)
            } else {
              newDate.setMonth(0);
              newDate.setFullYear(newDate.getFullYear() + 1)
            }
          } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate
          }
        }
        return newDate
      }

      function writeArrayToMemory(array, buffer) {
        HEAP8.set(array, buffer)
      }

      function _strftime(s, maxsize, format, tm) {
        var tm_zone = HEAP32[tm + 40 >> 2];
        var date = {
          tm_sec: HEAP32[tm >> 2],
          tm_min: HEAP32[tm + 4 >> 2],
          tm_hour: HEAP32[tm + 8 >> 2],
          tm_mday: HEAP32[tm + 12 >> 2],
          tm_mon: HEAP32[tm + 16 >> 2],
          tm_year: HEAP32[tm + 20 >> 2],
          tm_wday: HEAP32[tm + 24 >> 2],
          tm_yday: HEAP32[tm + 28 >> 2],
          tm_isdst: HEAP32[tm + 32 >> 2],
          tm_gmtoff: HEAP32[tm + 36 >> 2],
          tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
        };
        var pattern = UTF8ToString(format);
        var EXPANSION_RULES_1 = {
          "%c": "%a %b %d %H:%M:%S %Y",
          "%D": "%m/%d/%y",
          "%F": "%Y-%m-%d",
          "%h": "%b",
          "%r": "%I:%M:%S %p",
          "%R": "%H:%M",
          "%T": "%H:%M:%S",
          "%x": "%m/%d/%y",
          "%X": "%H:%M:%S",
          "%Ec": "%c",
          "%EC": "%C",
          "%Ex": "%m/%d/%y",
          "%EX": "%H:%M:%S",
          "%Ey": "%y",
          "%EY": "%Y",
          "%Od": "%d",
          "%Oe": "%e",
          "%OH": "%H",
          "%OI": "%I",
          "%Om": "%m",
          "%OM": "%M",
          "%OS": "%S",
          "%Ou": "%u",
          "%OU": "%U",
          "%OV": "%V",
          "%Ow": "%w",
          "%OW": "%W",
          "%Oy": "%y"
        };
        for (var rule in EXPANSION_RULES_1) {
          pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
        }
        var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

        function leadingSomething(value, digits, character) {
          var str = typeof value == "number" ? value.toString() : value || "";
          while (str.length < digits) {
            str = character[0] + str
          }
          return str
        }

        function leadingNulls(value, digits) {
          return leadingSomething(value, digits, "0")
        }

        function compareByDay(date1, date2) {
          function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0
          }

          var compare;
          if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
              compare = sgn(date1.getDate() - date2.getDate())
            }
          }
          return compare
        }

        function getFirstWeekStartDate(janFourth) {
          switch (janFourth.getDay()) {
            case 0:
              return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
              return janFourth;
            case 2:
              return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
              return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
              return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
              return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
              return new Date(janFourth.getFullYear() - 1, 11, 30)
          }
        }

        function getWeekBasedYear(date) {
          var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
          var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
          var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
          var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
          var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
          if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
              return thisDate.getFullYear() + 1
            }
            return thisDate.getFullYear()
          }
          return thisDate.getFullYear() - 1
        }

        var EXPANSION_RULES_2 = {
          "%a": function (date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3)
          }, "%A": function (date) {
            return WEEKDAYS[date.tm_wday]
          }, "%b": function (date) {
            return MONTHS[date.tm_mon].substring(0, 3)
          }, "%B": function (date) {
            return MONTHS[date.tm_mon]
          }, "%C": function (date) {
            var year = date.tm_year + 1900;
            return leadingNulls(year / 100 | 0, 2)
          }, "%d": function (date) {
            return leadingNulls(date.tm_mday, 2)
          }, "%e": function (date) {
            return leadingSomething(date.tm_mday, 2, " ")
          }, "%g": function (date) {
            return getWeekBasedYear(date).toString().substring(2)
          }, "%G": function (date) {
            return getWeekBasedYear(date)
          }, "%H": function (date) {
            return leadingNulls(date.tm_hour, 2)
          }, "%I": function (date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0) twelveHour = 12; else if (twelveHour > 12) twelveHour -= 12;
            return leadingNulls(twelveHour, 2)
          }, "%j": function (date) {
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP : __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
          }, "%m": function (date) {
            return leadingNulls(date.tm_mon + 1, 2)
          }, "%M": function (date) {
            return leadingNulls(date.tm_min, 2)
          }, "%n": function () {
            return "\n"
          }, "%p": function (date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
              return "AM"
            }
            return "PM"
          }, "%S": function (date) {
            return leadingNulls(date.tm_sec, 2)
          }, "%t": function () {
            return "\t"
          }, "%u": function (date) {
            return date.tm_wday || 7
          }, "%U": function (date) {
            var days = date.tm_yday + 7 - date.tm_wday;
            return leadingNulls(Math.floor(days / 7), 2)
          }, "%V": function (date) {
            var val = Math.floor((date.tm_yday + 7 - (date.tm_wday + 6) % 7) / 7);
            if ((date.tm_wday + 371 - date.tm_yday - 2) % 7 <= 2) {
              val++
            }
            if (!val) {
              val = 52;
              var dec31 = (date.tm_wday + 7 - date.tm_yday - 1) % 7;
              if (dec31 == 4 || dec31 == 5 && __isLeapYear(date.tm_year % 400 - 1)) {
                val++
              }
            } else if (val == 53) {
              var jan1 = (date.tm_wday + 371 - date.tm_yday) % 7;
              if (jan1 != 4 && (jan1 != 3 || !__isLeapYear(date.tm_year))) val = 1
            }
            return leadingNulls(val, 2)
          }, "%w": function (date) {
            return date.tm_wday
          }, "%W": function (date) {
            var days = date.tm_yday + 7 - (date.tm_wday + 6) % 7;
            return leadingNulls(Math.floor(days / 7), 2)
          }, "%y": function (date) {
            return (date.tm_year + 1900).toString().substring(2)
          }, "%Y": function (date) {
            return date.tm_year + 1900
          }, "%z": function (date) {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = off / 60 * 100 + off % 60;
            return (ahead ? "+" : "-") + String("0000" + off).slice(-4)
          }, "%Z": function (date) {
            return date.tm_zone
          }, "%%": function () {
            return "%"
          }
        };
        pattern = pattern.replace(/%%/g, "\0\0");
        for (var rule in EXPANSION_RULES_2) {
          if (pattern.includes(rule)) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
          }
        }
        pattern = pattern.replace(/\0\0/g, "%");
        var bytes = intArrayFromString(pattern, false);
        if (bytes.length > maxsize) {
          return 0
        }
        writeArrayToMemory(bytes, s);
        return bytes.length - 1
      }

      function _strftime_l(s, maxsize, format, tm, loc) {
        return _strftime(s, maxsize, format, tm)
      }

      var FSNode = function (parent, name, mode, rdev) {
        if (!parent) {
          parent = this
        }
        this.parent = parent;
        this.mount = parent.mount;
        this.mounted = null;
        this.id = FS.nextInode++;
        this.name = name;
        this.mode = mode;
        this.node_ops = {};
        this.stream_ops = {};
        this.rdev = rdev
      };
      var readMode = 292 | 73;
      var writeMode = 146;
      Object.defineProperties(FSNode.prototype, {
        read: {
          get: function () {
            return (this.mode & readMode) === readMode
          }, set: function (val) {
            val ? this.mode |= readMode : this.mode &= ~readMode
          }
        }, write: {
          get: function () {
            return (this.mode & writeMode) === writeMode
          }, set: function (val) {
            val ? this.mode |= writeMode : this.mode &= ~writeMode
          }
        }, isFolder: {
          get: function () {
            return FS.isDir(this.mode)
          }
        }, isDevice: {
          get: function () {
            return FS.isChrdev(this.mode)
          }
        }
      });
      FS.FSNode = FSNode;
      FS.staticInit();
      var ASSERTIONS = false;
      var decodeBase64 = typeof atob == "function" ? atob : function (input) {
        var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
        var output = "";
        var chr1, chr2, chr3;
        var enc1, enc2, enc3, enc4;
        var i = 0;
        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
        do {
          enc1 = keyStr.indexOf(input.charAt(i++));
          enc2 = keyStr.indexOf(input.charAt(i++));
          enc3 = keyStr.indexOf(input.charAt(i++));
          enc4 = keyStr.indexOf(input.charAt(i++));
          chr1 = enc1 << 2 | enc2 >> 4;
          chr2 = (enc2 & 15) << 4 | enc3 >> 2;
          chr3 = (enc3 & 3) << 6 | enc4;
          output = output + String.fromCharCode(chr1);
          if (enc3 !== 64) {
            output = output + String.fromCharCode(chr2)
          }
          if (enc4 !== 64) {
            output = output + String.fromCharCode(chr3)
          }
        } while (i < input.length);
        return output
      };

      function intArrayFromBase64(s) {
        if (typeof ENVIRONMENT_IS_NODE == "boolean" && ENVIRONMENT_IS_NODE) {
          var buf = Buffer.from(s, "base64");
          return new Uint8Array(buf["buffer"], buf["byteOffset"], buf["byteLength"])
        }
        try {
          var decoded = decodeBase64(s);
          var bytes = new Uint8Array(decoded.length);
          for (var i = 0; i < decoded.length; ++i) {
            bytes[i] = decoded.charCodeAt(i)
          }
          return bytes
        } catch (_) {
          throw new Error("Converting base64 string to bytes failed.")
        }
      }

      function tryParseAsDataURI(filename) {
        if (!isDataURI(filename)) {
          return
        }
        return intArrayFromBase64(filename.slice(dataURIPrefix.length))
      }

      var asmLibraryArg = {
        "p": ___assert_fail,
        "n": ___cxa_allocate_exception,
        "l": ___cxa_begin_catch,
        "m": ___cxa_end_catch,
        "ga": ___cxa_find_matching_catch_17,
        "a": ___cxa_find_matching_catch_2,
        "i": ___cxa_find_matching_catch_3,
        "w": ___cxa_find_matching_catch_4,
        "fa": ___cxa_find_matching_catch_6,
        "o": ___cxa_free_exception,
        "K": ___cxa_rethrow,
        "v": ___cxa_throw,
        "qa": ___cxa_uncaught_exceptions,
        "f": ___resumeException,
        "T": __emscripten_get_now_is_monotonic,
        "J": _abort,
        "X": _emscripten_date_now,
        "ra": _emscripten_resize_heap,
        "na": _environ_get,
        "oa": _environ_sizes_get,
        "S": _fd_close,
        "pa": _fd_read,
        "ca": _fd_seek,
        "sa": _fd_write,
        "B": invoke_di,
        "ha": invoke_did,
        "N": invoke_didi,
        "F": invoke_dii,
        "L": invoke_diii,
        "M": invoke_diiii,
        "Q": invoke_fi,
        "ka": invoke_fii,
        "t": invoke_i,
        "d": invoke_ii,
        "la": invoke_iid,
        "ia": invoke_iifi,
        "b": invoke_iii,
        "O": invoke_iiifii,
        "h": invoke_iiii,
        "ea": invoke_iiiidd,
        "q": invoke_iiiii,
        "da": invoke_iiiiid,
        "x": invoke_iiiiii,
        "y": invoke_iiiiiii,
        "H": invoke_iiiiiiii,
        "E": invoke_iiiiiiiiiiii,
        "U": invoke_iiij,
        "ba": invoke_iiji,
        "Y": invoke_ijiij,
        "V": invoke_j,
        "_": invoke_jiiii,
        "j": invoke_v,
        "k": invoke_vi,
        "C": invoke_vid,
        "c": invoke_vii,
        "G": invoke_viid,
        "P": invoke_viif,
        "e": invoke_viii,
        "ja": invoke_viiidi,
        "g": invoke_viiii,
        "r": invoke_viiiii,
        "z": invoke_viiiiii,
        "u": invoke_viiiiiii,
        "I": invoke_viiiiiiii,
        "R": invoke_viiiiiiiii,
        "A": invoke_viiiiiiiiii,
        "D": invoke_viiiiiiiiiiiiiii,
        "$": invoke_viij,
        "Z": invoke_viiji,
        "aa": invoke_vij,
        "W": invoke_viji,
        "s": _llvm_eh_typeid_for,
        "ma": _strftime_l
      };
      var asm = createWasm();
      var ___wasm_call_ctors = Module["___wasm_call_ctors"] = asm["ua"];
      var _openmpt_get_library_version = Module["_openmpt_get_library_version"] = asm["va"];
      var __ZN7openmpt19get_library_versionEv = Module["__ZN7openmpt19get_library_versionEv"] = asm["wa"];
      var _openmpt_get_core_version = Module["_openmpt_get_core_version"] = asm["xa"];
      var __ZN7openmpt16get_core_versionEv = Module["__ZN7openmpt16get_core_versionEv"] = asm["ya"];
      var _openmpt_free_string = Module["_openmpt_free_string"] = asm["za"];
      var _free = Module["_free"] = asm["Aa"];
      var _openmpt_get_string = Module["_openmpt_get_string"] = asm["Ba"];
      var __ZN7openmpt6string3getERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module["__ZN7openmpt6string3getERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE"] = asm["Ca"];
      var _openmpt_get_supported_extensions = Module["_openmpt_get_supported_extensions"] = asm["Da"];
      var _openmpt_is_extension_supported = Module["_openmpt_is_extension_supported"] = asm["Ea"];
      var _openmpt_log_func_default = Module["_openmpt_log_func_default"] = asm["Fa"];
      var _openmpt_log_func_silent = Module["_openmpt_log_func_silent"] = asm["Ga"];
      var _openmpt_error_is_transient = Module["_openmpt_error_is_transient"] = asm["Ha"];
      var _openmpt_error_string = Module["_openmpt_error_string"] = asm["Ia"];
      var _openmpt_error_func_default = Module["_openmpt_error_func_default"] = asm["Ja"];
      var _openmpt_error_func_log = Module["_openmpt_error_func_log"] = asm["Ka"];
      var _openmpt_error_func_store = Module["_openmpt_error_func_store"] = asm["La"];
      var _openmpt_error_func_ignore = Module["_openmpt_error_func_ignore"] = asm["Ma"];
      var _openmpt_error_func_errno = Module["_openmpt_error_func_errno"] = asm["Na"];
      var _openmpt_error_func_errno_userdata = Module["_openmpt_error_func_errno_userdata"] = asm["Oa"];
      var _openmpt_could_open_probability = Module["_openmpt_could_open_probability"] = asm["Pa"];
      var _openmpt_could_open_probability2 = Module["_openmpt_could_open_probability2"] = asm["Qa"];
      var _openmpt_could_open_propability = Module["_openmpt_could_open_propability"] = asm["Ra"];
      var _openmpt_probe_file_header_get_recommended_size = Module["_openmpt_probe_file_header_get_recommended_size"] = asm["Sa"];
      var _openmpt_probe_file_header = Module["_openmpt_probe_file_header"] = asm["Ta"];
      var _openmpt_probe_file_header_without_filesize = Module["_openmpt_probe_file_header_without_filesize"] = asm["Ua"];
      var _openmpt_probe_file_header_from_stream = Module["_openmpt_probe_file_header_from_stream"] = asm["Va"];
      var _openmpt_module_create = Module["_openmpt_module_create"] = asm["Wa"];
      var _openmpt_module_create2 = Module["_openmpt_module_create2"] = asm["Xa"];
      var _openmpt_module_create_from_memory = Module["_openmpt_module_create_from_memory"] = asm["Ya"];
      var _openmpt_module_create_from_memory2 = Module["_openmpt_module_create_from_memory2"] = asm["Za"];
      var _openmpt_module_destroy = Module["_openmpt_module_destroy"] = asm["_a"];
      var _openmpt_module_set_log_func = Module["_openmpt_module_set_log_func"] = asm["$a"];
      var _openmpt_module_set_error_func = Module["_openmpt_module_set_error_func"] = asm["ab"];
      var _openmpt_module_error_get_last = Module["_openmpt_module_error_get_last"] = asm["bb"];
      var _openmpt_module_error_get_last_message = Module["_openmpt_module_error_get_last_message"] = asm["cb"];
      var _openmpt_module_error_set_last = Module["_openmpt_module_error_set_last"] = asm["db"];
      var _openmpt_module_error_clear = Module["_openmpt_module_error_clear"] = asm["eb"];
      var _openmpt_module_select_subsong = Module["_openmpt_module_select_subsong"] = asm["fb"];
      var _openmpt_module_get_selected_subsong = Module["_openmpt_module_get_selected_subsong"] = asm["gb"];
      var _openmpt_module_set_repeat_count = Module["_openmpt_module_set_repeat_count"] = asm["hb"];
      var _openmpt_module_get_repeat_count = Module["_openmpt_module_get_repeat_count"] = asm["ib"];
      var _openmpt_module_get_duration_seconds = Module["_openmpt_module_get_duration_seconds"] = asm["jb"];
      var _openmpt_module_set_position_seconds = Module["_openmpt_module_set_position_seconds"] = asm["kb"];
      var _openmpt_module_get_position_seconds = Module["_openmpt_module_get_position_seconds"] = asm["lb"];
      var _openmpt_module_set_position_order_row = Module["_openmpt_module_set_position_order_row"] = asm["mb"];
      var _openmpt_module_get_render_param = Module["_openmpt_module_get_render_param"] = asm["nb"];
      var _openmpt_module_set_render_param = Module["_openmpt_module_set_render_param"] = asm["ob"];
      var _openmpt_module_read_mono = Module["_openmpt_module_read_mono"] = asm["pb"];
      var _openmpt_module_read_stereo = Module["_openmpt_module_read_stereo"] = asm["qb"];
      var _openmpt_module_read_quad = Module["_openmpt_module_read_quad"] = asm["rb"];
      var _openmpt_module_read_float_mono = Module["_openmpt_module_read_float_mono"] = asm["sb"];
      var _openmpt_module_read_float_stereo = Module["_openmpt_module_read_float_stereo"] = asm["tb"];
      var _openmpt_module_read_float_quad = Module["_openmpt_module_read_float_quad"] = asm["ub"];
      var _openmpt_module_read_interleaved_stereo = Module["_openmpt_module_read_interleaved_stereo"] = asm["vb"];
      var _openmpt_module_read_interleaved_quad = Module["_openmpt_module_read_interleaved_quad"] = asm["wb"];
      var _openmpt_module_read_interleaved_float_stereo = Module["_openmpt_module_read_interleaved_float_stereo"] = asm["xb"];
      var _openmpt_module_read_interleaved_float_quad = Module["_openmpt_module_read_interleaved_float_quad"] = asm["yb"];
      var _openmpt_module_get_metadata_keys = Module["_openmpt_module_get_metadata_keys"] = asm["zb"];
      var _openmpt_module_get_metadata = Module["_openmpt_module_get_metadata"] = asm["Ab"];
      var _openmpt_module_get_current_estimated_bpm = Module["_openmpt_module_get_current_estimated_bpm"] = asm["Bb"];
      var _openmpt_module_get_current_speed = Module["_openmpt_module_get_current_speed"] = asm["Cb"];
      var _openmpt_module_get_current_tempo = Module["_openmpt_module_get_current_tempo"] = asm["Db"];
      var _openmpt_module_get_current_tempo2 = Module["_openmpt_module_get_current_tempo2"] = asm["Eb"];
      var _openmpt_module_get_current_order = Module["_openmpt_module_get_current_order"] = asm["Fb"];
      var _openmpt_module_get_current_pattern = Module["_openmpt_module_get_current_pattern"] = asm["Gb"];
      var _openmpt_module_get_current_row = Module["_openmpt_module_get_current_row"] = asm["Hb"];
      var _openmpt_module_get_current_playing_channels = Module["_openmpt_module_get_current_playing_channels"] = asm["Ib"];
      var _openmpt_module_get_current_channel_vu_mono = Module["_openmpt_module_get_current_channel_vu_mono"] = asm["Jb"];
      var _openmpt_module_get_current_channel_vu_left = Module["_openmpt_module_get_current_channel_vu_left"] = asm["Kb"];
      var _openmpt_module_get_current_channel_vu_right = Module["_openmpt_module_get_current_channel_vu_right"] = asm["Lb"];
      var _openmpt_module_get_current_channel_vu_rear_left = Module["_openmpt_module_get_current_channel_vu_rear_left"] = asm["Mb"];
      var _openmpt_module_get_current_channel_vu_rear_right = Module["_openmpt_module_get_current_channel_vu_rear_right"] = asm["Nb"];
      var _openmpt_module_get_num_subsongs = Module["_openmpt_module_get_num_subsongs"] = asm["Ob"];
      var _openmpt_module_get_num_channels = Module["_openmpt_module_get_num_channels"] = asm["Pb"];
      var _openmpt_module_get_num_orders = Module["_openmpt_module_get_num_orders"] = asm["Qb"];
      var _openmpt_module_get_num_patterns = Module["_openmpt_module_get_num_patterns"] = asm["Rb"];
      var _openmpt_module_get_num_instruments = Module["_openmpt_module_get_num_instruments"] = asm["Sb"];
      var _openmpt_module_get_num_samples = Module["_openmpt_module_get_num_samples"] = asm["Tb"];
      var _openmpt_module_get_subsong_name = Module["_openmpt_module_get_subsong_name"] = asm["Ub"];
      var _openmpt_module_get_channel_name = Module["_openmpt_module_get_channel_name"] = asm["Vb"];
      var _openmpt_module_get_order_name = Module["_openmpt_module_get_order_name"] = asm["Wb"];
      var _openmpt_module_get_pattern_name = Module["_openmpt_module_get_pattern_name"] = asm["Xb"];
      var _openmpt_module_get_instrument_name = Module["_openmpt_module_get_instrument_name"] = asm["Yb"];
      var _openmpt_module_get_sample_name = Module["_openmpt_module_get_sample_name"] = asm["Zb"];
      var _openmpt_module_get_order_pattern = Module["_openmpt_module_get_order_pattern"] = asm["_b"];
      var _openmpt_module_get_pattern_num_rows = Module["_openmpt_module_get_pattern_num_rows"] = asm["$b"];
      var _openmpt_module_get_pattern_row_channel_command = Module["_openmpt_module_get_pattern_row_channel_command"] = asm["ac"];
      var _openmpt_module_format_pattern_row_channel_command = Module["_openmpt_module_format_pattern_row_channel_command"] = asm["bc"];
      var _openmpt_module_highlight_pattern_row_channel_command = Module["_openmpt_module_highlight_pattern_row_channel_command"] = asm["cc"];
      var _openmpt_module_format_pattern_row_channel = Module["_openmpt_module_format_pattern_row_channel"] = asm["dc"];
      var _openmpt_module_highlight_pattern_row_channel = Module["_openmpt_module_highlight_pattern_row_channel"] = asm["ec"];
      var _openmpt_module_get_ctls = Module["_openmpt_module_get_ctls"] = asm["fc"];
      var _openmpt_module_ctl_get = Module["_openmpt_module_ctl_get"] = asm["gc"];
      var _openmpt_module_ctl_get_boolean = Module["_openmpt_module_ctl_get_boolean"] = asm["hc"];
      var _openmpt_module_ctl_get_integer = Module["_openmpt_module_ctl_get_integer"] = asm["ic"];
      var _openmpt_module_ctl_get_floatingpoint = Module["_openmpt_module_ctl_get_floatingpoint"] = asm["jc"];
      var _openmpt_module_ctl_get_text = Module["_openmpt_module_ctl_get_text"] = asm["kc"];
      var _openmpt_module_ctl_set = Module["_openmpt_module_ctl_set"] = asm["lc"];
      var _openmpt_module_ctl_set_boolean = Module["_openmpt_module_ctl_set_boolean"] = asm["mc"];
      var _openmpt_module_ctl_set_integer = Module["_openmpt_module_ctl_set_integer"] = asm["nc"];
      var _openmpt_module_ctl_set_floatingpoint = Module["_openmpt_module_ctl_set_floatingpoint"] = asm["oc"];
      var _openmpt_module_ctl_set_text = Module["_openmpt_module_ctl_set_text"] = asm["pc"];
      var _openmpt_module_ext_create = Module["_openmpt_module_ext_create"] = asm["qc"];
      var _openmpt_module_ext_create_from_memory = Module["_openmpt_module_ext_create_from_memory"] = asm["rc"];
      var _openmpt_module_ext_destroy = Module["_openmpt_module_ext_destroy"] = asm["sc"];
      var _openmpt_module_ext_get_module = Module["_openmpt_module_ext_get_module"] = asm["tc"];
      var _openmpt_module_ext_get_interface = Module["_openmpt_module_ext_get_interface"] = asm["uc"];
      var __ZN7openmpt9exceptionD2Ev = Module["__ZN7openmpt9exceptionD2Ev"] = asm["vc"];
      var __ZN7openmpt9exceptionC2ERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module["__ZN7openmpt9exceptionC2ERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE"] = asm["wc"];
      var __ZNK7openmpt9exception4whatEv = Module["__ZNK7openmpt9exception4whatEv"] = asm["xc"];
      var _malloc = Module["_malloc"] = asm["yc"];
      var __ZN7openmpt9exceptionC2ERKS0_ = Module["__ZN7openmpt9exceptionC2ERKS0_"] = asm["zc"];
      var __ZN7openmpt9exceptionC2EOS0_ = Module["__ZN7openmpt9exceptionC2EOS0_"] = asm["Ac"];
      var __ZN7openmpt9exceptionaSERKS0_ = Module["__ZN7openmpt9exceptionaSERKS0_"] = asm["Bc"];
      var __ZN7openmpt9exceptionaSEOS0_ = Module["__ZN7openmpt9exceptionaSEOS0_"] = asm["Cc"];
      var __ZN7openmpt9exceptionD0Ev = Module["__ZN7openmpt9exceptionD0Ev"] = asm["Dc"];
      var __ZN7openmpt24get_supported_extensionsEv = Module["__ZN7openmpt24get_supported_extensionsEv"] = asm["Ec"];
      var __ZN7openmpt22is_extension_supportedERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE = Module["__ZN7openmpt22is_extension_supportedERKNSt3__212basic_stringIcNS0_11char_traitsIcEENS0_9allocatorIcEEEE"] = asm["Fc"];
      var __ZN7openmpt23is_extension_supported2ENSt3__217basic_string_viewIcNS0_11char_traitsIcEEEE = Module["__ZN7openmpt23is_extension_supported2ENSt3__217basic_string_viewIcNS0_11char_traitsIcEEEE"] = asm["Gc"];
      var __ZN7openmpt22could_open_probabilityERNSt3__213basic_istreamIcNS0_11char_traitsIcEEEEdRNS0_13basic_ostreamIcS3_EE = Module["__ZN7openmpt22could_open_probabilityERNSt3__213basic_istreamIcNS0_11char_traitsIcEEEEdRNS0_13basic_ostreamIcS3_EE"] = asm["Hc"];
      var __ZN7openmpt22could_open_propabilityERNSt3__213basic_istreamIcNS0_11char_traitsIcEEEEdRNS0_13basic_ostreamIcS3_EE = Module["__ZN7openmpt22could_open_propabilityERNSt3__213basic_istreamIcNS0_11char_traitsIcEEEEdRNS0_13basic_ostreamIcS3_EE"] = asm["Ic"];
      var __ZN7openmpt38probe_file_header_get_recommended_sizeEv = Module["__ZN7openmpt38probe_file_header_get_recommended_sizeEv"] = asm["Jc"];
      var __ZN7openmpt17probe_file_headerEyPKSt4bytemy = Module["__ZN7openmpt17probe_file_headerEyPKSt4bytemy"] = asm["Kc"];
      var __ZN7openmpt17probe_file_headerEyPKhmy = Module["__ZN7openmpt17probe_file_headerEyPKhmy"] = asm["Lc"];
      var __ZN7openmpt17probe_file_headerEyPKSt4bytem = Module["__ZN7openmpt17probe_file_headerEyPKSt4bytem"] = asm["Mc"];
      var __ZN7openmpt17probe_file_headerEyPKhm = Module["__ZN7openmpt17probe_file_headerEyPKhm"] = asm["Nc"];
      var __ZN7openmpt17probe_file_headerEyRNSt3__213basic_istreamIcNS0_11char_traitsIcEEEE = Module["__ZN7openmpt17probe_file_headerEyRNSt3__213basic_istreamIcNS0_11char_traitsIcEEEE"] = asm["Oc"];
      var __ZN7openmpt6moduleC2ERNSt3__213basic_istreamIcNS1_11char_traitsIcEEEERNS1_13basic_ostreamIcS4_EERKNS1_3mapINS1_12basic_stringIcS4_NS1_9allocatorIcEEEESE_NS1_4lessISE_EENSC_INS1_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt6moduleC2ERNSt3__213basic_istreamIcNS1_11char_traitsIcEEEERNS1_13basic_ostreamIcS4_EERKNS1_3mapINS1_12basic_stringIcS4_NS1_9allocatorIcEEEESE_NS1_4lessISE_EENSC_INS1_4pairIKSE_SE_EEEEEE"] = asm["Pc"];
      var __ZN7openmpt6moduleC2ERKNSt3__26vectorISt4byteNS1_9allocatorIS3_EEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSB_NS4_IcEEEESH_NS1_4lessISH_EENS4_INS1_4pairIKSH_SH_EEEEEE = Module["__ZN7openmpt6moduleC2ERKNSt3__26vectorISt4byteNS1_9allocatorIS3_EEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSB_NS4_IcEEEESH_NS1_4lessISH_EENS4_INS1_4pairIKSH_SH_EEEEEE"] = asm["Qc"];
      var __ZN7openmpt6moduleC2EPKSt4byteS3_RNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt6moduleC2EPKSt4byteS3_RNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE"] = asm["Rc"];
      var __ZN7openmpt6moduleC2EPKSt4bytemRNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt6moduleC2EPKSt4bytemRNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE"] = asm["Sc"];
      var __ZN7openmpt6moduleC2ERKNSt3__26vectorIhNS1_9allocatorIhEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_NS3_IcEEEESG_NS1_4lessISG_EENS3_INS1_4pairIKSG_SG_EEEEEE = Module["__ZN7openmpt6moduleC2ERKNSt3__26vectorIhNS1_9allocatorIhEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_NS3_IcEEEESG_NS1_4lessISG_EENS3_INS1_4pairIKSG_SG_EEEEEE"] = asm["Tc"];
      var __ZN7openmpt6moduleC2EPKhS2_RNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC2EPKhS2_RNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Uc"];
      var __ZN7openmpt6moduleC2EPKhmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC2EPKhmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Vc"];
      var __ZN7openmpt6moduleC2ERKNSt3__26vectorIcNS1_9allocatorIcEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_S4_EESF_NS1_4lessISF_EENS3_INS1_4pairIKSF_SF_EEEEEE = Module["__ZN7openmpt6moduleC2ERKNSt3__26vectorIcNS1_9allocatorIcEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_S4_EESF_NS1_4lessISF_EENS3_INS1_4pairIKSF_SF_EEEEEE"] = asm["Wc"];
      var __ZN7openmpt6moduleC2EPKcS2_RNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC2EPKcS2_RNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Xc"];
      var __ZN7openmpt6moduleC2EPKcmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC2EPKcmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Yc"];
      var __ZN7openmpt6moduleC2EPKvmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC2EPKvmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Zc"];
      var __ZN7openmpt6moduleD2Ev = Module["__ZN7openmpt6moduleD2Ev"] = asm["_c"];
      var __ZN7openmpt6moduleD0Ev = Module["__ZN7openmpt6moduleD0Ev"] = asm["$c"];
      var __ZN7openmpt6module14select_subsongEi = Module["__ZN7openmpt6module14select_subsongEi"] = asm["ad"];
      var __ZNK7openmpt6module20get_selected_subsongEv = Module["__ZNK7openmpt6module20get_selected_subsongEv"] = asm["bd"];
      var __ZN7openmpt6module16set_repeat_countEi = Module["__ZN7openmpt6module16set_repeat_countEi"] = asm["cd"];
      var __ZNK7openmpt6module16get_repeat_countEv = Module["__ZNK7openmpt6module16get_repeat_countEv"] = asm["dd"];
      var __ZNK7openmpt6module20get_duration_secondsEv = Module["__ZNK7openmpt6module20get_duration_secondsEv"] = asm["ed"];
      var __ZN7openmpt6module20set_position_secondsEd = Module["__ZN7openmpt6module20set_position_secondsEd"] = asm["fd"];
      var __ZNK7openmpt6module20get_position_secondsEv = Module["__ZNK7openmpt6module20get_position_secondsEv"] = asm["gd"];
      var __ZN7openmpt6module22set_position_order_rowEii = Module["__ZN7openmpt6module22set_position_order_rowEii"] = asm["hd"];
      var __ZNK7openmpt6module16get_render_paramEi = Module["__ZNK7openmpt6module16get_render_paramEi"] = asm["id"];
      var __ZN7openmpt6module16set_render_paramEii = Module["__ZN7openmpt6module16set_render_paramEii"] = asm["jd"];
      var __ZN7openmpt6module4readEimPs = Module["__ZN7openmpt6module4readEimPs"] = asm["kd"];
      var __ZN7openmpt6module4readEimPsS1_ = Module["__ZN7openmpt6module4readEimPsS1_"] = asm["ld"];
      var __ZN7openmpt6module4readEimPsS1_S1_S1_ = Module["__ZN7openmpt6module4readEimPsS1_S1_S1_"] = asm["md"];
      var __ZN7openmpt6module4readEimPf = Module["__ZN7openmpt6module4readEimPf"] = asm["nd"];
      var __ZN7openmpt6module4readEimPfS1_ = Module["__ZN7openmpt6module4readEimPfS1_"] = asm["od"];
      var __ZN7openmpt6module4readEimPfS1_S1_S1_ = Module["__ZN7openmpt6module4readEimPfS1_S1_S1_"] = asm["pd"];
      var __ZN7openmpt6module23read_interleaved_stereoEimPs = Module["__ZN7openmpt6module23read_interleaved_stereoEimPs"] = asm["qd"];
      var __ZN7openmpt6module21read_interleaved_quadEimPs = Module["__ZN7openmpt6module21read_interleaved_quadEimPs"] = asm["rd"];
      var __ZN7openmpt6module23read_interleaved_stereoEimPf = Module["__ZN7openmpt6module23read_interleaved_stereoEimPf"] = asm["sd"];
      var __ZN7openmpt6module21read_interleaved_quadEimPf = Module["__ZN7openmpt6module21read_interleaved_quadEimPf"] = asm["td"];
      var __ZNK7openmpt6module17get_metadata_keysEv = Module["__ZNK7openmpt6module17get_metadata_keysEv"] = asm["ud"];
      var __ZNK7openmpt6module12get_metadataERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module["__ZNK7openmpt6module12get_metadataERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE"] = asm["vd"];
      var __ZNK7openmpt6module25get_current_estimated_bpmEv = Module["__ZNK7openmpt6module25get_current_estimated_bpmEv"] = asm["wd"];
      var __ZNK7openmpt6module17get_current_speedEv = Module["__ZNK7openmpt6module17get_current_speedEv"] = asm["xd"];
      var __ZNK7openmpt6module17get_current_tempoEv = Module["__ZNK7openmpt6module17get_current_tempoEv"] = asm["yd"];
      var __ZNK7openmpt6module18get_current_tempo2Ev = Module["__ZNK7openmpt6module18get_current_tempo2Ev"] = asm["zd"];
      var __ZNK7openmpt6module17get_current_orderEv = Module["__ZNK7openmpt6module17get_current_orderEv"] = asm["Ad"];
      var __ZNK7openmpt6module19get_current_patternEv = Module["__ZNK7openmpt6module19get_current_patternEv"] = asm["Bd"];
      var __ZNK7openmpt6module15get_current_rowEv = Module["__ZNK7openmpt6module15get_current_rowEv"] = asm["Cd"];
      var __ZNK7openmpt6module28get_current_playing_channelsEv = Module["__ZNK7openmpt6module28get_current_playing_channelsEv"] = asm["Dd"];
      var __ZNK7openmpt6module27get_current_channel_vu_monoEi = Module["__ZNK7openmpt6module27get_current_channel_vu_monoEi"] = asm["Ed"];
      var __ZNK7openmpt6module27get_current_channel_vu_leftEi = Module["__ZNK7openmpt6module27get_current_channel_vu_leftEi"] = asm["Fd"];
      var __ZNK7openmpt6module28get_current_channel_vu_rightEi = Module["__ZNK7openmpt6module28get_current_channel_vu_rightEi"] = asm["Gd"];
      var __ZNK7openmpt6module32get_current_channel_vu_rear_leftEi = Module["__ZNK7openmpt6module32get_current_channel_vu_rear_leftEi"] = asm["Hd"];
      var __ZNK7openmpt6module33get_current_channel_vu_rear_rightEi = Module["__ZNK7openmpt6module33get_current_channel_vu_rear_rightEi"] = asm["Id"];
      var __ZNK7openmpt6module16get_num_subsongsEv = Module["__ZNK7openmpt6module16get_num_subsongsEv"] = asm["Jd"];
      var __ZNK7openmpt6module16get_num_channelsEv = Module["__ZNK7openmpt6module16get_num_channelsEv"] = asm["Kd"];
      var __ZNK7openmpt6module14get_num_ordersEv = Module["__ZNK7openmpt6module14get_num_ordersEv"] = asm["Ld"];
      var __ZNK7openmpt6module16get_num_patternsEv = Module["__ZNK7openmpt6module16get_num_patternsEv"] = asm["Md"];
      var __ZNK7openmpt6module19get_num_instrumentsEv = Module["__ZNK7openmpt6module19get_num_instrumentsEv"] = asm["Nd"];
      var __ZNK7openmpt6module15get_num_samplesEv = Module["__ZNK7openmpt6module15get_num_samplesEv"] = asm["Od"];
      var __ZNK7openmpt6module17get_subsong_namesEv = Module["__ZNK7openmpt6module17get_subsong_namesEv"] = asm["Pd"];
      var __ZNK7openmpt6module17get_channel_namesEv = Module["__ZNK7openmpt6module17get_channel_namesEv"] = asm["Qd"];
      var __ZNK7openmpt6module15get_order_namesEv = Module["__ZNK7openmpt6module15get_order_namesEv"] = asm["Rd"];
      var __ZNK7openmpt6module17get_pattern_namesEv = Module["__ZNK7openmpt6module17get_pattern_namesEv"] = asm["Sd"];
      var __ZNK7openmpt6module20get_instrument_namesEv = Module["__ZNK7openmpt6module20get_instrument_namesEv"] = asm["Td"];
      var __ZNK7openmpt6module16get_sample_namesEv = Module["__ZNK7openmpt6module16get_sample_namesEv"] = asm["Ud"];
      var __ZNK7openmpt6module17get_order_patternEi = Module["__ZNK7openmpt6module17get_order_patternEi"] = asm["Vd"];
      var __ZNK7openmpt6module20get_pattern_num_rowsEi = Module["__ZNK7openmpt6module20get_pattern_num_rowsEi"] = asm["Wd"];
      var __ZNK7openmpt6module31get_pattern_row_channel_commandEiiii = Module["__ZNK7openmpt6module31get_pattern_row_channel_commandEiiii"] = asm["Xd"];
      var __ZNK7openmpt6module34format_pattern_row_channel_commandEiiii = Module["__ZNK7openmpt6module34format_pattern_row_channel_commandEiiii"] = asm["Yd"];
      var __ZNK7openmpt6module37highlight_pattern_row_channel_commandEiiii = Module["__ZNK7openmpt6module37highlight_pattern_row_channel_commandEiiii"] = asm["Zd"];
      var __ZNK7openmpt6module26format_pattern_row_channelEiiimb = Module["__ZNK7openmpt6module26format_pattern_row_channelEiiimb"] = asm["_d"];
      var __ZNK7openmpt6module29highlight_pattern_row_channelEiiimb = Module["__ZNK7openmpt6module29highlight_pattern_row_channelEiiimb"] = asm["$d"];
      var __ZNK7openmpt6module8get_ctlsEv = Module["__ZNK7openmpt6module8get_ctlsEv"] = asm["ae"];
      var __ZNK7openmpt6module7ctl_getERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module["__ZNK7openmpt6module7ctl_getERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE"] = asm["be"];
      var __ZNK7openmpt6module15ctl_get_booleanENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEE = Module["__ZNK7openmpt6module15ctl_get_booleanENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEE"] = asm["ce"];
      var __ZNK7openmpt6module15ctl_get_integerENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEE = Module["__ZNK7openmpt6module15ctl_get_integerENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEE"] = asm["de"];
      var __ZNK7openmpt6module21ctl_get_floatingpointENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEE = Module["__ZNK7openmpt6module21ctl_get_floatingpointENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEE"] = asm["ee"];
      var __ZNK7openmpt6module12ctl_get_textENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEE = Module["__ZNK7openmpt6module12ctl_get_textENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEE"] = asm["fe"];
      var __ZN7openmpt6module7ctl_setERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEES9_ = Module["__ZN7openmpt6module7ctl_setERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEES9_"] = asm["ge"];
      var __ZN7openmpt6module15ctl_set_booleanENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEEb = Module["__ZN7openmpt6module15ctl_set_booleanENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEEb"] = asm["he"];
      var __ZN7openmpt6module15ctl_set_integerENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEEx = Module["__ZN7openmpt6module15ctl_set_integerENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEEx"] = asm["ie"];
      var __ZN7openmpt6module21ctl_set_floatingpointENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEEd = Module["__ZN7openmpt6module21ctl_set_floatingpointENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEEd"] = asm["je"];
      var __ZN7openmpt6module12ctl_set_textENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEES5_ = Module["__ZN7openmpt6module12ctl_set_textENSt3__217basic_string_viewIcNS1_11char_traitsIcEEEES5_"] = asm["ke"];
      var __ZN7openmpt10module_extC2ERNSt3__213basic_istreamIcNS1_11char_traitsIcEEEERNS1_13basic_ostreamIcS4_EERKNS1_3mapINS1_12basic_stringIcS4_NS1_9allocatorIcEEEESE_NS1_4lessISE_EENSC_INS1_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt10module_extC2ERNSt3__213basic_istreamIcNS1_11char_traitsIcEEEERNS1_13basic_ostreamIcS4_EERKNS1_3mapINS1_12basic_stringIcS4_NS1_9allocatorIcEEEESE_NS1_4lessISE_EENSC_INS1_4pairIKSE_SE_EEEEEE"] = asm["le"];
      var __ZN7openmpt10module_extC2ERKNSt3__26vectorIhNS1_9allocatorIhEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_NS3_IcEEEESG_NS1_4lessISG_EENS3_INS1_4pairIKSG_SG_EEEEEE = Module["__ZN7openmpt10module_extC2ERKNSt3__26vectorIhNS1_9allocatorIhEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_NS3_IcEEEESG_NS1_4lessISG_EENS3_INS1_4pairIKSG_SG_EEEEEE"] = asm["me"];
      var __ZN7openmpt10module_extC2ERKNSt3__26vectorIcNS1_9allocatorIcEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_S4_EESF_NS1_4lessISF_EENS3_INS1_4pairIKSF_SF_EEEEEE = Module["__ZN7openmpt10module_extC2ERKNSt3__26vectorIcNS1_9allocatorIcEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_S4_EESF_NS1_4lessISF_EENS3_INS1_4pairIKSF_SF_EEEEEE"] = asm["ne"];
      var __ZN7openmpt10module_extC2ERKNSt3__26vectorISt4byteNS1_9allocatorIS3_EEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSB_NS4_IcEEEESH_NS1_4lessISH_EENS4_INS1_4pairIKSH_SH_EEEEEE = Module["__ZN7openmpt10module_extC2ERKNSt3__26vectorISt4byteNS1_9allocatorIS3_EEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSB_NS4_IcEEEESH_NS1_4lessISH_EENS4_INS1_4pairIKSH_SH_EEEEEE"] = asm["oe"];
      var __ZN7openmpt10module_extC2EPKhmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt10module_extC2EPKhmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["pe"];
      var __ZN7openmpt10module_extC2EPKcmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt10module_extC2EPKcmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["qe"];
      var __ZN7openmpt10module_extC2EPKSt4bytemRNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt10module_extC2EPKSt4bytemRNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE"] = asm["re"];
      var __ZN7openmpt10module_extC2EPKvmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt10module_extC2EPKvmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["se"];
      var __ZN7openmpt10module_extD2Ev = Module["__ZN7openmpt10module_extD2Ev"] = asm["te"];
      var __ZN7openmpt10module_extD0Ev = Module["__ZN7openmpt10module_extD0Ev"] = asm["ue"];
      var __ZN7openmpt10module_extC2ERKS0_ = Module["__ZN7openmpt10module_extC2ERKS0_"] = asm["ve"];
      var __ZN7openmpt10module_extaSERKS0_ = Module["__ZN7openmpt10module_extaSERKS0_"] = asm["we"];
      var __ZN7openmpt10module_ext13get_interfaceERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module["__ZN7openmpt10module_ext13get_interfaceERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE"] = asm["xe"];
      var __ZN7openmpt9exceptionC1ERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE = Module["__ZN7openmpt9exceptionC1ERKNSt3__212basic_stringIcNS1_11char_traitsIcEENS1_9allocatorIcEEEE"] = asm["ye"];
      var __ZN7openmpt9exceptionC1ERKS0_ = Module["__ZN7openmpt9exceptionC1ERKS0_"] = asm["ze"];
      var __ZN7openmpt9exceptionC1EOS0_ = Module["__ZN7openmpt9exceptionC1EOS0_"] = asm["Ae"];
      var __ZN7openmpt9exceptionD1Ev = Module["__ZN7openmpt9exceptionD1Ev"] = asm["Be"];
      var __ZN7openmpt6moduleC1ERNSt3__213basic_istreamIcNS1_11char_traitsIcEEEERNS1_13basic_ostreamIcS4_EERKNS1_3mapINS1_12basic_stringIcS4_NS1_9allocatorIcEEEESE_NS1_4lessISE_EENSC_INS1_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt6moduleC1ERNSt3__213basic_istreamIcNS1_11char_traitsIcEEEERNS1_13basic_ostreamIcS4_EERKNS1_3mapINS1_12basic_stringIcS4_NS1_9allocatorIcEEEESE_NS1_4lessISE_EENSC_INS1_4pairIKSE_SE_EEEEEE"] = asm["Ce"];
      var __ZN7openmpt6moduleC1ERKNSt3__26vectorISt4byteNS1_9allocatorIS3_EEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSB_NS4_IcEEEESH_NS1_4lessISH_EENS4_INS1_4pairIKSH_SH_EEEEEE = Module["__ZN7openmpt6moduleC1ERKNSt3__26vectorISt4byteNS1_9allocatorIS3_EEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSB_NS4_IcEEEESH_NS1_4lessISH_EENS4_INS1_4pairIKSH_SH_EEEEEE"] = asm["De"];
      var __ZN7openmpt6moduleC1EPKSt4byteS3_RNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt6moduleC1EPKSt4byteS3_RNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE"] = asm["Ee"];
      var __ZN7openmpt6moduleC1EPKSt4bytemRNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt6moduleC1EPKSt4bytemRNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE"] = asm["Fe"];
      var __ZN7openmpt6moduleC1ERKNSt3__26vectorIhNS1_9allocatorIhEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_NS3_IcEEEESG_NS1_4lessISG_EENS3_INS1_4pairIKSG_SG_EEEEEE = Module["__ZN7openmpt6moduleC1ERKNSt3__26vectorIhNS1_9allocatorIhEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_NS3_IcEEEESG_NS1_4lessISG_EENS3_INS1_4pairIKSG_SG_EEEEEE"] = asm["Ge"];
      var __ZN7openmpt6moduleC1EPKhS2_RNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC1EPKhS2_RNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["He"];
      var __ZN7openmpt6moduleC1EPKhmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC1EPKhmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Ie"];
      var __ZN7openmpt6moduleC1ERKNSt3__26vectorIcNS1_9allocatorIcEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_S4_EESF_NS1_4lessISF_EENS3_INS1_4pairIKSF_SF_EEEEEE = Module["__ZN7openmpt6moduleC1ERKNSt3__26vectorIcNS1_9allocatorIcEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_S4_EESF_NS1_4lessISF_EENS3_INS1_4pairIKSF_SF_EEEEEE"] = asm["Je"];
      var __ZN7openmpt6moduleC1EPKcS2_RNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC1EPKcS2_RNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Ke"];
      var __ZN7openmpt6moduleC1EPKcmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC1EPKcmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Le"];
      var __ZN7openmpt6moduleC1EPKvmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt6moduleC1EPKvmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Me"];
      var __ZN7openmpt6moduleD1Ev = Module["__ZN7openmpt6moduleD1Ev"] = asm["Ne"];
      var __ZN7openmpt10module_extC1ERNSt3__213basic_istreamIcNS1_11char_traitsIcEEEERNS1_13basic_ostreamIcS4_EERKNS1_3mapINS1_12basic_stringIcS4_NS1_9allocatorIcEEEESE_NS1_4lessISE_EENSC_INS1_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt10module_extC1ERNSt3__213basic_istreamIcNS1_11char_traitsIcEEEERNS1_13basic_ostreamIcS4_EERKNS1_3mapINS1_12basic_stringIcS4_NS1_9allocatorIcEEEESE_NS1_4lessISE_EENSC_INS1_4pairIKSE_SE_EEEEEE"] = asm["Oe"];
      var __ZN7openmpt10module_extC1ERKNSt3__26vectorIhNS1_9allocatorIhEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_NS3_IcEEEESG_NS1_4lessISG_EENS3_INS1_4pairIKSG_SG_EEEEEE = Module["__ZN7openmpt10module_extC1ERKNSt3__26vectorIhNS1_9allocatorIhEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_NS3_IcEEEESG_NS1_4lessISG_EENS3_INS1_4pairIKSG_SG_EEEEEE"] = asm["Pe"];
      var __ZN7openmpt10module_extC1ERKNSt3__26vectorIcNS1_9allocatorIcEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_S4_EESF_NS1_4lessISF_EENS3_INS1_4pairIKSF_SF_EEEEEE = Module["__ZN7openmpt10module_extC1ERKNSt3__26vectorIcNS1_9allocatorIcEEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSA_S4_EESF_NS1_4lessISF_EENS3_INS1_4pairIKSF_SF_EEEEEE"] = asm["Qe"];
      var __ZN7openmpt10module_extC1ERKNSt3__26vectorISt4byteNS1_9allocatorIS3_EEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSB_NS4_IcEEEESH_NS1_4lessISH_EENS4_INS1_4pairIKSH_SH_EEEEEE = Module["__ZN7openmpt10module_extC1ERKNSt3__26vectorISt4byteNS1_9allocatorIS3_EEEERNS1_13basic_ostreamIcNS1_11char_traitsIcEEEERKNS1_3mapINS1_12basic_stringIcSB_NS4_IcEEEESH_NS1_4lessISH_EENS4_INS1_4pairIKSH_SH_EEEEEE"] = asm["Re"];
      var __ZN7openmpt10module_extC1EPKhmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt10module_extC1EPKhmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Se"];
      var __ZN7openmpt10module_extC1EPKcmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt10module_extC1EPKcmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Te"];
      var __ZN7openmpt10module_extC1EPKSt4bytemRNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE = Module["__ZN7openmpt10module_extC1EPKSt4bytemRNSt3__213basic_ostreamIcNS4_11char_traitsIcEEEERKNS4_3mapINS4_12basic_stringIcS7_NS4_9allocatorIcEEEESE_NS4_4lessISE_EENSC_INS4_4pairIKSE_SE_EEEEEE"] = asm["Ue"];
      var __ZN7openmpt10module_extC1EPKvmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE = Module["__ZN7openmpt10module_extC1EPKvmRNSt3__213basic_ostreamIcNS3_11char_traitsIcEEEERKNS3_3mapINS3_12basic_stringIcS6_NS3_9allocatorIcEEEESD_NS3_4lessISD_EENSB_INS3_4pairIKSD_SD_EEEEEE"] = asm["Ve"];
      var __ZN7openmpt10module_extD1Ev = Module["__ZN7openmpt10module_extD1Ev"] = asm["We"];
      var __ZN7openmpt10module_extC1ERKS0_ = Module["__ZN7openmpt10module_extC1ERKS0_"] = asm["Xe"];
      var _setThrew = Module["_setThrew"] = asm["Ze"];
      var setTempRet0 = Module["setTempRet0"] = asm["_e"];
      var stackSave = Module["stackSave"] = asm["$e"];
      var stackRestore = Module["stackRestore"] = asm["af"];
      var ___cxa_can_catch = Module["___cxa_can_catch"] = asm["bf"];
      var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = asm["cf"];
      var dynCall_j = Module["dynCall_j"] = asm["df"];
      var dynCall_viiji = Module["dynCall_viiji"] = asm["ef"];
      var dynCall_iiji = Module["dynCall_iiji"] = asm["ff"];
      var dynCall_vij = Module["dynCall_vij"] = asm["gf"];
      var dynCall_viij = Module["dynCall_viij"] = asm["hf"];
      var dynCall_ijiij = Module["dynCall_ijiij"] = asm["jf"];
      var dynCall_viji = Module["dynCall_viji"] = asm["kf"];
      var dynCall_jiiii = Module["dynCall_jiiii"] = asm["lf"];
      var dynCall_iiij = Module["dynCall_iiij"] = asm["mf"];

      function invoke_iii(index, a1, a2) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viii(index, a1, a2, a3) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_ii(index, a1) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_vii(index, a1, a2) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_vi(index, a1) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_v(index) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)()
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiii(index, a1, a2, a3) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_i(index) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)()
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iid(index, a1, a2) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiii(index, a1, a2, a3, a4) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiiii(index, a1, a2, a3, a4, a5) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4, a5)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiiii(index, a1, a2, a3, a4) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_di(index, a1) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_fi(index, a1) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viif(index, a1, a2, a3) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_vid(index, a1, a2) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiifii(index, a1, a2, a3, a4, a5) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_fii(index, a1, a2) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_didi(index, a1, a2, a3) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_diiii(index, a1, a2, a3, a4) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiidi(index, a1, a2, a3, a4, a5) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4, a5)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iifi(index, a1, a2, a3) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_diii(index, a1, a2, a3) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_did(index, a1, a2) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viid(index, a1, a2, a3) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_dii(index, a1, a2) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiiidd(index, a1, a2, a3, a4, a5) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4, a5)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
        var sp = stackSave();
        try {
          return getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
        var sp = stackSave();
        try {
          getWasmTableEntry(index)(a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiji(index, a1, a2, a3, a4) {
        var sp = stackSave();
        try {
          return dynCall_iiji(index, a1, a2, a3, a4)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_vij(index, a1, a2, a3) {
        var sp = stackSave();
        try {
          dynCall_vij(index, a1, a2, a3)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viij(index, a1, a2, a3, a4) {
        var sp = stackSave();
        try {
          dynCall_viij(index, a1, a2, a3, a4)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_jiiii(index, a1, a2, a3, a4) {
        var sp = stackSave();
        try {
          return dynCall_jiiii(index, a1, a2, a3, a4)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viiji(index, a1, a2, a3, a4, a5) {
        var sp = stackSave();
        try {
          dynCall_viiji(index, a1, a2, a3, a4, a5)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_ijiij(index, a1, a2, a3, a4, a5, a6) {
        var sp = stackSave();
        try {
          return dynCall_ijiij(index, a1, a2, a3, a4, a5, a6)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_viji(index, a1, a2, a3, a4) {
        var sp = stackSave();
        try {
          dynCall_viji(index, a1, a2, a3, a4)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_j(index) {
        var sp = stackSave();
        try {
          return dynCall_j(index)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      function invoke_iiij(index, a1, a2, a3, a4) {
        var sp = stackSave();
        try {
          return dynCall_iiij(index, a1, a2, a3, a4)
        } catch (e) {
          stackRestore(sp);
          if (e !== e + 0) throw e;
          _setThrew(1, 0)
        }
      }

      var calledRun;
      dependenciesFulfilled = function runCaller() {
        if (!calledRun) run();
        if (!calledRun) dependenciesFulfilled = runCaller
      };

      function run(args) {
        args = args || arguments_;
        if (runDependencies > 0) {
          return
        }
        preRun();
        if (runDependencies > 0) {
          return
        }

        function doRun() {
          if (calledRun) return;
          calledRun = true;
          Module["calledRun"] = true;
          if (ABORT) return;
          initRuntime();
          readyPromiseResolve(Module);
          if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
          postRun()
        }

        if (Module["setStatus"]) {
          Module["setStatus"]("Running...");
          setTimeout(function () {
            setTimeout(function () {
              Module["setStatus"]("")
            }, 1);
            doRun()
          }, 1)
        } else {
          doRun()
        }
      }

      if (Module["preInit"]) {
        if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
        while (Module["preInit"].length > 0) {
          Module["preInit"].pop()()
        }
      }
      run();


      return libopenmpt
    }
  );
})();

export default { libopenmpt };