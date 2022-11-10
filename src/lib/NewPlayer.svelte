<script>

  import {setContext} from "svelte";
  import { writable } from 'svelte/store';
  import { selectedSongKey, selectedSubSongKey } from "../model/player.js";
  import SongBar from "./Bars/SongBar.svelte";
  import SongList from "./Pages/SongList.svelte";

  let selectedCategory = null;
  let isPlaying = false;

  const selectedSong = setContext(selectedSongKey, writable(null));
  const selectedSubSong = setContext(selectedSubSongKey, writable(-1));

  // Reset selected subsong if selected song changes
  $: if ($selectedSong) {
    $selectedSubSong = -1;
  }

</script>
<div class="main">
    <SongList/>
    <SongBar/>
</div>
<style>
    :root {
        --spacing: 24px;
        --min-card-width: 256px;
    }

    .main {
        display: block;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--min-card-width), 2fr));
        grid-column-gap: var(--spacing);
        grid-row-gap: var(--spacing);

    }

    .categories {
        height: 80vh;
        display: inline-grid;
        grid-column-end: auto;
        grid-row: 1;
        background-color: var(--background-color-main);
        border-radius: 8px;
    }

    .song-list {
        display: inline-grid;
        overflow: scroll;
        grid-row: span 2;
        height: 80vh;
        background-color: var(--background-color-main);

        border-radius: 8px;
    }

    .player-bar {
        /* moved inside component */
    }
</style>