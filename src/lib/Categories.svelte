<script>
  import SongDB from '../db.json';
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  let selectedCategory = null;
  let hoveredCategory = null;

  const onSelectCategory = (category) => {
    selectedCategory = category;
    dispatch('category-select', {category: category});
  }

</script>
<style>
    ul, li {
        padding: 0;
    }

    li {
        list-style: none;
        margin-bottom: 16px;
        font-size: 16pt;
        cursor: pointer;
    }

    a {
        color: #f9f9f9;
    }
</style>

<div>
    <ul>
        {#each Object.keys(SongDB.Songs) as key (key)}
            <li>
                <a
                        class="{selectedCategory === key || hoveredCategory === key ? 'selected' : ''}"
                        on:click={() => onSelectCategory(key)}
                        on:mouseover={() => hoveredCategory = key}
                        on:mouseout={() => hoveredCategory = null}>
                {key}
                </a>
            </li>
        {/each}
    </ul>
</div>

