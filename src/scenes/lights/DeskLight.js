import * as THREE from 'three';

export function createDeskLight(scene) {
    const deskLight = new THREE.SpotLight(0xa1874f, 100, 15, Math.PI/6, 0.5, 1);
    deskLight.position.set(0, 4.5, 3.2); 
    deskLight.target.position.set(0, -1, -1.5); 
    scene.add(deskLight.target);
    deskLight.castShadow = true;
    deskLight.shadow.autoUpdate = true;
    deskLight.shadow.bias = -0.0001;
    deskLight.shadow.normalBias = 0.02;
    deskLight.shadow.mapSize.width = 512;
    deskLight.shadow.mapSize.height = 512;
    return deskLight;
}
