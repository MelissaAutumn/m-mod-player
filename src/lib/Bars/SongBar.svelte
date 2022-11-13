<script>
  import Bar from "../Base/Bar.svelte";
  import Icon from "../Base/Icon.svelte";
  import {playback_states} from "../../model/player.js";

  export let song = null;
  export let playback_state = playback_states.Paused;

  $: icon_playback_state = (playback_state === playback_states.Playing) ? 'pause' : 'play';

  function onClick() {
    playback_state = (playback_state === playback_states.Playing) ? playback_states.Paused : playback_states.Playing;
  }

  // Account for padding
  const style = {
    bottom: '66px'
  }

</script>
<Bar position="bottom" style={style}>
    <button class="btn-item" on:click={onClick}>
        <Icon type={icon_playback_state}/>
    </button>
    <span class="title">{song?.split('/').splice(1).join('/') ?? ''}</span>
    <span><Icon type="up"/></span>
</Bar>

<style>
    .title {
        font-size: x-large;
    }
</style>