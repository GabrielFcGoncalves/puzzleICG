import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Centered utility class for loading 3D models.
 * Can be reused across the application to avoid multiple GLTFLoader instances.
 */
export class ModelLoader {
    constructor(loadingManager) {
        this.loader = new GLTFLoader(loadingManager);
    }

    /**
     * Loads a GLTF/GLB model and applies a standard setup (shadows, name logging, material tweaks).
     * @param {string} path - URL to the model file.
     * @param {Object} options - Configuration for setup (e.g., { shadows: true, roughness: 0.5 }).
     * @returns {Promise<Object>} - Resolves with the GLTF object.
     */
    async load(path, options = {}) {
        const settings = {
            shadows: true,
            logNames: false,
            ...options
        };

        return new Promise((resolve, reject) => {
            this.loader.load(
                path,
                (gltf) => {
                    this.setupModel(gltf.scene, settings);
                    resolve(gltf);
                },
                undefined,
                (error) => {
                    console.error('Error loading GLTF:', path, error);
                    reject(error);
                }
            );
        });
    }

    /**
     * Performs common setup tasks on the loaded model scene.
     * @param {THREE.Group|THREE.Scene} model - The model's scene.
     * @param {Object} options - Setup configuration.
     */
    setupModel(model, options = {}) {
        if (!model) return;

        model.traverse(node => {
            if (options.logNames && node.name) {
                console.log(`Model node: [${node.name}] (${node.type})`);
            }
            if (node.isMesh) {
                if (options.shadows) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
                
                // Material tweaks
                if (node.material) {
                    if (options.cloneMaterials) {
                        node.material = node.material.clone();
                    }
                    if (options.roughness !== undefined) node.material.roughness = options.roughness;
                    if (options.metalness !== undefined) node.material.metalness = options.metalness;
                    if (options.opacity !== undefined) node.material.opacity = options.opacity;
                    if (options.transparent !== undefined) node.material.transparent = options.transparent;
                    if (options.color !== undefined) {
                        if (node.material.color) {
                            node.material.color.set(options.color);
                        }
                    }
                }

                // Advanced callback for specific logic (like name-based filtering)
                if (options.materialCallback) {
                    options.materialCallback(node);
                }
            }
        });
    }
}
