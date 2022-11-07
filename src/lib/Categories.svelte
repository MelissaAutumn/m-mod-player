<script>
  import SongDB from '../db.json';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let selectedCategory = null;
  let hoveredSong = null;

  console.log(SongDB);

  const onSelectCategory = (category) => {
    console.log("Selected category",category);
    selectedCategory = category;
    dispatch('category-select', { category: category });
  }

</script>
<style>
    ul, li {
        padding: 0;
    }

    li {
        list-style: none;
        margin-bottom: 2px;
        cursor: pointer;
    }
</style>

<div>
<ul>
    {#each Object.keys(SongDB.Songs) as key (key)}
        <li>
            <h4 on:click={() => onSelectCategory(key)}>{key}</h4>
        </li>
    {/each}
</ul>
</div>