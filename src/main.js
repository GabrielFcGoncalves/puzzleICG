import { World } from './core/World.js';

/**
 * Entry point of the Three.js Application.
 * Initializes the World orchestrator which sets up scenes, store, and systems.
 */
document.addEventListener('DOMContentLoaded', () => {
    new World();
});
