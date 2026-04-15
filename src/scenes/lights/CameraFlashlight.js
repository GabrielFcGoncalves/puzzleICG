import * as THREE from 'three';

export function createCameraFlashlight(camera) {
    const flashlight = new THREE.SpotLight(0xffd488, 5, 8, Math.PI / 6, 0.5, 2);
    flashlight.castShadow = true; 
    flashlight.shadow.mapSize.width = 512;
    flashlight.shadow.mapSize.height = 512;
    flashlight.shadow.bias = -0.0001;
    flashlight.shadow.normalBias = 0.02;
    
    // Position it at camera center
    flashlight.position.set(0, 0, 0);

    const fTarget = new THREE.Object3D(); 
    fTarget.position.set(0, 0, -1);
    
    flashlight.target = fTarget;

    // Attach to camera so it moves with it
    camera.add(flashlight);
    camera.add(fTarget);

    return flashlight;
}
