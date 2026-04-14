import * as THREE from 'three';

export function createLeftLight() {
    const leftLight = new THREE.PointLight(0xffaa55, 40, 8);
    leftLight.position.set(-4, 1.8, -1);
    leftLight.castShadow = true;
    leftLight.shadow.autoUpdate = false; // Static shadow map
    leftLight.shadow.bias = -0.0001;
    leftLight.shadow.normalBias = 0.02;
    leftLight.shadow.mapSize.width = 512;
    leftLight.shadow.mapSize.height = 512;
    return leftLight;
}
