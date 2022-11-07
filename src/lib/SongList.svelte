<script>
  import SongDB from '../db.json';
  import {getContext} from 'svelte';
  import { selectedSongKey } from "../model/player.js";

  export let category = null;

  const selectedSong = getContext(selectedSongKey);

  let hoveredSong = null;

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

<ul>
    {#if category !== null}
        {#each SongDB.Songs[category] as song (song)}
            <li
                    class="{$selectedSong === song || hoveredSong === song ? 'selected' : ''}"
                    on:click={() => $selectedSong = song}
                    on:mouseover={() => hoveredSong = song}
                    on:mouseout={() => hoveredSong = null}>
                { song.indexOf("/") !== -1 ? song.split("/").splice(1).join('/') : song }
            </li>
        {/each}
    {/if}
</ul>
