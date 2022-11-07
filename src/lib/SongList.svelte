<script>
  import SongDB from '../db.json';
  import {createEventDispatcher} from 'svelte';

  const dispatch = createEventDispatcher();

  export let category = null;

  let selectedSong = null;
  let hoveredSong = null;

  const onPlay = (song) => {
    selectedSong = song;
    dispatch('song-selected', {song: song});
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

    .selected {
        color: #646cff;
    }

    .selected:hover {
        color: #747bff;
    }

</style>

<ul>
    {#if category !== null}
        {#each SongDB.Songs[category] as song (song)}
            <li
                    class="{selectedSong === song || hoveredSong === song ? 'selected' : ''}"
                    on:click={() => onPlay(song)}
                    on:mouseover={() => hoveredSong = song}>
                { song.indexOf("/") !== -1 ? song.split("/").splice(1).join('/') : song }
            </li>
        {/each}
    {/if}
</ul>
