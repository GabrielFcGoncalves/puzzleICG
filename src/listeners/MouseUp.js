export function handleMouseUp(event, ctx) {
    if (ctx.uiState.isInspecting) {
        if (ctx.inspectionScene.handleMouseUp(event)) {
            return;
        }
    }

    const { interaction, controls, renderer } = ctx;
    interaction.resetAll();
    controls.enabled = true;
    renderer.domElement.classList.remove('grabbing');
}
