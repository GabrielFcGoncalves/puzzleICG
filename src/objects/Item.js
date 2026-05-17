import * as THREE from 'three';

export class Item {
    constructor(name) {
        this.name = name;
        this.group = new THREE.Group();

        // Items are marked as pickupable by default
        this.group.userData = {
            isItem: true,
            isPickupable: true,
            itemName: name,
            itemInstance: this
        };
        this.preserveRotationInThumbnail = false;
        this.thumbnailRotation = null; // THREE.Euler or {x, y, z}
    }

    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }

    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }

    addTo(parent) {
        parent.add(this.group);
    }

    cloneGroup() {
        const savedInstances = new Map();
        
        this.group.traverse(node => {
            if (node.userData && node.userData.itemInstance) {
                savedInstances.set(node, node.userData.itemInstance);
                node.userData.itemInstance = null;
            }
        });
        
        const clone = this.group.clone(true);
        
        savedInstances.forEach((instance, node) => {
            node.userData.itemInstance = instance;
        });
        
        return clone;
    }

    async getThumbnail() {
        if (this.thumbnail) return this.thumbnail;

        const size = 128;
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(size, size);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, 1, 0.001, 10);

        const light1 = new THREE.AmbientLight(0xffffff, 1.5);
        const light2 = new THREE.DirectionalLight(0xffffff, 3);
        light2.position.set(2, 2, 2);
        scene.add(light1, light2);

        const clone = this.cloneGroup();
        clone.position.set(0, 0, 0);
        if (this.thumbnailRotation) {
            clone.rotation.set(this.thumbnailRotation.x, this.thumbnailRotation.y, this.thumbnailRotation.z);
        } else if (!this.preserveRotationInThumbnail) {
            clone.rotation.set(0, 0, 0);
        }

        // Center the object
        const box = new THREE.Box3().setFromObject(clone);
        const center = box.getCenter(new THREE.Vector3());
        clone.position.sub(center);

        // Adjust camera to fit
        const sphere = box.getBoundingSphere(new THREE.Sphere());
        const fov = camera.fov * (Math.PI / 180);
        const dist = sphere.radius / Math.sin(fov / 2);
        camera.position.z = dist * 1.1; // Add 10% padding

        scene.add(clone);
        renderer.render(scene, camera);

        this.thumbnail = renderer.domElement.toDataURL();
        renderer.dispose();

        return this.thumbnail;
    }
}
