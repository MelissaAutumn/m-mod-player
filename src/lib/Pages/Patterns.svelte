<script>
  import Page from "../Base/Page.svelte";
  import {patterns, current_row, current_pattern} from "../../stores/openmptStore.js";


  // Grab the current pattern
  $: pattern_data = $patterns[$current_pattern].slice($current_row);
  $: channels = pattern_data[0]?.length;

</script>

<Page>
    <div slot="header">
        <h2>Patterns</h2>
    </div>
    {$current_pattern}
    {$current_row}
    {channels}
    {#if $patterns}
        <table class="table">
            <tr style="grid-template-columns: repeat({channels} , 1fr)">
                {#each pattern_data as _row, index}
                    {#each _row as _pattern}
                        <td>
                            {_pattern}
                        </td>
                    {/each}
                {/each}
            </tr>
        </table>
    {:else}
        <p>No Patterns...</p>
    {/if}


</Page>

<style>
    .table {
        font-family: monospace;
        font-size: x-small;
        width: 100%;
    }
    tr {
        /*grid-template-columns: repeat(1, 1fr);*/
        display: inline-grid;
        width: 100%;

        border-top: var(--background-colour-alt) 2px solid;
        border-radius: 8px;
    }
    td {
        border-left: 1px solid var(--panel-colour);
        border-right: 1px solid var(--panel-colour);
    }
    .btn-category {
        width: 100%;
        overflow: visible;
        text-align: left;
        padding: var(--button-padding);
    }
</style>