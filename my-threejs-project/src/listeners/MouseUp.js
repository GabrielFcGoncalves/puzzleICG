export function handleMouseUp(event, ctx) {
    const { state, controls, renderer } = ctx;
    state.isDragging = false;
    state.isRotatingFooting = false;
    state.isTurningKey = false;
    state.draggedDrawerIndex = -1;
    state.rotatedFooting = null;
    controls.enabled = true;
    renderer.domElement.classList.remove('grabbing');
}
