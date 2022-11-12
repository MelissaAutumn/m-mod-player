<script>
  import play_button from "../../assets/play-filled-alt.svg";
  import pause_button from "../../assets/pause-filled.svg";
  import chevron_up from '../../assets/chevron-up.svg';
  import chevron_down from '../../assets/chevron-down.svg';
  import menu from '../../assets/menu.svg';
  import list from '../../assets/list.svg';
  import playlist from '../../assets/playlist.svg';
  import queue from '../../assets/query-queue.svg';
  import skip_foward from '../../assets/skip-forward-filled.svg';
  import skip_back from '../../assets/skip-back-filled.svg';
  import play_filled_button from '../../assets/play-filled.svg';

  export let type = null;
  export let size = '48px';

  let iconSVG = null;
  const iconMap = {
    'play': play_button,
    'pause': pause_button,
    'up': chevron_up,
    'down': chevron_down,
    'menu': menu,
    'list': list,
    'playlist': playlist,
    'queue': queue,
    'skip-forward': skip_foward,
    'skip-back': skip_back,
    'play-filled': play_filled_button,
  }

  $: if (type) {
    iconSVG = iconMap[type] ?? null;
  }

</script>
<span class="icon-container" style="width: {size}; height: {size}">
  <img src={iconSVG} alt={type} />
</span>
<style>
  .icon-container {
    display: inline-block;
    margin: auto;
  }
  img {
    height: 100%;
    width: 100%;
  }
</style>
