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
        if (this.currentInspectedGroup) this.scene.remove(this.currentInspectedGroup);

        this.currentInspectedGroup = itemData.instance.cloneGroup();
        this.currentInspectedGroup.position.set(0, 0, 0);
        this.currentInspectedGroup.rotation.set(0, 0, 0);

        const box = new THREE.Box3().setFromObject(this.currentInspectedGroup);
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const center = box.getCenter(new THREE.Vector3());
        this.currentInspectedGroup.position.sub(center);

        const fov = this.camera.fov * (Math.PI / 180);
        const dist = sphere.radius / Math.sin(fov / 2);
        this.camera.position.set(0, 0, dist * 1.1);
        this.controls.target.set(0, 0, 0);

        this.scene.add(this.currentInspectedGroup);
    }

    update() {
        this.controls.update();
    }

    render(renderer) {
        renderer.render(this.scene, this.camera);
    }
}
