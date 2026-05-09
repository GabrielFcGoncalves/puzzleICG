import * as THREE from 'three';

/**
 * Creates a dim, warm point light to be placed above the door.
 */
export function createDoorLight() {
    const doorLight = new THREE.PointLight(0xffddaa, 12, 10);
    doorLight.position.set(0, 2, 3.8); // Adjust based on door position
    doorLight.castShadow = false;
    
    // Shadow settings
    doorLight.shadow.bias = -0.002;
    doorLight.shadow.mapSize.width = 512;
    doorLight.shadow.mapSize.height = 512;
    
    return doorLight;
}
