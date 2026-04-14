export function handleResize(event, ctx) {
    const { camera, renderer, handleResize: resizeFn } = ctx;
    resizeFn(camera, renderer);
}
