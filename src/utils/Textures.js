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

export function createFingerprintTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // Cyan color with glow
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 10;

    // Draw a stylized fingerprint (index finger)
    const centerX = 64, centerY = 64;
    for (let r = 8; r < 50; r += 8) {
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, r * 0.6, r, 0.1, 0, Math.PI * 2);
        ctx.stroke();
    }

    return new THREE.CanvasTexture(canvas);
}


export function createPaperTexture(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; // Increased resolution for better font rendering
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Paper background with an aged parchment radial gradient
    const grad = ctx.createRadialGradient(512, 512, 50, 512, 512, 800);
    grad.addColorStop(0, '#f4e4bc'); // Lighter yellowish center
    grad.addColorStop(1, '#c5a367'); // Darker tan edges
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle paper texture (more pronounced aging/spots)
    for (let i = 0; i < 3000; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const size = Math.random() * 4;
        const opacity = Math.random() * 0.15;
        ctx.fillStyle = `rgba(80, 50, 20, ${opacity})`;
        ctx.fillRect(x, y, size, size);
    }

    // Add some larger "water/tea" stains
    for (let i = 0; i < 5; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const radius = 50 + Math.random() * 150;
        const stainGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
        stainGrad.addColorStop(0, 'rgba(100, 70, 30, 0.2)');
        stainGrad.addColorStop(1, 'rgba(100, 70, 30, 0)');
        ctx.fillStyle = stainGrad;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    // Text settings
    ctx.fillStyle = '#3a2a1a'; // Faded brown ink
    ctx.font = '180px "Caveat", cursive';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap text if needed
    const words = text.split(' ');
    let line = '';
    let lines = [];
    const maxWidth = 900;
    const lineHeight = 150;

    for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
            lines.push(line);
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    lines.push(line);

    // Draw lines
    const startY = 512 - (lines.length - 1) * lineHeight / 2;
    lines.forEach((l, i) => {
        // Slightly randomize text position for handwritten feel
        const offsetX = (Math.random() - 0.5) * 10;
        const offsetY = (Math.random() - 0.5) * 5;
        ctx.fillText(l.trim(), 512 + offsetX, startY + i * lineHeight + offsetY);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    return tex;
}
