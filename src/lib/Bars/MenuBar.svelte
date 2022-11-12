<script>
  import { pages } from '../../model/player.js';

  import Bar from "../Base/Bar.svelte";
  import Icon from "../Base/Icon.svelte";

  export let page = pages.Categories;
</script>

<Bar  position="bottom">
    <button class:selected={page === pages.Categories} class="btn-item" on:click={() => page = pages.Categories}>
        <Icon type="list"></Icon>
    </button>
    <button class:selected={page === pages.Songs} class="btn-item" on:click={() => page = pages.Songs}>
        <Icon type="play-filled"></Icon>
    </button>
    <button class:selected={page === pages.Queue} class="btn-item" on:click={() => page = pages.Queue}>
        <Icon type="queue"></Icon>
    </button>
</Bar>

<style>

    .selected {
        background-color: var(--accent-colour);
    }

</style>