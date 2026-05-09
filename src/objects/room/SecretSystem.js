import * as THREE from 'three';

export class SecretSystem {
    constructor(parent, size, height) {
        this.parent = parent;
        this.size = size;
        this.height = height;
        this.group = parent.group;
        this.wallsGroup = parent.wallsGroup;
        this.loadingManager = parent.loadingManager;
    }

    init(wallMat) {
        const textureLoader = new THREE.TextureLoader(this.loadingManager);
        
        // --- Secret Square ---
        const secretSquareGroup = new THREE.Group();
        const sqGeom = new THREE.PlaneGeometry(1, 1);
        
        const wallWidth = this.size;
        const wallHeight = this.height;
        const posZ = 2; 
        const posY = 1.5;
        
        const normZ = (posZ + wallWidth / 2) / wallWidth;
        const normY = (posY + 1.7) / wallHeight;
        
        const uvAttr = sqGeom.attributes.uv;
        for (let i = 0; i < uvAttr.count; i++) {
            let u = uvAttr.getX(i);
            let v = uvAttr.getY(i);
            u = (normZ + (u - 0.5) * (1 / wallWidth)) * 1;
            v = (normY + (v - 0.5) * (1 / wallHeight)) * 1;
            uvAttr.setXY(i, u, v);
        }
        uvAttr.needsUpdate = true;
        
        const sqMesh = new THREE.Mesh(sqGeom, wallMat);
        
        // Mark
        const handTex = textureLoader.load(new URL('../../models/handprint.png', import.meta.url).href);
        const markMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            map: handTex,
            transparent: true, 
            opacity: 0.8,
            blending: THREE.AdditiveBlending 
        });
        
        const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.5 , 0.5), markMat);
        mark.position.z = 0.005;
        this.parent.secretMark = mark;
        this.parent.secretMark.visible = false;

        secretSquareGroup.add(sqMesh, mark);
        secretSquareGroup.userData = { isStaticPuzzlePart: true, isSecretSquare: true };
        secretSquareGroup.position.set(this.size / 2 - 0.002, 1.5, 2);
        secretSquareGroup.rotation.y = -Math.PI / 2;
        this.parent.secretSquare = secretSquareGroup;
        this.wallsGroup.add(secretSquareGroup);

        // --- Hidden Compartment ---
        this.createHole();
    }

    createHole() {
        const hGroup = new THREE.Group();
        const hMat = new THREE.MeshStandardMaterial({ color: 0x010101, roughness: 0.5 });
        const depth = 1.5;
        
        const back = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), hMat);
        back.position.set(depth / 2, 0, 0); 
        back.rotation.y = -Math.PI / 2;
        
        const top = new THREE.Mesh(new THREE.PlaneGeometry(1, depth), hMat);
        top.position.set(0, 0.5, 0);
        top.rotation.x = Math.PI / 2;
        top.rotation.z = Math.PI / 2;
        
        const bottom = new THREE.Mesh(new THREE.PlaneGeometry(1, depth), hMat);
        bottom.position.set(0, -0.5, 0);
        bottom.rotation.x = -Math.PI / 2;
        bottom.rotation.z = Math.PI / 2;
        
        const left = new THREE.Mesh(new THREE.PlaneGeometry(depth, 1), hMat);
        left.position.set(0, 0, -0.5);
        left.rotation.y = 0;
        
        const right = new THREE.Mesh(new THREE.PlaneGeometry(depth, 1), hMat);
        right.position.set(0, 0, 0.5);
        right.rotation.y = Math.PI;

        hGroup.add(back, top, bottom, left, right);
        hGroup.traverse(n => { if (n.isMesh) n.receiveShadow = true; });
        hGroup.userData = { isStaticPuzzlePart: true, isSecretSquare: true };
        hGroup.position.set(this.size / 2 + depth / 2, 1.5, 2); 
        this.wallsGroup.add(hGroup);
    }

    update(isEthereal) {
        if (this.parent.secretMark) {
            this.parent.secretMark.visible = isEthereal;
        }
    }
}
