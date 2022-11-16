<script>
  import Page from "../Base/Page.svelte";
  import SongDB from "../../db.json"
  import {createEventDispatcher} from "svelte";

  export let song = null;
  export let category = null;

  const dispatch = createEventDispatcher()

  const onSelect = (song) => {
    dispatch('song-select', {
      song: song,
    })
  }

  const songs = SongDB.Songs[category];
</script>

<Page>
    <div slot="header">
        <h2>{category}</h2>
    </div>
    {#if songs}
        <table class="table">
        {#each songs as _song, index}
            <tr role="row">
                <td>
                    <button on:click={() => onSelect(_song)} class='btn-item btn-song' class:selected={song === _song}>{_song.split('/').splice(1).join('/') || _song}</button>
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
    .btn-song {
        width: 100%;
        overflow: visible;
        text-align: left;
        padding: var(--button-padding);
    }
</style>