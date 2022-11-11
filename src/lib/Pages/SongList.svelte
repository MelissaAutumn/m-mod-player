<script>
  import Page from "../Base/Page.svelte";
  import SongDB from "../../db.json"
  import { selected_song_key } from "../../model/player.js";
  import {getContext} from "svelte";

  const songs = SongDB.Songs["Unreal"];

  const selected_song = getContext(selected_song_key);

  const onSongSelect = (_song) => {
    $selected_song = _song;
  }

</script>

<Page>
    <div slot="header">
        <h2>Songs</h2>
    </div>
    {#if songs}
        <table class="table">
            <tr role="rowheader">
                <th>Name</th>
                <th>Format</th>
            </tr>
        {#each songs as song, index}
            {@const is_odd = index % 2 === 0}
            <tr role="row">
                <td class:odd={is_odd}>
                    <button on:click={() => onSongSelect(song)} class='btn-item' class:selected={$selected_song === song}>{song.split('/').splice(1).join('/')}</button>
                </td>
                <td class:odd={is_odd}>
                    {song.split('.').splice(-1).join('').toUpperCase()}
                </td>
            </tr>
        {/each}
        </table>
    {:else}
        <p>No Songs...</p>
    {/if}


</Page>

<style>
    .table {
        font-size: large;
        width: 100%;
    }
    tr {
        grid-template-columns: repeat(2, 1fr);
        display: inline-grid;
        width: 100%;
    }
    button {
        width: 100%;
        overflow: visible;
    }
    /*
    .table {
        display: grid;
        width: 100%;
        grid-template-columns: repeat(2, 1fr);
        grid-gap: 24px;
        font-size: large;

    }
    .heading {
        background-color: var(--background-colour-alt);
    }
    .row {
        height: 100%;
        width: 100%;
    }
     */
    .odd {
        background-color: var(--background-colour-alt);
    }

</style>