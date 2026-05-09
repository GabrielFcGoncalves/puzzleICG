import * as THREE from 'three';

export function createAmbientLight() {
    return new THREE.AmbientLight(0x666699, 1); // Increased for better visibility
}
