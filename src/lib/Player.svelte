<script>
  import Categories from "./Categories.svelte";
  import OpenMPT from "./OpenMPT.svelte";
  import SongList from "./SongList.svelte";
  import SongBar from "./SongBar.svelte";

  let selectedCategory = null;
  let selectedSong = null;
  let selectedSubSong = -1;
  let isPlaying = false;

  const onSongSelect = (song) => {
    selectedSong = song;
    onSubSongSelect(-1);
  };
  const onSubSongSelect = (subsong) => {
    selectedSubSong = subsong;
  }

</script>
<div class="main">
    <div class="grid">
        <OpenMPT subsong={selectedSubSong} song={selectedSong} isPlaying={isPlaying}/>
        <div class="categories">
            <h2>Categories</h2>
            <Categories on:category-select={(evt) => selectedCategory = evt.detail.category}/>
        </div>
        <div class="song-list">
            <h2>Songs</h2>
            <SongList category={selectedCategory} on:song-selected={(evt) => onSongSelect(evt.detail.song)}/>
        </div>
        <div class="player-bar">
            <SongBar on:playback={(evt) => isPlaying = evt.detail.state} on:subsong-select={(evt) => onSubSongSelect(evt.detail.subsong)}/>
        </div>
    </div>
</div>
<style>
    :root {
        --spacing: 24px;
        --min-card-width: 256px;
    }

    .main {
        display: block;
    }

    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--min-card-width), 2fr));
        grid-column-gap: var(--spacing);
        grid-row-gap: var(--spacing);

    }

    .categories {
        height: 80vh;
        display: inline-grid;
        grid-column-end: auto;
        grid-row: 1;
        background-color: var(--background-color-main);
        border-radius: 8px;
    }

    .song-list {
        display: inline-grid;
        overflow: scroll;
        grid-row: span 2;
        height: 80vh;
        background-color: var(--background-color-main);

        border-radius: 8px;
    }

    .player-bar {
        /* moved inside component */
    }
</style>