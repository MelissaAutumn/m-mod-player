<script>
  import { pages } from '../../model/player.js';

  import Bar from "../Base/Bar.svelte";
  import Icon from "../Base/Icon.svelte";
  import {createEventDispatcher} from "svelte";

  export let page = pages.Categories;

  const dispatch = createEventDispatcher();

  const onPageChange = (page) => {
    dispatch('page-change', {
      page: page
    });
  }

</script>


<Bar position="bottom">
    <button class:selected={page === pages.Categories} class="btn-item btn-no-radius" on:click={() => onPageChange(pages.Categories)}>
        <Icon type="list"></Icon>
    </button>
    <button class:selected={page === pages.Songs} class="btn-item btn-no-radius" on:click={() => onPageChange(pages.Songs)}>
        <Icon type="play-filled"></Icon>
    </button>
    <button class:selected={page === pages.Patterns} class="btn-item btn-no-radius" on:click={() => onPageChange(pages.Patterns)}>
        <Icon type="queue"></Icon>
    </button>
</Bar>

<style>

    .selected {
        background-color: var(--accent-colour);
    }


</style>