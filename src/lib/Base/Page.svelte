<div class="page">
    <header class="header-and-footer">
        <slot name="header"></slot>
    </header>
    <div class="content">
        <slot></slot>
    </div>
    <footer class="header-and-footer">
        <slot name="footer"></slot>
    </footer>
</div>

<style>
    .page {
        min-height: 100vh;
        height: 100%;
        width: 100%;
        /* Hardcoded for now! */
        margin-bottom: 15%;
    }

    .content {
        background-color: var(--background-color-main);
    }
</style>