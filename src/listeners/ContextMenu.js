export function handleContextMenu(event, ctx) {
    event.preventDefault();
    if (ctx.uiState.isInspecting) {
        ctx.closeInspection();
    }
    ctx.resetZoom();
}
