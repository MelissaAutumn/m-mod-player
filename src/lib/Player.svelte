<script>
  import Categories from "./Categories.svelte";
  import OpenMPT from "./OpenMPT.svelte";
  import SongList from "./SongList.svelte";
  import SongBar from "./SongBar.svelte";

  let selectedCategory = null;
  let selectedSong = null;
  let isPlaying = false;

</script>
<div class="main">
  <div class="grid">
    <OpenMPT song={selectedSong} isPlaying={isPlaying}/>
    <div class="categories">
      <h2>Categories</h2>
      <Categories on:category-select={(evt) => selectedCategory = evt.detail.category}/>
    </div>
    <div class="meta-data">

    </div>
    <div class="song-list">
      <h2>Songs</h2>
      <SongList category={selectedCategory} on:song-selected={(evt) => selectedSong = evt.detail.song}/>
    </div>
    <div class="player-bar">
      <SongBar on:playback={(evt) => isPlaying = evt.detail.state}/>
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

    .meta-data {

        display: inline-grid;
        grid-row: 2;
    }

    .categories {

        display: inline-grid;
        grid-column-end: auto;
        grid-row: 1;

    }

    .song-list {
        display: inline-grid;
        overflow: scroll;
        grid-row: span 2;
        height: 80vh;

    }

    .player-bar {
      /* moved inside component */
    }
</style>