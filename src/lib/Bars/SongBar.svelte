<script>
  import Bar from "../Base/Bar.svelte";
  import Icon from "../Base/Icon.svelte";

  export let song = null;
  export let playback_state = 'paused';

  $: icon_playback_state = (playback_state === 'playing') ? 'pause' : 'play';

  function onClick() {
    playback_state = (playback_state === 'playing') ? 'paused' : 'playing'
  }

  const style = {
    bottom: '64px'
  }

</script>
<Bar position="bottom" style={style}>
    <button class="btn-item" on:click={onClick}>
        <Icon type={icon_playback_state}/>
    </button>
    <span class="title">{song ?? ''}</span>
    <span><Icon type="up"/></span>
</Bar>

<style>
    .title {
        font-size: x-large;
    }
</style>