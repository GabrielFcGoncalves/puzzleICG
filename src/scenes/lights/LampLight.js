import * as THREE from 'three';

export function createLampLight() {
    const lampLight = new THREE.PointLight(0xff9900, 35, 10);
    lampLight.position.set(0, 2.3, -4); 
    lampLight.castShadow = true;
    lampLight.shadow.autoUpdate = false; // Static shadow map
    lampLight.shadow.bias = -0.0001;
    lampLight.shadow.normalBias = 0.02;
    lampLight.shadow.mapSize.width = 512;
    lampLight.shadow.mapSize.height = 512;
    return lampLight;
}
