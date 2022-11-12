<script>
  import {setContext} from "svelte";
  import {writable} from 'svelte/store';
  import {
    selected_song_key,
    selected_sequence_key,
    selected_category_key,
    playback_state_key,
    page_key, pages
  } from "../model/player.js";
  import SongBar from "./Bars/SongBar.svelte";
  import Songs from "./Pages/Songs.svelte";
  import OpenMPT from "./OpenMPT.svelte";
  import Bar from "./Base/Bar.svelte";
  import MenuBar from "./Bars/MenuBar.svelte";
  import Categories from "./Pages/Categories.svelte";

  // These are writable stores for ease of use.
  const category = setContext(selected_category_key, writable(null));
  const song = setContext(selected_song_key, writable(null));
  const sequence = setContext(selected_sequence_key, writable(-1));
  const playback_state = setContext(playback_state_key, writable('paused'));
  const page = setContext(page_key, writable(pages['Categories']));

  // Reset selected sequence if selected song changes
  $: if ($song) {
    $sequence = -1;
  }

</script>
<div class="main">
    <MenuBar/>
    {#if $page === pages.Songs}
    <Songs/>
    {:else if $page === pages.Categories}
    <Categories/>
    {/if}
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