<script>
  import Page from "../Base/Page.svelte";
  import {patterns, current_row, current_pattern, next_pattern} from "../../stores/openmptStore.js";


  // Grab the current pattern
  $: pattern_data = $patterns[$current_pattern].slice($current_row);
  $: next_pattern_data = $patterns[$next_pattern];
  $: channels = pattern_data[0]?.length;

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
            {#each pattern_data as _row, index}

            <tr style="grid-template-columns: repeat({channels} , 1fr)">
                    {#each _row as _pattern}
                        <td>
                            {_pattern}
                        </td>
                    {/each}
            </tr>
            {/each}
            {#each next_pattern_data as _row, index}
                <tr class="next-pattern-row" style="grid-template-columns: repeat({channels} , 1fr)">
                    {#each _row as _pattern}
                        <td>
                            {_pattern}
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
    .contents {
        width: 100%;
    }
    .table {
        font-family: monospace;
        font-size: 75%;
        width: 100%;

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
        border-left: 1px solid var(--panel-colour);
        border-right: 1px solid var(--panel-colour);
        min-width: max-content;
        padding: 0 4px 0 4px;
    }
</style>