<script>
  import Page from "../Base/Page.svelte";
  import SongDB from "../../db.json"
  import { selected_song_key } from "../../model/player.js";
  import {getContext} from "svelte";

  const songs = SongDB.Songs["Unreal"];

  const song = getContext(selected_song_key);

  const onSongSelect = (_song) => {
    $song = _song;
  }

</script>

<Page>
    <div slot="header">
        <h2>Songs</h2>
    </div>
    {#if songs}
        <div class="table">

            <div class="heading">Name</div>
            <div class="heading">Format</div>

            {#each songs as song, index}
                {@const is_odd = index % 2 === 0 ? 'odd' : 'even'}
                <div class="row {is_odd}">
                    <button on:click={() => onSongSelect(song)} class='btn-item'>{song.split('/').splice(1).join('/')}</button>
                </div>
                <div class="row {is_odd}">
                    {song.split('.').splice(-1).join('').toUpperCase()}
                </div>
            {/each}

        </div>
    {:else}
        <p>No Songs...</p>
    {/if}


</Page>

<style>
    .table {
        display: grid;
        width: 100%;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 24px;
        font-size: large;

    }
    .heading {
        background-color: var(--background-color-alt);
    }
    .row {
        height: 100%;
        width: 100%;
    }
    .odd {
        background-color: var(--background-color-alt);
    }

</style>