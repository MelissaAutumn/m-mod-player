<script>
  import Page from "../Base/Page.svelte";
  import SongDB from "../../db.json"
  import {createEventDispatcher} from "svelte";

  export let song = null;
  export let sequence = -1;
  export let category = null;

  const dispatch = createEventDispatcher()

  const onSelect = (song, sequence) => {
    dispatch('song-select', {
      song: song,
      sequence: sequence ?? -1,
    })
  }

  // Do a little sorting
  const songs = SongDB[category].sort((a, b) => {
    const title_a = a?.meta_data?.title ?? a.file_name;
    const title_b = b?.meta_data?.title ?? b.file_name;
    return title_a.trim().toUpperCase() > title_b.trim().toUpperCase();
  });
</script>

<Page>
    <div slot="header">
        <h2>{category}</h2>
    </div>
    {#if songs}
        <table class="table">
        {#each songs as _song, index}
            <tr>
                <td>
                    <button on:click={() => onSelect(_song)} class='btn-item btn-song' class:selected={song === _song}>{_song.meta_data.title || _song.file_name}</button>
                </td>
            </tr>
            <!-- If we have more than one sequence, list them too! (Hopefully I can find a nicer way of displaying this data.) -->
            {#if _song.sequences.length > 1}
                {#each _song.sequences as _sequence, index}
                    <tr>
                        <td>
                            <button on:click={() => onSelect(_song, index)} class='btn-item btn-song' class:selected={song === _song && sequence === index}>{`${_song.meta_data.title || _song.file_name} - Sequence ${index+1}`}</button>
                        </td>
                    </tr>
                {/each}
            {/if}
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
    .btn-song {
        width: 100%;
        overflow: visible;
        text-align: left;
        padding: var(--button-padding);
    }
</style>