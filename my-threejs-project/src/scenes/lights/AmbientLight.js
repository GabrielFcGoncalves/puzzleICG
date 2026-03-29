import * as THREE from 'three';

export function createAmbientLight() {
    return new THREE.AmbientLight(0x666699, 1.2); // Much brighter ambiance
}
