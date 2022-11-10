<script>
  import Bar from "../Base/Bar.svelte";
  import Icon from "../Base/Icon.svelte";

  import {playback_state_key, selected_song_key} from "../../model/player.js";
  import {getContext} from "svelte";

  const song = getContext(selected_song_key);
  let playback_state = getContext(playback_state_key);
  $: icon_playback_state = ($playback_state === 'playing') ? 'pause' : 'play';

  function onClick() {
    $playback_state = ($playback_state === 'playing') ? 'paused' : 'playing'
  }

</script>
<Bar position="bottom">
    <button class="btn-item" on:click={onClick}>
        <Icon type={icon_playback_state}/>
    </button>
    <span class="title">{$song ?? ''}</span>
    <span><Icon type="up"/></span>
</Bar>

<style>
    .title {
        font-size: x-large;
    }
</style>