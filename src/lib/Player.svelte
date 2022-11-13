<script>
  import {
    pages, playback_states
  } from "../model/player.js";
  import SongBar from "./Bars/SongBar.svelte";
  import Songs from "./Pages/Songs.svelte";
  import OpenMPT from "./OpenMPT.svelte";
  import MenuBar from "./Bars/MenuBar.svelte";
  import Categories from "./Pages/Categories.svelte";
  import MediaSession from "./MediaSession.svelte";

  let category = null;
  let song = null;
  let sequence = null;
  let playback_state = playback_states.Paused;
  let page = pages.Categories;
  let audio_element = null;

  // Reset selected sequence if selected song changes
  $: if (song) {
    sequence = -1;
  }

  // This isn't uhh..great.
  $: if (category) {
    page = pages.Songs;
  }

  const onAudioPlaybackChange = (is_playing) => {
    playback_state = is_playing ? playback_states.Playing : playback_states.Paused;
  }

</script>
<div class="main">
    {#if page === pages.Songs}
    <Songs category={category} bind:song={song}/>
    {:else if page === pages.Categories}
    <Categories bind:category={category}/>
    {/if}
    <div class="fixed-overlay">
        <MenuBar bind:page={page}/>
        <SongBar song={song} bind:playback_state={playback_state}/>
    </div>
    <OpenMPT category={category} song={song} sequence={sequence} isPlaying={playback_state === playback_states.Playing} audio_element={audio_element}/>
    <!-- Allows media meta data, need to split up later -->
    <MediaSession category={category} song={song} sequence={sequence} is_playing={playback_state === playback_states.Playing}/>
    <audio on:play={() => onAudioPlaybackChange(true)} on:pause={()=> onAudioPlaybackChange(false)} bind:this={audio_element} controls></audio>
</div>
<style>
    :root {
        --spacing: 24px;
        --min-card-width: 256px;
    }

    .main {
        display: block;
    }

    .fixed-overlay {
        width: 100%;
        position: fixed;
        display: grid;
        left: 0;
        bottom: 0;
    }

     audio {
         display: block;
         position: fixed;
         top: 0;

     }

</style>