<script>
  import SongDB from '../db.json';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  let selectedSong = null;
  let hoveredSong = null;

  console.log(SongDB);

  const onPlay = (song) => {
    selectedSong = song;
    dispatch('play', { song: song });
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
    {#each Object.keys(SongDB.Songs) as key (key)}
        <li>
            <h4>{key}</h4>
            <ul>
                {#each SongDB.Songs[key] as song (song)}
                    <li
                            class="{selectedSong === song || hoveredSong === song ? 'selected' : ''}"
                            on:click={() => onPlay(song)}
                            on:mouseover={() => hoveredSong = song}>
                        { song.indexOf("/") !== -1 ? song.split("/").splice(1).join('/') : song }
                    </li>
                {/each}
            </ul>
        </li>
    {/each}
</ul>