<script>
  import {song_metadata} from "../stores/openmptStore.js";

  export let song = null;
  export let sequence = null;
  export let category = null;
  export let is_playing = false;

  const media_session = navigator?.mediaSession;

  const onMediaChange = (category, song, sequence) => {
    if (!media_session) {
      return;
    }

    const sequence_name = sequence === -1 ? 'All' : sequence;
    media_session.metadata = new MediaMetadata({
      album: category,
      artist: '',
      title: `${$song_metadata.title} | Sequence ${sequence_name}`,
      artwork: [],
    });
  }

  $: if ($song_metadata.title) {
    onMediaChange(category, song, sequence)
  }

  $: {
    media_session.playbackState = is_playing ? "playing" : "paused";
  }
</script>