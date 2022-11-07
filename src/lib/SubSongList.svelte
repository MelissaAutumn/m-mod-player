<script>
  import SongDB from '../db.json';
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  export let subSongList = [];
  let adjustedSubSongList = [];

  let selected = -1;
  let hovered = null;

  const onSelect = (subsong) => {
    selected = subsong;
    dispatch('subsong-select', {subsong: subsong});
  }

  // We'll have to subtract one from everything to get -1 = ALL
  $: {
    // Clone the array
    adjustedSubSongList = subSongList.slice(0);
    adjustedSubSongList.splice(0, 0, "All Sequences");
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
</style>

<div>
    <ul>
        {#each adjustedSubSongList as name, index (index)}
            <li>
                <h4
                        class="{selected === index-1 || hovered === index-1 ? 'selected' : ''}"
                        on:click={() => onSelect(index-1)}
                        on:mouseover={() => hovered = index-1}
                        on:mouseout={() => hovered = null}>
                    {name}
                </h4>
            </li>
        {/each}
    </ul>
</div>

