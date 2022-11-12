<script>
  import Page from "../Base/Page.svelte";
  import SongDB from "../../db.json"

  export let song = null;
  export let category = null;

  const songs = SongDB.Songs[category];
</script>

<Page>
    <div slot="header">
        <h2>{category}</h2>
    </div>
    {#if songs}
        <table class="table">
            <tr role="rowheader">
                <th>Name</th>
            </tr>
        {#each songs as _song, index}
            <tr role="row">
                <td>
                    <button on:click={() => song = _song} class='btn-item' class:selected={song === _song}>{_song.split('/').splice(1).join('/')}</button>
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