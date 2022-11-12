<script>
  import Page from "../Base/Page.svelte";
  import SongDB from "../../db.json"
  import { selected_category_key } from "../../model/player.js";
  import {getContext} from "svelte";

  const categories = SongDB.Songs;

  const selected_category = getContext(selected_category_key);

</script>

<Page>
    <div slot="header">
        <h2>Categories</h2>
    </div>
    {#if categories}
        <table class="table">
            <tr role="rowheader">
                <th>Name</th>
            </tr>
            {#each Object.keys(categories) as category, index}
                <tr role="row">
                    <td>
                        <button on:click={() => $selected_category = category} class='btn-item' class:selected={$selected_category === category}>{category.split('/').splice(0).join('/')}</button>
                    </td>
                </tr>
            {/each}
        </table>
    {:else}
        <p>No Categories...</p>
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