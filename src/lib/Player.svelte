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
  import Patterns from "./Pages/Patterns.svelte";

  let category = null;
  let song = null;
  let sequence = null;
  let playback_state = playback_states.Paused;
  let page = pages.Categories;
  let audio_element = null;

  $: if (page) {
    window.scrollTo(0, 0);
  }

  // Event handlers
  const onSongSelect = (evt) => {
    song = evt.detail?.song;
    sequence = evt.detail?.sequence ?? -1;
  }
  const onCategorySelect = (evt) => {
    category = evt.detail?.category;
    page = pages.Songs;
  }
  const onPlaybackState = (evt) => {
    playback_state = evt.detail?.playback_state;
  }
  const onPageChange = (evt) => {
    page = evt.detail?.page;
  }
  // For audio element only!
  const onAudioToggle = (state) => {
    playback_state = state;
  }

</script>
<div class="main">
    <!-- Pages -->
    {#if page === pages.Songs}
        <Songs
            on:song-select={onSongSelect}
            sequence={sequence}
            category={category}
            song={song}
        />
    {:else if page === pages.Categories}
        <Categories
            on:category-select={onCategorySelect}
            category={category}
        />
    {:else if page === pages.Patterns}
        <Patterns
            />

    {/if}

    <!-- Bottom Bar -->
    <div class="fixed-overlay">
        <MenuBar on:page-change={onPageChange} page={page} />
        <SongBar on:playback-state={onPlaybackState} playback_state={playback_state} />
    </div>

    <!-- "Invisible" media comps -->
    <OpenMPT
        isPlaying={playback_state === playback_states.Playing}
        audio_element={audio_element}
        sequence={sequence}
        category={category}
        song={song}
    />
    <!-- Allows media meta data, need to split up later -->
    <MediaSession
        is_playing={playback_state === playback_states.Playing}
        sequence={sequence}
        category={category}
        song={song}
    />
    <audio
        on:play={() => onAudioToggle(playback_states.Playing)}
        on:pause={()=> onAudioToggle(playback_states.Paused)}
        bind:this={audio_element}
    ></audio>
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