import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class InspectionScene {
    constructor(renderer) {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000000);
        this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
        this.controls = new OrbitControls(this.camera, renderer.domElement);
        this.currentInspectedGroup = null;

        this.init();
    }

    init() {
        this.scene.add(new THREE.AmbientLight(0xffffff, 3.5));
        const iLight = new THREE.DirectionalLight(0xffffff, 6);
        iLight.position.set(2, 5, 2);
        this.scene.add(iLight);

        const iFillLight = new THREE.DirectionalLight(0xffffff, 2.5);
        iFillLight.position.set(-2, -2, 2);
        this.scene.add(iFillLight);
    }

    open(itemData) {
        console.log("Opening Inspection for:", itemData.name);
        if (this.currentInspectedGroup) this.scene.remove(this.currentInspectedGroup);

        this.currentInspectedGroup = itemData.instance.cloneGroup();
        this.currentInspectedGroup.position.set(0, 0, 0);
        this.currentInspectedGroup.rotation.set(0, 0, 0);

        // Ensure all materials are visible and not too transparent
        this.currentInspectedGroup.traverse(node => {
            if (node.isMesh) {
                node.material = node.material.clone();
                node.material.transparent = false;
                node.material.opacity = 1.0;
            }
        });

        // Compute bounding box after a short delay or force update to ensure meshes are ready
        this.currentInspectedGroup.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(this.currentInspectedGroup);
        
        if (box.isEmpty()) {
            console.warn("Item box is empty, possible loading issue for:", itemData.name);
            // Fallback: use a default distance
            this.camera.position.set(0, 0, 1);
        } else {
            const sphere = box.getBoundingSphere(new THREE.Sphere());
            const center = box.getCenter(new THREE.Vector3());
            this.currentInspectedGroup.position.sub(center);

            const fov = this.camera.fov * (Math.PI / 180);
            const dist = (sphere.radius || 0.5) / Math.sin(fov / 2);
            this.camera.position.set(0, 0, dist * 1.2);
        }

        this.controls.target.set(0, 0, 0);
        this.controls.update();

        this.scene.add(this.currentInspectedGroup);
    }

    update() {
        this.controls.update();
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }
}
