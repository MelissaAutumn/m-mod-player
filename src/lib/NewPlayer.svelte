<script>
  import {
    pages, playback_states
  } from "../model/player.js";
  import SongBar from "./Bars/SongBar.svelte";
  import Songs from "./Pages/Songs.svelte";
  import OpenMPT from "./OpenMPT.svelte";
  import MenuBar from "./Bars/MenuBar.svelte";
  import Categories from "./Pages/Categories.svelte";

  let category = null;
  let song = null;
  let sequence = null;
  let playback_state = playback_states.Paused;
  let page = pages.Categories;

  // Reset selected sequence if selected song changes
  $: if (song) {
    sequence = -1;
  }

  // This isn't uhh..great.
  $: if (category) {
    page = pages.Songs;
  }

</script>
<div class="main">
    <MenuBar bind:page={page}/>
    {#if page === pages.Songs}
    <Songs category={category} bind:song={song}/>
    {:else if page === pages.Categories}
    <Categories bind:category={category}/>
    {/if}
    <SongBar song={song} bind:playback_state={playback_state}/>
    <OpenMPT song={song} subsong={sequence} isPlaying={playback_state === playback_states.Playing}/>
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