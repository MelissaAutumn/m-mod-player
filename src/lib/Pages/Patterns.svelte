<script>
  import Page from "../Base/Page.svelte";
  import {patterns, current_row, current_pattern, next_pattern, highlights} from "../../stores/openmptStore.js";

  // Style color codes that will be applied to our notes
  const highlight_pattern_map = {
/*
    " " : empty/space
    "." : empty/dot
    "n" : generic note
    "m" : special note
    "i" : generic instrument
    "u" : generic volume column effect
    "v" : generic volume column parameter
    "e" : generic effect column effect
    "f" : generic effect column parameter
*/
    // Colour-scheme mostly taken from OpenMPT's Blue (FT2) theme. (It doesn't line up 1:1)
    ' ': '',
    '.': 'rgb(224,224,64)',
    'n': 'rgb(224,224,64)',
    'm': 'rgb(224,224,64)',
    'i': 'rgb(255,255,0)',
    'u': 'rgb(0,255,0)',
    'v': 'rgb(0,255,0)',
    'e': 'rgb(0,255,255)',
    'f': 'rgb(0,255,255)',
  }

  // Grab the current pattern
  $: pattern_data = $patterns[$current_pattern].slice($current_row);
  $: highlight_data = $highlights[$current_pattern].slice($current_row);
  $: next_pattern_data = $patterns[$next_pattern];
  $: channels = pattern_data[0]?.length;

  const process_highlight = (pattern, highlight) => {
    let highlighted_pattern = [];


    for (let i = 0; i < pattern.length; i++) {
      const highlight_character = highlight[i];
      const current_character = pattern[i];
      const rgb_val = highlight_pattern_map[highlight_character] ?? '';
      let val = '';
      if (rgb_val) {
        val += `<span style="color: ${rgb_val}">`;
      }
      val += current_character;
      if (rgb_val) {
        val += '</span>';
      }
      highlighted_pattern.push(val);
    }


    return highlighted_pattern.join('');
  }

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
                    {#each _row as _pattern, index2}
                        <td>
                            {@html process_highlight(_pattern, highlight_data[index][index2])}
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