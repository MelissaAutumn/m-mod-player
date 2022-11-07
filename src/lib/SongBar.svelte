<script>
  import {songMetadata as songMetadataStore, subSongData as subSongDataStore} from "../stores/openmptStore.js";
  import {createEventDispatcher} from 'svelte';

  import Icon from "./Icon.svelte";
  import SongPanel from "./SongPanel.svelte";

  const dispatch = createEventDispatcher();

  let songInfoPanelUp = false;
  let isPlaying = false;
  let songMetaData = {};
  let subSongData = [];

  songMetadataStore.subscribe((value) => {
    songMetaData = value;
  });

  subSongDataStore.subscribe((value) => {
    subSongData = value;
  })

  const onPlayPause = () => {
    isPlaying = !isPlaying;

    dispatch('playback', {
      state: isPlaying
    })
  }
  const togglePanel = () => {
    songInfoPanelUp = !songInfoPanelUp;
  }
</script>

<div id="bar" class={songInfoPanelUp ? 'panel-is-up':''}>
    <div id="controls">
    <span class="play-icon" on:click={onPlayPause}>
      {#if isPlaying}
        <Icon type="pause"/>
      {:else}
        <Icon type="play"/>
      {/if}
    </span>
        <h2 class="song-title">
            { songMetaData.title ?? 'No song selected' }
        </h2>
        <span class="up-icon" on:click={togglePanel}>
      {#if songInfoPanelUp}
        <Icon type="down"/>
      {:else}
        <Icon type="up"/>
      {/if}
    </span>
    </div>
    {#if songInfoPanelUp}
        <div class="panel">
            <SongPanel metaData={songMetaData} subSongs={subSongData} on:subsong-select/>
        </div>
    {/if}
</div>

<style>
    #bar {
        background-color: #213547;
        display: inline-grid;
        height: 64px;
        width: 100%;
        position: fixed;
        bottom: 0;
        left: 0;
    }

    .panel-is-up {
        bottom: initial;
        top: 0;
    }

    #controls {
        padding-right: 2em;
        padding-left: 2em;
        display: flex;
    }

    .song-title {
        position: relative;
        width: 80%;
        z-index: 10;
        line-height: normal;
    }

    .play-icon {
        display: inline-flex;
        position: relative;
        height: 64px;
        float: left;
        width: 10%;
        z-index: 10;
        cursor: pointer;
    }

    .up-icon {
        display: inline-flex;
        position: relative;
        height: 64px;
        float: right;
        width: 10%;
        z-index: 10;
        cursor: pointer;
    }

    .panel {
        pointer-events: all;
        background-color: rgba(33, 53, 71, 0.90);
        position: fixed;
        height: 100%;
        width: 100%;
        margin-top: 64px;
    }
</style>