<script>
  import {onDestroy, onMount} from 'svelte';
  import {
    song_metadata,
    sequence_data,
    patterns,
    current_row,
    current_pattern,
    next_pattern,
    channel_volume
  } from "../stores/openmptStore.js";
  import {process_highlight} from "../utilities/pattern.js";

  let loopMode = true;
  let processorNode = null;
  let audioWorkletModule = null;
  export let audio_element = null;
  export let song = null;
  export let sequence = -1;
  export let category = null;
  export let isPlaying = false;

  let current_song = null;

  // No hot reloading here!
  if (import.meta.hot) {
    import.meta.hot.decline();
  }

  onDestroy(() => stopProcessor(''));

  const audio_context = new AudioContext();
  let media_stream = null;

  const stopProcessor = (_) => {
    console.log("Cleaning up previous processor");

    audioWorkletModule = null;

    if (processorNode) {
      processorNode.port.postMessage({
        type: "dispose",
        value: null,
      });

      processorNode.disconnect();
      processorNode = null;
    }
  }

  onMount(() => {
    if (!audioWorkletModule) {
      audioWorkletModule = audio_context.audioWorklet.addModule("worklet/openmpt.worklet.js");
    }

    audioWorkletModule.then(() => {
      processorNode = new AudioWorkletNode(
        audio_context,
        "libopenmpt-processor",
        {
          numberOfInputs: 0,
          numberOfOutputs: 1,
          outputChannelCount: [2],
          processorOptions: {
            sampleRate: audio_context.sampleRate,
          },
        }
      );
      processorNode.connect(audio_context.destination);
      processorNode.port.onmessage = ((evt) => {
        if (!evt.data.type) {
          return;
        }

        switch (evt.data.type) {
          case 'metadata':
            const metadata = evt.data.value;
            // I could probably just remap keys easily, but eh this works for now
            song_metadata.set({
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
          case 'subsongs':
            sequence_data.set(evt.data.value);
            break;
          case 'patterns':
            patterns.set(processPatternHighlights(evt.data.pattern, evt.data.highlight));

            const channels = $patterns[0][0]?.length;
            const array_channels = new Array(channels);
            array_channels.fill(1.0);
            channel_volume.set(array_channels);

            break;
          case 'current_data':
            current_row.set(evt.data.row);
            current_pattern.set(evt.data.pattern);
            next_pattern.set(evt.data.next_pattern);
            break;
        }
      });

      audio_context.suspend();

      // Create a destination, and give it to our audio element
      media_stream = audio_context.createMediaStreamDestination();
      audio_element.srcObject = media_stream.stream;

    })
  });

  /**
   * Absolutely ridiculous maps here.
   * @param patterns
   * @param highlights
   * @returns {*}
   */
  const processPatternHighlights = (patterns, highlights) => {
    return patterns.map((sheet, sheet_index) => {
      return sheet.map((row, row_index) => {
        return row.map((column, column_index) => {
          return process_highlight(column, highlights[sheet_index][row_index][column_index]);
        });
      });
    });
  }

  const onLoad = (buffer) => {
    if (!processorNode) {
      return;
    }

    processorNode.port.postMessage({
      type: 'data',
      value: buffer,
    });

    current_song = song;
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

  const handlePlayback = (isPlaying) => {
    isPlaying ? audio_context.resume() : audio_context.suspend();

    // Also toggle audio element's play/pause
    if (!audio_element) {
      return;
    }

    if (isPlaying) {
      audio_element.play();
    } else {
      audio_element.pause();
    }
  }

  const handleChannelVolume = (channels) => {
    if (!processorNode) {
      return;
    }

    for (const channel in channels) {
      const volume = channels[channel];
      processorNode.port.postMessage({
        type: 'channel_volume',
        channel: channel,
        volume: volume,
      });
    }

  }

  const handleSubsong = (index) => {
    if (!processorNode) {
      return;
    }

    processorNode.port.postMessage({
      type: 'sequence',
      value: index
    });
  }

  // FIXME: xhr.response is held on for longer than it needs to be, and afaik is never collected by the gc.
  const LoadFile = (song, callback) => {
    if (!song) {
      return;
    }

    const input = song.full_path.replace('public/', '');

    let xhr = new XMLHttpRequest();
    // Mel: Need to encode the uri else we'll fail on hashes!
    xhr.open('GET', encodeURIComponent(input), true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function (e) {
      if (xhr.status === 200) {
        callback(xhr.response); // no error
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

  $: LoadFile(song, onLoad);
  $: if (song === current_song) {
    handleSubsong(sequence);
  }
  $: handlePlayback(isPlaying);
  $: if ($channel_volume) {
    handleChannelVolume($channel_volume);
  }

</script>
