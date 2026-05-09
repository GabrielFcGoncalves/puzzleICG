import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import fs from 'fs';
import { JSDOM } from 'jsdom';

// Minimal polyfill for GLTFLoader in Node
const { window } = new JSDOM();
global.window = window;
global.document = window.document;
global.self = global;
global.File = class {};
global.ProgressEvent = class {};
global.FileReader = class {};

const loader = new GLTFLoader();
const modelPath = '/home/gabriel/Documents/University/ICG/projeto/puzzleICG/src/models/Object.glb';

// We need to read the file as a buffer for Node
const data = fs.readFileSync(modelPath);
const arrayBuffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);

loader.parse(arrayBuffer, '', (gltf) => {
    console.log('Model Nodes:');
    gltf.scene.traverse(node => {
        console.log(`- ${node.name} (${node.type})`);
        if (Object.keys(node.userData).length > 0) {
            console.log(`  userData: ${JSON.stringify(node.userData)}`);
        }
    });

    console.log('\nAnimations:');
    if (gltf.animations && gltf.animations.length > 0) {
        gltf.animations.forEach(anim => {
            console.log(`- ${anim.name}`);
        });
    } else {
        console.log('No animations found.');
    }
    process.exit(0);
}, (err) => {
    console.error(err);
    process.exit(1);
});
