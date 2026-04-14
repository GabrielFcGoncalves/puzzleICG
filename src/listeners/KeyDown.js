export function handleKeyDown(event, ctx) {
    const { uiState, cameraState, overlayElement } = ctx;
    if (event.code === 'Space') {
        uiState.isEthereal = !uiState.isEthereal;
        overlayElement.classList.toggle('active-ethereal');
    }
    if (event.code === 'KeyH') {
        uiState.isHintMode = !uiState.isHintMode;
        const msg = uiState.isHintMode ? "HINT MODE: ON" : "HINT MODE: OFF";
        ctx.statusElement.innerText = `STATUS: ${msg}`;
    }
    if (event.code === 'Enter') {
        ctx.detachCamera();
    }
    if (event.code === 'Escape') {
        cameraState.camClampingDisabled = false;
        ctx.resetZoom();
    }
}
