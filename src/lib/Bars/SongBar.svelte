<script>
import BottomBar from "../Base/BottomBar.svelte";
import Icon from "../Base/Icon.svelte";

    let song_title = "Default Song";
    let is_playing = false;

</script>
<BottomBar>
    <span><Icon type={ is_playing ? "play" : "pause" }/></span>
    <span class="title">{song_title}</span>
    <span><Icon type="up"/></span>
</BottomBar>

<style>
    .title {
        font-size: x-large;
    }
</style>