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
        height: 100vh;
        width: 100%;
    }

    .content {
        background-color: var(--background-color-main);
    }
</style>