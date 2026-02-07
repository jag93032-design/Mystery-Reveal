const canvas = document.getElementById('scratch-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const wrapper = document.querySelector('.teaser-wrapper');
const successMsg = document.getElementById('success-msg');
const instruction = document.querySelector('.instruction-overlay');

let isDrawing = false;
let revealed = false;
let throttleCounter = 0;

function initCanvas() {
  const width = wrapper.clientWidth;
  const height = wrapper.clientHeight;

  // Set physical pixel size
  canvas.width = width;
  canvas.height = height;

  // Create a sleek gradient cover (Simulating a silver/holographic coating)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#cfd9df');
  gradient.addColorStop(0.5, '#e2ebf0');
  gradient.addColorStop(1, '#cfd9df');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add some Noise/Texture to make it look realistic (Optional simple noise)
  addNoise(width, height);

  // Text Instructions on the coating
  ctx.save();
  ctx.fillStyle = '#666';
  ctx.font = '800 32px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Shadow for text
  ctx.shadowColor = 'rgba(255,255,255,0.8)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = 1;
  ctx.shadowOffsetY = 1;

  ctx.fillText('SCRATCH HERE', width / 2, height / 2);

  ctx.font = '600 16px Inter, sans-serif';
  ctx.fillStyle = '#888';
  ctx.fillText('Discover the Secret', width / 2, height / 2 + 35);
  ctx.restore();
}

function addNoise(w, h) {
  const idata = ctx.getImageData(0, 0, w, h);
  const data = idata.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 20;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(idata, 0, 0);
}

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function scratch(e) {
  if (!isDrawing || revealed) return;
  e.preventDefault(); // Stop touch scrolling

  const pos = getPos(e);

  ctx.globalCompositeOperation = 'destination-out';
  ctx.beginPath();
  // Varying brush size for realism
  ctx.arc(pos.x, pos.y, 40, 0, Math.PI * 2);
  ctx.fill();

  // Throttle the check to avoid lag
  throttleCounter++;
  if (throttleCounter % 15 === 0) {
    checkRevealPercentage();
  }
}

function checkRevealPercentage() {
  // Optimization: Read small chunks or use a stride
  // 'willReadFrequently: true' in getContext helps here
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  let transparentCount = 0;

  // Check every 16th pixel (4x4 grid) to be faster
  const stride = 4 * 16;
  let totalChecked = 0;

  for (let i = 3; i < data.length; i += stride) {
    if (data[i] === 0) {
      transparentCount++;
    }
    totalChecked++;
  }

  const percentage = transparentCount / totalChecked;

  if (percentage > 0.45) { // 45% threshold
    completeReveal();
  }
}

// Sound Effect using Web Audio API
let audioCtx;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
}

function playRevealSound() {
  if (!audioCtx) return;

  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major Chord (C5, E5, G5, C6)

  notes.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Smooth attack and release for a "premium" chime quality
    gainNode.gain.setValueAtTime(0, now + i * 0.05);
    gainNode.gain.linearRampToValueAtTime(0.3, now + i * 0.05 + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 1.2);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(now + i * 0.05);
    osc.stop(now + i * 0.05 + 1.2);
  });
}

function completeReveal() {
  revealed = true;
  canvas.style.transition = 'opacity 0.8s ease-out';
  canvas.style.opacity = '0';

  if (instruction) instruction.style.opacity = '0';

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  playRevealSound();

  setTimeout(() => {
    canvas.style.display = 'none'; // Click-through enabled
    if (successMsg) successMsg.classList.add('visible');

    // Optional: Trigger confetti or other effects here
  }, 800);
}

// Mouse Events
canvas.addEventListener('mousedown', (e) => {
  initAudio();
  isDrawing = true;
  scratch(e);
});
canvas.addEventListener('mousemove', scratch);
window.addEventListener('mouseup', () => isDrawing = false);

// Touch Events
canvas.addEventListener('touchstart', (e) => {
  initAudio();
  isDrawing = true;
  scratch(e);
}, { passive: false });
canvas.addEventListener('touchmove', scratch, { passive: false });
window.addEventListener('touchend', () => isDrawing = false);

// Init
window.addEventListener('load', initCanvas);
// Handle resize roughly
window.addEventListener('resize', () => {
  // Only reset if not already revealed to avoid frustration
  if (!revealed) {
    initCanvas();
  }
});


/* Reset Logic */
const resetBtn = document.getElementById('reset-btn');

function resetReveal() {
  revealed = false;
  throttleCounter = 0;

  // Reset canvas
  canvas.style.display = 'block';
  // Trigger reflow to ensure display change registers before opacity transition
  void canvas.offsetWidth;
  canvas.style.opacity = '1';
  
  // Redraw the scratch layer
  initCanvas();

  // Reset UI elements
  if (instruction) instruction.style.opacity = '1';
  if (successMsg) successMsg.classList.remove('visible');
}

if (resetBtn) {
  resetBtn.addEventListener('click', resetReveal);
}
