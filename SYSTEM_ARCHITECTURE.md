# PuzzleICG: Input & Game State — Technical Reference

This document is a detailed explanation of how user input is captured, routed, and used to update the game world in PuzzleICG. It covers the global game state (`Store.js`), and the three primary input listeners: `DoubleClick.js`, `MouseDown.js`, and `MouseMove.js`.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Game State — `Store.js`](#game-state--storejs)
3. [MouseDown — Intent Detection](#mousedown--intent-detection)
4. [MouseMove — Continuous Transformation](#mousemove--continuous-transformation)
5. [DoubleClick — Navigation & Pickup](#doubleclick--navigation--pickup)
6. [How They Work Together: Complete Interaction Examples](#how-they-work-together-complete-interaction-examples)

---

## Architecture Overview

The input pipeline follows a strict, one-directional data flow:

```
User Input (Browser Event)
        |
        v
InputSystem.js (Router)
        |
        v
Listener (DoubleClick / MouseDown / MouseMove)
        |
        +--> Reads from Store.state (to check if action is allowed)
        |
        +--> Writes to Store.state (to signal an intention)
        |
        v
AnimationSystem.js (per-frame loop)
        |
        +--> Reads Store.state and moves 3D objects accordingly
        |
        v
THREE.WebGLRenderer (renders the result)
```

**Key principle**: The listeners do **not** directly move 3D objects on their own (with few exceptions). They only update the state. The `AnimationSystem` — running 60 times per second — reads that state and performs the actual visual updates. This separation keeps logic clean and predictable.

---

## Game State — `Store.js`

**File**: `src/store/Store.js`
**Exported singleton**: `store`

The `GameStore` class is the single source of truth for everything that can change at runtime. Every listener reads from it before acting, and writes to it after.

### State Slices Architecture

State is decomposed into four domain-specific slices, each in its own file under `src/store/`:

#### `store.interaction` (InteractionState.js)

Per-frame input interaction tracking. Has a `resetAll()` method called on mouseup.

```javascript
{
    isDragging: false,            // True while pulling a drawer open/closed
    isRotatingFooting: false,     // True while rotating the cabinet foot
    isTurningKey: false,          // True while dragging the key to unlock a drawer
    isDraggingBird: false,        // True while rotating the bird model in the alignment puzzle
    draggedDrawerIndex: -1,       // Which drawer (0, 1, 2...) is being pulled; -1 = none
    rotatedFooting: null,         // A direct reference to the THREE.Object3D being rotated

    // Mouse memory (captured at MouseDown, consumed during MouseMove)
    initialMouseX: 0,
    initialMouseY: 0,
    initialRotationY: 0,
    initialRotationX: 0,
}
```

#### `store.camera` (CameraState.js)

Camera transition targets and zoom-level context flags.

```javascript
{
    isTransitioning: false,       // True while the camera is smoothly moving
    targetFocus: THREE.Vector3,   // The point the camera should orbit around
    cameraFocus: THREE.Vector3,   // The position the camera itself should move to
    isZoomedOnFoot: false,        // True when focused on the rotating foot
    isZoomedOnPadlock: false,     // True when focused on the padlock
    camClampingDisabled: false,   // True in "Free Fly" debug mode
}
```

#### `store.puzzle` (PuzzleState.js)

Puzzle completion flags and puzzle-specific animation state.

```javascript
{
    isBirdPuzzleSolved: false,    // True once the bird is aligned for >2 seconds
    showBirdInFocus: false,       // True when the bird model overlay should be visible
    isBoxOnPedestal: false,       // True once the puzzle box is on the pedestal
    isMovingPuzzleBox: false,     // True during the movement animation to the pedestal
    pBoxTargetPos: THREE.Vector3, // World-space destination for the puzzle box
    isSecretSquareTriggered: false, // True once the hidden wall panel is activated
}
```

#### `store.ui` (UIState.js)

UI mode toggles, inventory, and rendering flags.

```javascript
{
    isInspecting: false,          // True when the InspectionScene is active
    isHintMode: false,            // True when hint overlays are shown
    isEthereal: false,            // True when "ghost/ethereal" mode is active
    inventory: [],                // Array of { name, thumbnail, instance }
    draggedInventoryIndex: -1,    // Index of the item being dragged from inventory UI
    shadowNeedsRefresh: true,     // Keeps shadow maps updating until scene is loaded
}
```

#### How Listeners Access State Slices

Listeners receive the World object as `ctx`. World exposes state slices as getters:

| Getter | Returns |
| :--- | :--- |
| `ctx.interaction` | `store.interaction` (InteractionState) |
| `ctx.cameraState` | `store.camera` (CameraState) |
| `ctx.puzzle` | `store.puzzle` (PuzzleState) |
| `ctx.uiState` | `store.ui` (UIState) |

### Store Methods — What Each One Does

| Method | What it does |
| :--- | :--- |
| `init(camera, scene, renderer, ...)` | Called once at startup. Stores references to shared Three.js objects (camera stored as `cameraRef` to avoid collision with the `camera` state slice). |
| `pickupItem(itemGroup)` | Async. Gets a thumbnail screenshot of the item, adds it to `state.inventory`, removes the item from the scene with `.remove()`, and updates the UI inventory panel. |
| `zoomTo(targetPos, zoomLevel, lookAtPos, camOffset)` | Sets `isTransitioning = true` and calculates the new `cameraFocus` and `targetFocus` vectors. The actual movement happens in `AnimationSystem.js`. |
| `resetZoom()` | Resets `cameraFocus` to `(3, 2, 4)` and `targetFocus` to `(0, 0, 0)`. Also clears all zoom-related flags and unlocks the `OrbitControls`. |
| `openInspection(itemData)` | Sets `isInspecting = true` and tells the UI manager to show the inspection overlay. |
| `detachCamera()` | Disables transitioning and enables free panning — used for "Free Fly" debug mode. |

---

## MouseDown — Intent Detection

**File**: `src/listeners/MouseDown.js`
**Triggered by**: `mousedown` event (single press, not release)

### Purpose

`MouseDown` is the **gatekeeper**. Its job is to fire a single raycast the instant the mouse button is pressed, determine what the user clicked, and claim that interaction by updating the state. It does not perform any continuous updates — that is handled by `MouseMove`.

### Step-by-Step Execution

**Step 1: Convert mouse position to Normalized Device Coordinates (NDC)**
```javascript
mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
raycaster.setFromCamera(mouse, camera);
```
NDC maps the pixel coordinate `(0, 0)` → `(-1, -1)` and `(window.width, window.height)` → `(1, 1)`. The `y` axis is flipped because browser pixels count downward but Three.js counts upward. `setFromCamera` calculates the ray origin (camera position) and direction.

**Step 2: Broad intersection test**
```javascript
const allHits = raycaster.intersectObjects(scene.children, true);
```
Recursively tests every object in the scene. Returns an array sorted by distance (closest first).

**Step 3: Guarded interaction checks (Flashlight Switch, Padlock)**
The first loop iterates hits and walks up the parent chain of each hit object looking for `userData` flags:
- `userData.isFlashlightSwitch` — triggers the flashlight's `.toggle()` method, **only** if it is currently mounted on the stand (`userData.isMountedFlashlight`). Calls `return` immediately after to prevent any further checks.
- `userData.isPadlockButton` — records that the button is pressed (`isPressed = true`) and triggers the cabinet's code-check logic, **only** if `state.isZoomedOnPadlock` is true.

**Step 4: Targeted intersection tests — specific object groups**
```javascript
const wheelHits  = raycaster.intersectObjects(cabinet.wheels, true);
const handleHits = raycaster.intersectObjects(ctx.getHandles(), true);
const keyHits    = raycaster.intersectObjects([cabinet.keyPivot], true);
```
These narrow casts are faster and more predictable than walking through `allHits` for complex interactions.

**Step 5: Key turning**
```javascript
if (keyHits.length > 0 && cabinet.isKeyInserted && !cabinet.isKeyTurned) {
    state.isTurningKey = true;
    state.initialMouseX = event.clientX;
    controls.enabled = false;
    return;
}
```
- Only fires if the key is physically in the lock and has not been turned yet.
- Stores `initialMouseX` so `MouseMove` can calculate how far the user has dragged.
- Disables `OrbitControls` so the camera does not spin.

**Step 6: Padlock wheel spinning**
```javascript
if (wheelHits.length > 0 && state.isZoomedOnPadlock) {
    const index = h.userData.index !== undefined ? h.userData.index : h.parent.userData.index;
    cabinet.currentCode[index] = (cabinet.currentCode[index] + 1) % 10;
    cabinet.wheels[index].userData.targetRot += (Math.PI * 2) / 10;
    controls.enabled = false;
    return;
}
```
- Resolves the wheel index from `userData` on either the clicked mesh or its parent.
- Increments the digit at that index in `cabinet.currentCode` with wrapping modulo 10.
- Adds exactly `(2π / 10)` to `targetRot`, which the cabinet's `update()` method then animates towards.

**Step 7: Footing rotation start**
```javascript
state.isRotatingFooting = true;
state.rotatedFooting = cabinet.rotatableFoot; // stored reference
state.initialMouseX = event.clientX;
state.initialRotationY = state.rotatedFooting.rotation.y;
```
Stores the current angular position of the foot so that `MouseMove` can apply a relative delta rather than an absolute value.

**Step 8: Drawer handle drag start**
```javascript
if (!dGroup.userData.isLocked) {
    state.draggedDrawerIndex = drawerIndex;
    state.isDragging = true;
    controls.enabled = false;

    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), dGroup.position.y);
    raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
    offset.copy(intersectionPoint).sub(dGroup.position);
}
```
- Checks `isLocked` — locked drawers cannot be dragged.
- Creates a virtual flat plane at the height of the drawer (`y = dGroup.position.y`).
- Intersects the ray with this horizontal plane to get the 3D "grab point."
- Stores the `offset` between the grab point and the drawer's center, so the drawer doesn't teleport to the mouse but moves relative to where it was grabbed.

**Step 9: Bird model grab**
```javascript
if (state.showBirdInFocus && ctx.birdProxy) {
    const birdHits = raycaster.intersectObject(ctx.birdProxy, true);
    if (birdHits.length > 0) {
        state.isDraggingBird = true;
        state.initialMouseX = event.clientX;
        state.initialMouseY = event.clientY;
        state.initialRotationY = ctx.birdProxy.rotation.y;
        state.initialRotationX = ctx.birdProxy.rotation.x;
    }
}
```
Both X and Y rotations are stored because the bird can be rotated on two axes simultaneously.

---

## MouseMove — Continuous Transformation

**File**: `src/listeners/MouseMove.js`
**Triggered by**: `mousemove` event (fires continuously while mouse moves)

### Purpose

`MouseMove` is the **executor**. It runs constantly and checks the flags set by `MouseDown`. If a flag is active, it calculates the new position or rotation and applies it directly to the 3D object.

### Step-by-Step Branching Logic

`MouseMove` uses an `if / else if` chain — only one branch runs per frame:

**Branch 1: Footing rotation** (`state.isRotatingFooting`)
```javascript
const deltaX = event.clientX - state.initialMouseX;
state.rotatedFooting.rotation.y = state.initialRotationY + deltaX * 0.01;
```
- `deltaX` is the total horizontal distance moved since the drag started.
- Multiplied by `0.01` (sensitivity) to convert pixels to radians.
- Applied as an **absolute** value (`initialRotationY + delta`) — not incremental — so there is no drift if the mouse pauses.

**Branch 2: Key turning** (`state.isTurningKey`)
```javascript
const deltaX = event.clientX - state.initialMouseX;
if (deltaX > 50) {
    cabinet.isKeyTurned = true;
    cabinet.drawerGroups[0].userData.isLocked = false;
    cabinet.targetDrawerZ[0] = cabinet.drawerGroups[0].userData.restZ + 0.05;
    ctx.statusElement.innerText = "STATUS: MIDDLE DRAWER UNLOCKED";
}
```
The threshold is a fixed 50 pixel drag to the right. Once crossed, the state is set and cannot be undone.

**Branch 3: Drawer dragging** (`state.isDragging`)
```javascript
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), dGroup.position.y);
if (raycaster.ray.intersectPlane(groundPlane, intersectionPoint)) {
    const zMin = dGroup.userData.restZ;
    const zMax = dGroup.userData.openedZ;
    cabinet.targetDrawerZ[index] = Math.max(zMin, Math.min(zMax, intersectionPoint.z - offset.z));
}
```
- Every frame, a new ray is cast from the updated mouse position.
- The ray is intersected against the same horizontal plane used in `MouseDown`.
- The drawer's `targetZ` is clamped between its `restZ` (closed) and `openedZ` (maximum open) limits so the player cannot pull it out of the cabinet entirely.
- The `offset.z` is subtracted to compensate for where the drawer was grabbed relative to its center.

**Branch 4: Bird rotation** (`state.isDraggingBird`)
```javascript
const deltaX = event.clientX - state.initialMouseX;
const deltaY = event.clientY - state.initialMouseY;
ctx.birdProxy.rotation.y = state.initialRotationY + deltaX * 0.01;
ctx.birdProxy.rotation.x = state.initialRotationX + deltaY * 0.01;
```
Both axes are rotated independently using their respective deltas.

**Branch 5: Idle hover cursor feedback**
When no interaction is active, `MouseMove` still performs a lightweight raycast for **cursor feedback**:
```javascript
const wheelHover  = raycaster.intersectObjects(cabinet.wheels, true);
const handleHover = raycaster.intersectObjects(ctx.getHandles(), true);
const itemHover   = raycaster.intersectObjects(ctx.getItems() || [], true);
const birdHover   = /* ... */
const footHover   = raycaster.intersectObjects(cabinet.feet || [], true);
```
The cursor is then set to `pointer` if hovering over anything interactive, or `grab` otherwise:
```javascript
renderer.domElement.style.cursor = (canInteract || canInteractWithHandle) ? 'pointer' : 'grab';
```
Note: A handle hover only counts as interactable if the corresponding drawer is **not locked**.

---

## DoubleClick — Navigation & Pickup

**File**: `src/listeners/DoubleClick.js`
**Triggered by**: `dblclick` event

### Purpose

`DoubleClick` handles **high-level navigation and world actions**. It determines what the player double-clicked and either zooms the camera to the appropriate perspective or triggers a major game action (like picking up an item or moving the puzzle box).

### The Occlusion-Aware Hit Selection Algorithm

Unlike `MouseDown`, which only cares about the single closest hit, `DoubleClick` needs to search for the correct "target" among all hits while respecting occlusion.

```javascript
let interactiveHit = null;
for (const hit of allHits) {
    let search = hit.object;
    while (search) {
        if (search.userData.isItem || search.userData.isPuzzleBox || ...) {
            interactiveHit = { hit, entity: search };
            break;
        }
        search = search.parent;
    }

    if (interactiveHit) {
        // If it's a solid wall/panel, stop. If transparent, keep looking behind it.
        if (!obj.material || obj.material.opacity >= 1) break;
        if (interactiveHit.entity.userData.isItem) break;
    }

    // An opaque non-interactive mesh blocks further search.
    if (obj.material && obj.material.opacity >= 1 && !interactiveHit) break;
}
```

This allows clicking through glass or transparent surfaces to hit items behind them, while still preventing the player from clicking through solid walls.

### The Handler Dispatch Table

Once a target is found, its world position is calculated and a list of **handler objects** is iterated:
```javascript
const handlers = [
    { match: t => t.userData.isPuzzleBox,   handle: (t, pos) => { ... } },
    { match: t => t.userData.isItem,        handle: (t, pos) => { ... } },
    { match: t => t.userData.isStaticPuzzlePart, handle: ... },
    { match: t => t.userData.isPadlock,     handle: ... },
    // ... etc.
];

for (const handler of handlers) {
    if (handler.match(target)) {
        handler.handle(target, worldPos);
        return; // Only the first matching handler runs
    }
}
```

This is a **Chain of Responsibility** pattern — clean and easy to extend.

### Handler Breakdown

| Target Type | What Happens |
| :--- | :--- |
| **Puzzle Box** | If on pedestal: zoom in. If in drawer: attach to world scene and trigger animation to pedestal. |
| **Item** | If already close to camera target: `pickupItem()`. If far: zoom to it first. (Old Key cannot be picked up unless already zoomed to the foot) |
| **Painting** | Zoom to face the painting directly. If Bird figurine is in inventory, set `showBirdInFocus = true`. |
| **Stand** | Zoom to flashlight stand, unlock azimuth angles for rotation. |
| **Secret Square** | If close enough: trigger the slide mechanism (`isSecretSquareTriggered = true`). If far: zoom to it. |
| **Mounted Flashlight** | Zoom to the switch area. |
| **Drawer Handle** | Zoom in and apply azimuth clamping so only the drawer face is visible. |
| **Footing** | Set `isZoomedOnFoot = true` and zoom to the foot with elevated camera angle. |
| **Padlock** | Set `isZoomedOnPadlock = true` and apply tight angle clamping. |
| **Cabinet Body** | Zoom to show full cabinet overview. |
| **Nothing** | `resetZoom()` — return camera to default position. |

### Camera Angle Clamping

When zooming in on puzzles, `DoubleClick` also locks the camera angles so the player cannot accidentally look away:
```javascript
controls.minAzimuthAngle = -Math.PI / 6; // -30 degrees
controls.maxAzimuthAngle =  Math.PI / 6; // +30 degrees
controls.minPolarAngle   = Math.PI * 0.4;
controls.maxPolarAngle   = Math.PI * 0.65;
```
These limits are cleared when `resetZoom()` is called, restoring free rotation.

---

## How They Work Together: Complete Interaction Examples

### Example A: Pulling Open a Drawer

1.  **DoubleClick** the drawer handle.
    - Handler zooms the camera to face the drawer with `zoomTo()`.
    - `state.isTransitioning = true`, `cameraFocus` updated.

2.  **AnimationSystem** lerps the camera to the new position over ~30 frames.

3.  **MouseDown** on the handle.
    - `handleHits` is populated.
    - Checks `dGroup.userData.isLocked` — if `false`, proceeds.
    - Sets `state.isDragging = true`, `state.draggedDrawerIndex = 1`.
    - Builds a horizontal plane at the drawer's height and caches the grab `offset`.
    - `controls.enabled = false`.

4.  **MouseMove** continuously updates:
    - Casts a ray against the horizontal plane.
    - Sets `cabinet.targetDrawerZ[1]` clamped between `restZ` and `openedZ`.
    - `Cabinet.update()` (called by AnimationSystem each frame) slides the drawer towards `targetDrawerZ`.

5.  **MouseUp** (`MouseUp.js`): clears `isDragging`, re-enables `controls`.

---

### Example B: Solving the Key Lock

1.  Player has the **Old Key** in inventory. They **drag it from the UI** onto the top drawer.
2.  `InputSystem.handleGlobalMouseUp` fires. `processDrop()` detects the cabinet drawer.
3.  It sets `cabinet.isKeyInserted = true` and shows the key pivot mesh (`keyPivot.visible = true`).

4.  **MouseDown** on the key pivot:
    - `keyHits.length > 0`, `isKeyInserted` is true, `isKeyTurned` is false.
    - Sets `state.isTurningKey = true`, stores `state.initialMouseX`.
    - `controls.enabled = false`.

5.  **MouseMove**: `isTurningKey` branch runs.
    - Calculates `deltaX`. Once it exceeds 50px:
    - Sets `cabinet.isKeyTurned = true`.
    - Sets `drawerGroups[0].userData.isLocked = false`.
    - Updates status text.

6.  The top drawer is now unlocked and can be opened using the drawer handle flow above.

---

### Example C: Bird Alignment Puzzle

1.  Player picks up the **Iron Bird figurine** (DoubleClick → `pickupItem`).

2.  Player **DoubleClick**s the painting on the wall.
    - `state.showBirdInFocus = true` (because Bird is in inventory).
    - Camera zooms to face the painting.

3.  **AnimationSystem** detects `showBirdInFocus` → makes `birdProxy` visible and positions it.

4.  **MouseDown** on the `birdProxy`:
    - `birdHits.length > 0`.
    - Sets `state.isDraggingBird = true`, stores `initialMouseX/Y`, `initialRotationX/Y`.

5.  **MouseMove**: `isDraggingBird` branch applies rotation to `birdProxy.rotation.x/y`.

6.  **AnimationSystem** each frame normalizes `birdProxy.rotation` to `[0, 2PI]`:
    - If both axes are within `±0.15` radians of `0`, a timer starts.
    - After 2 seconds sustained alignment: `isBirdPuzzleSolved = true`.
    - The closet shelf begins sliding open via `lerp`.
