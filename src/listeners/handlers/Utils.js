import * as THREE from 'three';
import { INTERACTIVE_FLAGS } from './Constants.js';

export function shouldStopOcclusionSearch(currentHit, interactiveHitFound) {
    const isOpaque = currentHit.material && currentHit.material.opacity >= 1;
    const foundItem = interactiveHitFound?.entity?.userData?.isItem;
    const foundBlockingWall = isOpaque && !interactiveHitFound;
    const foundOpaqueInteractive = isOpaque && interactiveHitFound;

    return foundItem || foundBlockingWall || foundOpaqueInteractive;
}

export function findInteractiveEntity(obj) {
    let search = obj;
    while (search) {
        if (INTERACTIVE_FLAGS.some(flag => search.userData[flag]) ||
            search.userData.drawerIndex !== undefined) {
            return search;
        }
        search = search.parent;
    }
    return null;
}

export function findClickableTarget(allHits) {
    let interactiveHit = null;

    for (const hit of allHits) {
        const obj = hit.object;
        const interactive = findInteractiveEntity(obj);

        if (interactive) {
            interactiveHit = { hit, entity: interactive };
        }

        if (shouldStopOcclusionSearch(obj, interactiveHit)) {
            break;
        }
    }

    return interactiveHit;
}

export function getWorldPosition(target) {
    const pos = new THREE.Vector3();
    target.getWorldPosition(pos);
    return pos;
}

export function applyPresetAngles(controls, preset) {
    if (!preset) return;
    controls.minAzimuthAngle = preset.azimuth[0];
    controls.maxAzimuthAngle = preset.azimuth[1];
    controls.minPolarAngle = preset.polar[0];
    controls.maxPolarAngle = preset.polar[1];
}
