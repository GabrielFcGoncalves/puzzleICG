import { CAMERA_PRESETS, INTERACTION_RANGES } from './Constants.js';
import { applyPresetAngles } from './Utils.js';

export class DoubleClickHandler {
    match(_target) {
        throw new Error('match() not implemented');
    }

    handle(_target, _worldPos, _ctx) {
        throw new Error('handle() not implemented');
    }

    zoomWithPreset(ctx, targetPos, presetKey, customOffset = null) {
        const preset = CAMERA_PRESETS[presetKey];
        if (!preset) return;
        const offset = customOffset || preset.offset;
        ctx.zoomTo(targetPos, preset.zoomLevel, null, offset);
        applyPresetAngles(ctx.controls, preset);
    }

    isWithinRange(pos, referencePos, range = INTERACTION_RANGES.proximity) {
        return pos.distanceTo(referencePos) < range;
    }
}
