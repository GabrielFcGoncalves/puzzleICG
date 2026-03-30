import * as THREE from 'three';
import { ModelLoader } from '../utils/ModelLoader.js';
import { Item } from './Item.js';

export class Flashlight extends Item {
    constructor(loadingManager) {
        super('Old Flashlight');
        this.loadingManager = loadingManager || new THREE.LoadingManager();
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group.userData.isSmallProp = true;
        this.init();
    }

    async init() {
        // --- Models ---
        const path = new URL('../models/Flashlight/scene.gltf', import.meta.url).href;
        
        try {
            const gltf = await this.modelLoader.load(path, { shadows: true, logNames: true });
            const model = gltf.scene;
            
            // Adjust model (The model might need scaling and centering)
            model.scale.set(0.0019, 0.0019, 0.0019);
            model.rotation.y = -Math.PI / 2; // Front face adjustment
            model.position.set(0, -0.11, 0);

            this.group.add(model);
        } catch (error) {
            console.error('Failed to load Flashlight model:', error);
        }

        // --- Materials (for the switch/hitbox) ---
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8 });

        // --- Switch (Simplified) ---
        const sw = new THREE.Mesh(
            new THREE.BoxGeometry(0.04, 0.015, 0.02),
            rimMat
        );
        sw.position.set(0, 0.04, 0.05); // Approximate position
        sw.userData = { isFlashlightSwitch: true };
        this.group.add(sw);
        this.switchMesh = sw;

        // --- Switch HitBox (Invisible, larger for easy clicking) ---
        const swHitBox = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 8, 8),
            new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
        );
        swHitBox.position.set(0, 0.04, 0.05);
        swHitBox.userData = { isFlashlightSwitch: true };
        this.group.add(swHitBox);

        // --- Spot Light Beam (initially off) ---
        // Adjust beam position and direction for the new model
        this.beam = new THREE.SpotLight(0xffffee, 0, 8, Math.PI / 10, 0.3, 1);
        this.beam.castShadow = true;
        this.beam.shadow.mapSize.width = 1024; 
        this.beam.shadow.mapSize.height = 1024;
        this.beam.shadow.bias = -0.0001; 
        this.beam.shadow.normalBias = 0.02; 
        
        // Lens is roughly at (0, 0, 0.2) if model scale is 0.2 and it's long along Z
        this.beam.position.set(0, 0, 0.2); 
        
        const beamTarget = new THREE.Object3D();
        beamTarget.position.set(0, 0, 1); 
        this.group.add(beamTarget);
        this.beam.target = beamTarget;
        this.group.add(this.beam);
        
        this.isOn = false;
    }

    toggle() {
        this.isOn = !this.isOn;
        if (this.isOn) {
            if (this.switchMesh) this.switchMesh.position.y = 0.032; // Clicks in
            this.beam.intensity = 200;
        } else {
            if (this.switchMesh) this.switchMesh.position.y = 0.04;
            this.beam.intensity = 0;
        }
    }
}
