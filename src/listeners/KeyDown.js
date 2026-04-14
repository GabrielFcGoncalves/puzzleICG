export function handleKeyDown(event, ctx) {
    const { state, overlayElement } = ctx;
    if (event.code === 'Space') {
        state.isEthereal = !state.isEthereal;
        overlayElement.classList.toggle('active-ethereal');
    }
    if (event.code === 'KeyH') {
        state.isHintMode = !state.isHintMode;
        const msg = state.isHintMode ? "HINT MODE: ON" : "HINT MODE: OFF";
        ctx.statusElement.innerText = `STATUS: ${msg}`;
    }
    if (event.code === 'Enter') {
        ctx.detachCamera();
    }
    if (event.code === 'Escape') {
        state.camClampingDisabled = false;
        ctx.resetZoom();
    }
}
