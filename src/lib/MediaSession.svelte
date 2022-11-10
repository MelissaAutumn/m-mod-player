<script>
  import {selectedSongKey, selectedSubSongKey} from "../model/player.js";
  import {getContext} from "svelte";

  const selectedSong = getContext(selectedSongKey);
  if (!selectedSong) {
    console.warn(`No ${selectedSongKey.description} context!`);
  }
  const selectedSubsong = getContext(selectedSubSongKey);
  if (!selectedSubsong) {
    console.warn(`No ${selectedSubSongKey.description} context!`);
  }

  const onMediaChange = (category, song, subsong) => {
    if (!navigator.mediaSession) {
      return;
    }

    const sequenceName = subsong === -1 ? 'All' : subsong;
    navigator.mediaSession.metadata = new MediaMetadata({
      album: category,
      artist: '',
      title: `${song} | Sequence ${sequenceName}`,
      artwork: [],
    });


    console.log("New media session", navigator.mediaSession.metadata);
  }

  $: onMediaChange("", $selectedSong, $selectedSubsong);
</script>
<div>
    
</div>

<style>
    div {
        display: none;
    }
</style>