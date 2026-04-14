import * as THREE from 'three';

export function createWheelTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, 512, 64);
    ctx.fillStyle = '#FFF'; ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let i = 0; i < 10; i++) { ctx.fillText(i.toString(), (i / 10) * 512 + 25.6, 32); }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    return tex;
}

export function createNoteTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 320;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fdfdf5';
    ctx.fillRect(0, 0, 512, 320);

    // Add some subtle lines like a real paper
    ctx.strokeStyle = '#e0e0d0';
    ctx.lineWidth = 1;
    for (let i = 40; i < 320; i += 40) {
        ctx.beginPath();
        ctx.moveTo(20, i);
        ctx.lineTo(492, i);
        ctx.stroke();
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.font = 'italic 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Congratulations', 256, 140);

    return new THREE.CanvasTexture(canvas);
}

export function createClueTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 256;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 256);
    ctx.fillStyle = '#00ffff';
    ctx.font = 'bold 120px "Courier New"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Add a glowing effect
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillText('1-2-3-4', 256, 128);
    return new THREE.CanvasTexture(canvas);
}
