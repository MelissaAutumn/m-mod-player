<script>
  import {songMetadata} from "./stores/openmptStore.js";

  import Counter from './lib/Counter.svelte'
  import OpenMPT from "./lib/OpenMPT.svelte";
  import Library from "./lib/Library.svelte";

  let currentSong = null;
  let songMetaData = {};

  const onClick = (evt) => {
    currentSong = evt.detail.song;
  }

  songMetadata.subscribe( (value) => {
    songMetaData = value;
  });

</script>

<main>
  <h1>Vite + Svelte</h1>

  <h2>
    { songMetaData.title ?? 'No song selected' }
  </h2>

  <OpenMPT song={currentSong}/>

  <div class="card">
    <Counter />
  </div>

  <Library on:play={onClick}/>

  <p class="read-the-docs">
    Click on the Vite and Svelte logos to learn more
  </p>

</main>

<style>
  .read-the-docs {
    color: #888;
  }
</style>
