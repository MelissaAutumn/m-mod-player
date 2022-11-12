<script>
  import Page from "../Base/Page.svelte";
  import SongDB from "../../db.json"
  import { selected_song_key, selected_category_key } from "../../model/player.js";
  import {getContext} from "svelte";


  const selected_song = getContext(selected_song_key);
  const selected_category = getContext(selected_category_key);

  const onSongSelect = (_song) => {
    $selected_song = _song;
  }

  const songs = SongDB.Songs[$selected_category];
</script>

<Page>
    <div slot="header">
        <h2>{$selected_category}</h2>
    </div>
    {#if songs}
        <table class="table">
            <tr role="rowheader">
                <th>Name</th>
            </tr>
        {#each songs as song, index}
            <tr role="row">
                <td>
                    <button on:click={() => onSongSelect(song)} class='btn-item' class:selected={$selected_song === song}>{song.split('/').splice(1).join('/')}</button>
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
        grid-template-columns: repeat(1, 1fr);
        display: inline-grid;
        width: 100%;

        border-top: var(--background-colour-alt) 2px solid;
        border-radius: 8px;
    }
    th {
        padding: 0.6em 1.2em;
    }
    button {
        width: 100%;
        overflow: visible;
        text-align: left;
    }
</style>