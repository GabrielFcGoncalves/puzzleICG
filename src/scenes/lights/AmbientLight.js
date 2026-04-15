import * as THREE from 'three';

export function createAmbientLight() {
    return new THREE.AmbientLight(0x666699, 0.2); // Lowered to make shadows pop
}
