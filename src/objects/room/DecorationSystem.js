import * as THREE from 'three';

export class DecorationSystem {
    constructor(parent, size) {
        this.parent = parent;
        this.size = size;
        this.wallsGroup = parent.wallsGroup;
        this.loadingManager = parent.loadingManager;
    }

    init() {
        const textureLoader = new THREE.TextureLoader(this.loadingManager);
        const frameMat = new THREE.MeshStandardMaterial({ color: 0xaa8800, metalness: 0.8, roughness: 0.2 });
        const paintMat = new THREE.MeshStandardMaterial({ color: 0x111111 });

        const createPainting = (w, h, x, y, z, rotY, texturePath, isBird) => {
            const pGroup = new THREE.Group();
            const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.1, h + 0.1, 0.05), frameMat);
            
            let currentMat = paintMat;
            if (texturePath) {
                const tex = textureLoader.load(new URL(texturePath, import.meta.url).href);
                tex.repeat.set(0.5, 0.6); 
                tex.offset.set(0.25, 0.2); 
                currentMat = new THREE.MeshStandardMaterial({ map: tex, transparent: true });
            }
            
            const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h), currentMat);
            canvas.position.z = 0.031;
            
            const whiteMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });
            this.parent.whiteMaterial = whiteMaterial;
            
            if (isBird) {
                this.parent.birdCanvas = canvas;
                this.parent.birdPaintingMaterial = currentMat;
                this.parent.birdPaintingMaterial.transparent = true;
                this.parent.birdPaintingMaterial.opacity = 0.4;
                this.parent.birdCanvas.material = this.parent.birdPaintingMaterial;
                this.parent.birdCanvas.visible = true; 
            }

            frame.receiveShadow = true;
            canvas.receiveShadow = true;

            pGroup.add(frame, canvas);
            pGroup.position.set(x, y, z);
            pGroup.rotation.y = rotY;
            pGroup.userData = { isStaticPuzzlePart: true, isPainting: true, isFurniture: true };
            return pGroup;
        };

        // Bird Painting
        this.wallsGroup.add(createPainting(1.5, 2, -this.size / 2 + 0.03, 1.2, 0, Math.PI / 2, '../../models/paintings/bird_silhouette.png', true));

        // Back Painting
        this.wallsGroup.add(createPainting(1.5, 2, 2, 1.2, -this.size / 2 + 0.03, 0));
    }

    update(isBirdPuzzleSolved) {
        if (this.parent.birdCanvas) {
            if (isBirdPuzzleSolved) {
                this.parent.birdCanvas.material.opacity = 1.0;
            } else {
                this.parent.birdCanvas.material.opacity = 0.4;
            }
            this.parent.birdCanvas.visible = true;
        }
    }
}
