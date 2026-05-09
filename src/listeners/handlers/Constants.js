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
    bottomDrawer: {
        azimuth: [-Math.PI / 6, Math.PI / 6],
        polar: [Math.PI * 0.3, Math.PI * 0.55], // Looking more from above
        zoomLevel: 2.2,
        offset: new THREE.Vector3(0, 0.8, 1.0) // Higher up
    },
    drawerInside: {
        azimuth: [-Math.PI / 3, Math.PI / 3],
        polar: [Math.PI * 0.25, Math.PI * 0.5],
        zoomLevel: 1.4,
        offset: new THREE.Vector3(0, 2.4, -1)
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
    },
    pedestal: {
        azimuth: [-Infinity, Infinity],
        polar: [0, Math.PI * 0.75],
        zoomLevel: 1.8,
        offset: new THREE.Vector3(-0.5, 0.5, 0.8)
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
    'isPadlock', 'isPadlockWheel', 'isPadlockButton', 'isPushButton'
];

