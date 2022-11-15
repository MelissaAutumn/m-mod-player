<script>
  import Page from "../Base/Page.svelte";
  import SongDB from "../../db.json"
  import {createEventDispatcher} from "svelte";

  const categories = SongDB.Songs;
  export let category = null;

  const dispatch = createEventDispatcher()
  const onSelect = (category) => {
    dispatch('category-select', {
      category: category,
    })
  }

</script>

<Page>
    <div slot="header">
        <h2>Categories</h2>
    </div>
    {#if categories}
        <table class="table">
            {#each Object.keys(categories) as _category, index}
                <tr role="row">
                    <td>
                        <button on:click={() => onSelect(_category)} class='btn-item btn-category' class:selected={category === _category}>{_category.split('/').splice(0).join('/')}</button>
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
    .btn-category {
        width: 100%;
        overflow: visible;
        text-align: left;
        padding: var(--button-padding);
    }
</style>