<script>
  import Bar from "../Base/Bar.svelte";
  import Icon from "../Base/Icon.svelte";

  let style = {
    width: '10%'
  };

</script>

<Bar style={style}  position="top">
    <button class="btn-item">
        <Icon type="menu"></Icon>
    </button>
</Bar>

<style>

</style>