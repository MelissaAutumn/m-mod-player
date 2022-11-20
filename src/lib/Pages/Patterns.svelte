<script>
  import Page from "../Base/Page.svelte";
  import {
    patterns,
    current_row,
    current_pattern,
    next_pattern,
    channel_volume
  } from "../../stores/openmptStore.js";

  // Grab the current pattern
  $: pattern_data = $patterns.length > 0 ? $patterns[$current_pattern].slice($current_row) : [];
  $: next_pattern_data = $patterns.length > 0 ? $patterns[$next_pattern] : [];
  $: channels = pattern_data[0]?.length ?? 0;

  const onChannelMute = (channel) => {
    $channel_volume[channel] = $channel_volume[channel] === 1.0 ? 0.0 : 1.0;
  };
</script>

<Page>
    <div slot="header">
        <h2>Patterns</h2>
    </div>
    Pattern: {$current_pattern}
    Next Pattern: {$next_pattern}
    Row: {$current_row}
    Channels: {channels}
    <div class="contents">
    {#if $patterns}
        <table class="table">
            <tr class="header-row" style="grid-template-columns: repeat({channels} , 1fr)">
                {#each [...Array(channels).keys()] as _channel}
                    <td><button on:click={() => onChannelMute(_channel)}>Channel {_channel}</button></td>
                {/each}
            </tr>
            {#each pattern_data as _row, index}
                <tr style="grid-template-columns: repeat({channels} , 1fr)">
                    {#each _row as _pattern, index2}
                        <td>
                            {@html _pattern}
                        </td>
                    {/each}
                </tr>
            {/each}
            {#each next_pattern_data as _row, index}
                <tr class="next-pattern-row" style="grid-template-columns: repeat({channels} , 1fr)">
                    {#each _row as _pattern}
                        <td>
                            {@html _pattern}
                        </td>
                    {/each}
                </tr>
            {/each}
        </table>
    {:else}
        <p>No Patterns...</p>
    {/if}
    </div>

</Page>

<style>
    :root {
        --border-style: 1px solid var(--panel-colour);
    }
    .contents {
        width: 100%;

    }
    .table {
        font-family: monospace;
        font-size: 75%;
        width: 100%;

    }
    .header-row {
        border-bottom: var(--border-style);
        width: 100%;
    }
    .muted {
        color: grey;
    }
    .next-pattern-row {
        color: grey;
    }
    tr {
        display: inline-grid;
        width: 100%;
        line-height: 24pt;

    }
    td {
        border-left: var(--border-style);
        border-right: var(--border-style);
        min-width: max-content;
        padding: 0 4px 0 4px;
    }
</style>