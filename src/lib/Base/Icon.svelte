<script>
  import playButton from "../../assets/play-filled-alt.svg";
  import pauseButton from "../../assets/pause-filled.svg";
  import chevronUp from '../../assets/chevron-up.svg';
  import chevronDown from '../../assets/chevron-down.svg';

  export let type = null;
  export let size = '48px';

  let iconSVG = null;
  const iconMap = {
    'play': playButton,
    'pause': pauseButton,
    'up': chevronUp,
    'down': chevronDown,
  }

  if (type) {
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
