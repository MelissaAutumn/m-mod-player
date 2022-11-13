<script>
    export let position = 'top';
    export let style = {};

    if (!style[position]) {
      style[position] = 0;
    }

    // Combine object to string, the .join('') removes `,` that are added by default.
    const style_string = Object.keys(style).map((key) => {
      return `${key}: ${style[key]};`
    }).join('');
</script>

<div class="bar" style={style_string}>
    <div class="content">
        <slot>
            <div> Test Left Content</div>
            <div> Test Centre Content</div>
            <div> Test Right Content</div>
        </slot>
    </div>
</div>
<style>
    .bar {
        background-color: var(--background-colour-alt);
        border-top: var(--panel-colour) 2px solid;
        height: 64px;
        width: 100%;
        position: fixed;
        left: 0;
    }

    .content {
        height: 100%;
        display: grid;
    }

    :global(.content>*) {
        /* Force one column per item, on row 1 */
        align-content: center;
        display: inline-grid;
        grid-column: span 1;
        height: 100%;
        grid-row: 1;
    }
</style>