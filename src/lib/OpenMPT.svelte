<script>
  import {onDestroy, onMount} from 'svelte';
  import {songMetadata} from "../stores/openmptStore.js";

  let loopMode = true;
  let processorNode = null;
  let audioWorkletModule = null;
  export let song = null;

  // No hot reloading here!
  if (import.meta.hot) {
    import.meta.hot.decline();
  }

  onDestroy(() => stopProcessor(''));

  const audioContext = new AudioContext();

  const stopProcessor = (_) => {
    console.log("Cleaning up previous processor");

    audioWorkletModule = null;

    if (processorNode) {
      processorNode.port.postMessage({
        type: "dispose2",
        value: null,
      });

      processorNode.disconnect();
      processorNode = null;
    }
  }

  onMount(() => {
    if (!audioWorkletModule) {
      audioWorkletModule = audioContext.audioWorklet.addModule("worklet/openmpt.worklet.js");
    }

    audioWorkletModule.then(() => {
      processorNode = new AudioWorkletNode(
        audioContext,
        "libopenmpt-processor",
        {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          processorOptions: {},
        }
      );
      processorNode.connect(audioContext.destination);
      processorNode.port.onmessage = ((evt) => {
        if (!evt.data.type) {
          return;
        }

        switch (evt.data.type) {
          case 'metadata':
            const metadata = evt.data.value;
            // I could probably just remap keys easily, but eh this works for now
            songMetadata.set({
              type: metadata?.type,
              typeLong: metadata?.type_long,
              originalType: metadata?.originaltype,
              originalTypeLong: metadata?.originaltype_long,
              container: metadata?.container,
              containerLong: metadata?.container_long,
              tracker: metadata?.tracker,
              artist: metadata?.artist,
              title: metadata?.title,
              date: metadata?.date,
              message: metadata?.message,
              messageRaw: metadata?.messageRaw,
              warnings: metadata?.warnings,
            });
            break;
        }
      });

      audioContext.suspend();
    })
  });

  const onLoad = (buffer) => {
    if (!processorNode) {
      return;
    }

    processorNode.port.postMessage({
      type: 'data',
      value: buffer,
    });
  }

  const toggleLoopMode = () => {
    if (!processorNode) {
      return;
    }

    loopMode = !loopMode;

    processorNode.port.postMessage({
      type: "loop",
      value: loopMode,
    })
  }

  const onPlay = () => {
    audioContext.resume();
  }

  const LoadFile = (song, callback) => {
    if (!song) {
      return;
    }

    const input = ["/data/modules/", song].join('/');//"/data/modules/space_debris.mod";

    let xhr = new XMLHttpRequest();
    // Mel: Need to encode the uri else we'll fail on hashes!
    xhr.open('GET', encodeURIComponent(input), true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function (e) {
      if (xhr.status === 200) {
        callback(xhr.response); // no error
        console.log("Clearing response buffer");
        xhr = null;
        return;
      } else {
        console.log("Err", e);
      }
    }//.bind(this);
    xhr.onerror = function () {
      console.log("Err");
    };
    xhr.onabort = function () {
      console.log("Err");
    };
    xhr.send();
  }

  $: {
    //stopProcessor(song);
    LoadFile(song, onLoad);
  }
  ;
</script>

<button on:click={onPlay}>PLAY!!!</button>
<button on:click={toggleLoopMode}>LOOP {loopMode}</button>