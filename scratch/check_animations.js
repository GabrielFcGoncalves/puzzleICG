import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const padlockPath = 'file:///home/gabriel/Documents/University/ICG/projeto/puzzleICG/src/models/padlock/scene.gltf';

loader.load(padlockPath, (gltf) => {
    console.log('Animations:', gltf.animations.map(a => a.name));
    process.exit(0);
}, undefined, (err) => {
    console.error(err);
    process.exit(1);
});
