<div class="bar">
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
        background-color: #213547;
        height: 64px;
        width: 100%;
        position: fixed;
        bottom: 0;
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