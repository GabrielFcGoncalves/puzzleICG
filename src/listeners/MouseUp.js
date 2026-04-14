export function handleMouseUp(event, ctx) {
    const { interaction, controls, renderer } = ctx;
    interaction.resetAll();
    controls.enabled = true;
    renderer.domElement.classList.remove('grabbing');
}
