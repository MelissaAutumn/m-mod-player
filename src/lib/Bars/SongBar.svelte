<script>
  import Bar from "../Base/Bar.svelte";
  import Icon from "../Base/Icon.svelte";
  import {playback_states} from "../../model/player.js";
  import {song_metadata} from "../../stores/openmptStore.js";
  import {createEventDispatcher} from "svelte";

  export let song = null;
  export let playback_state = playback_states.Paused;

  const dispatch = createEventDispatcher();

  $: icon_playback_state = (playback_state === playback_states.Playing) ? 'pause' : 'play';

  const onClick = (evt) => {
    console.log(evt);
    dispatch('playback-state', {
      playback_state: (playback_state === playback_states.Playing) ? playback_states.Paused : playback_states.Playing
    })
  }

</script>
<Bar position="bottom">
    <button class="btn-item btn-no-radius" on:click={onClick}>
        <Icon type={icon_playback_state}/>
    </button>
    <span class="title">{$song_metadata.title ?? ''}</span>
    <span><Icon type="up"/></span>
</Bar>

<style>
    .title {
        font-size: x-large;
    }
</style>