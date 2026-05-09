import * as THREE from 'three';

export const CAMERA_PRESETS = {
    padlock: {
        azimuth: [-Math.PI / 6, Math.PI / 6],
        polar: [Math.PI * 0.4, Math.PI * 0.65],
        zoomLevel: 2.0,
        offset: new THREE.Vector3(0, 0.4, 0.6)
    },
    drawer: {
        azimuth: [-Math.PI / 4, Math.PI / 4],
        polar: [Math.PI * 0.4, Math.PI * 0.65],
        zoomLevel: 1.5,
        offset: new THREE.Vector3(0, 0.4, 0.8)
    },
    foot: {
        azimuth: [-Math.PI, Math.PI],
        polar: [Math.PI * 0.4, Math.PI * 0.75],
        zoomLevel: 1.0,
        offset: new THREE.Vector3(0.2, 0.2, 0.4)
    },
    painting: {
        azimuth: [-Infinity, Infinity],
        polar: [Math.PI * 0.4, Math.PI * 0.65],
        zoomLevel: 2.4,
        offset: null
    },
    cabinet: {
        azimuth: [-Infinity, Infinity],
        polar: [0, Math.PI * 0.75],
        zoomLevel: 4.0,
        offset: new THREE.Vector3(0, 0.5, 1.2)
    },
    free: {
        azimuth: [-Infinity, Infinity],
        polar: [0, Math.PI],
        zoomLevel: 1.0,
        offset: new THREE.Vector3(0, 0, 0)
    },
    door: {
        azimuth: [-Infinity, Infinity],
        polar: [0, Math.PI * 0.75],
        zoomLevel: 3.6,
        offset: new THREE.Vector3(0, 1.2, -1.8)
    }
};

export const INTERACTION_RANGES = {
    pickup: 1.1,
    secretSquare: 1.5,
    proximity: 2.0
};

export const INTERACTIVE_FLAGS = [
    'isItem', 'isPuzzleBox', 'isStaticPuzzlePart',
    'isRotatable', 'isFooting', 'isFlashlightSwitch', 'isCabinetBody',
    'isPadlock', 'isPadlockWheel', 'isPadlockButton'
];
