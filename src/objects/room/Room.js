import * as THREE from 'three';
import { ModelLoader } from '../../utils/ModelLoader.js';
import { WallSystem } from './WallSystem.js';
import { FurnitureSystem } from './FurnitureSystem.js';
import { DecorationSystem } from './DecorationSystem.js';
import { SecretSystem } from './SecretSystem.js';

export class Room {
    constructor(scene, loadingManager) {
        this.scene = scene;
        this.loadingManager = loadingManager;
        this.modelLoader = new ModelLoader(this.loadingManager);
        this.group = new THREE.Group();
        this.group.name = "Room";
        this.group.userData.isRoom = true;

        // Configuration
        this.size = 10;
        this.height = 6;

        // References to be set by subsystems
        this.shelf = null;
        this.table = null;
        this.birdCanvas = null;
        this.birdPaintingMaterial = null;
        this.secretMark = null;
        this.secretSquare = null;
        this.whiteMaterial = null;

        this.init();
    }

    async init() {
        // Initialize subsystems
        this.walls = new WallSystem(this, this.size, this.height);
        this.walls.init();
        
        // Expose wallGroup for other systems
        this.wallsGroup = this.walls.wallsGroup;

        this.furniture = new FurnitureSystem(this, this.size);
        await this.furniture.init();

        this.decorations = new DecorationSystem(this, this.size);
        await this.decorations.init();

        this.secret = new SecretSystem(this, this.size, this.height);
        this.secret.init(this.walls.wallMat);

        this.scene.add(this.group);
    }

    update(isEthereal, isBirdPuzzleSolved, ctx) {
        // Delegate updates to systems that need them
        if (this.secret) {
            this.secret.update(isEthereal);
        }

        if (this.decorations) {
            this.decorations.update(isBirdPuzzleSolved);
        }
    }
}
