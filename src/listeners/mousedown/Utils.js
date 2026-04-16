/**
 * Walks up parent chain to find an object with a specific userData flag.
 */
export function findAncestorWithFlag(obj, flag) {
    let search = obj;
    while (search) {
        if (search.userData[flag]) {
            return search;
        }
        search = search.parent;
    }
    return null;
}

/**
 * Checks if an object is mounted on the stand.
 */
export function isMountedOnStand(obj) {
    return findAncestorWithFlag(obj, 'isMountedFlashlight') !== null;
}

/**
 * Finds the item instance (the actual interactive object) from a mesh.
 */
export function findItemInstance(obj) {
    let search = obj;
    while (search && !search.userData.itemInstance) {
        search = search.parent;
    }
    return search?.userData.itemInstance || null;
}

/**
 * Gets the wheel index, checking both the hit object and its parent.
 */
export function getWheelIndex(wheelObj) {
    return wheelObj.userData.index !== undefined
        ? wheelObj.userData.index
        : wheelObj.parent?.userData.index;
}
