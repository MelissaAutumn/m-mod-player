<script>
  import {getContext} from 'svelte';
  import { selectedSubSongKey } from "../model/player.js";

  export let subSongList = [];
  let adjustedSubSongList = [];

  const selectedSong = getContext(selectedSubSongKey);
  if (!selectedSong) {
    console.warn(`No ${selectedSubSongKey.description} context!`);
  }

  let hovered = null;

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
                        class="{$selectedSong === index-1 || hovered === index-1 ? 'selected' : ''}"
                        on:click={() => $selectedSong = index-1}
                        on:mouseover={() => hovered = index-1}
                        on:mouseout={() => hovered = null}>
                    {name}
                </h4>
            </li>
        {/each}
    </ul>
</div>

