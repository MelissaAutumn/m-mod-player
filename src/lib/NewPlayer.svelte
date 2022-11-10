<script>
  import {setContext} from "svelte";
  import {writable} from 'svelte/store';
  import {selected_song_key, selected_sequence_key, selected_category, playback_state_key} from "../model/player.js";
  import SongBar from "./Bars/SongBar.svelte";
  import SongList from "./Pages/SongList.svelte";
  import OpenMPT from "./OpenMPT.svelte";

  // These are writable stores for ease of use.
  const category = setContext(selected_category, writable(null));
  const song = setContext(selected_song_key, writable(null));
  const sequence = setContext(selected_sequence_key, writable(-1));
  const playback_state = setContext(playback_state_key, writable('paused'));

  // Reset selected sequence if selected song changes
  $: if ($song) {
    $sequence = -1;
  }

</script>
<div class="main">
    <SongList/>
    <SongBar/>
    <OpenMPT song={$song} subsong={sequence} isPlaying={$playback_state === 'playing'}/>
</div>
<style>
    :root {
        --spacing: 24px;
        --min-card-width: 256px;
    }

    .main {
        display: block;
    }
</style>