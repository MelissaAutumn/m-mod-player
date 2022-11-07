<script>
  import SubSongList from "./SubSongList.svelte";

  export let metaData = {};

  // Remove any new lines at the start!
  const regex = /(^\n*)/gm;
  const message = metaData?.message?.replace(regex, '') ?? '';

  const information = [
    ['Title', metaData?.title],
    ['Artist', metaData?.artist],
    ['Date', metaData?.date],
    ['Tracker Used', metaData?.tracker],
    ['Tracker Format', metaData?.typeLong],
    ['Original Format', metaData?.originalTypeLong],
    ['Container Format', metaData?.containerLong],
  ];

  console.log(metaData);
  console.log(information);
</script>

<div id="main">
    <div class="column information">
        <h2>Information</h2>
        <ul>
            {#each information as item }
                {#if item[1]}
                    <li><b>{item[0]}:</b> {item[1]}</li>
                {/if}
            {/each}
        </ul>
    </div>
    <div class="column">
        <h2>SubSongs</h2>
        <SubSongList/>
    </div>
    <div class="column">
        <h2>Comments</h2>
        <p>{message ?? ''}</p>
    </div>
</div>

<style>
    :root {
        --spacing: 24px;
        --min-card-width: 256px;
    }

    #main {
        height: 100vh;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(var(--min-card-width), 1fr));
        grid-column-gap: var(--spacing);
        grid-row-gap: var(--spacing);
        padding: 2em;
        backdrop-filter: blur(10px);
    }

    .column {
        grid-column: span 1;
    }

    .information {
        grid-column: span 1;
    }

    p {
        height: 80vh;
        overflow: scroll;
        white-space: pre-wrap;
    }

    ul {
        text-align: left;
        list-style: none;
    }
</style>