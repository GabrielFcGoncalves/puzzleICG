export function handleContextMenu(event, ctx) {
    event.preventDefault();
    if (ctx.state.isInspecting) {
        ctx.closeInspection();
    } else {
        ctx.resetZoom();
    }
}
