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

  playScratchSound();

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
  wrapper.classList.add('revealed');

  // Save result to Supabase
  if (typeof saveRevealResult === 'function') {
    saveRevealResult();
  }

  if (instruction) instruction.style.opacity = '0';

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  playRevealSound();

  setTimeout(() => {
    canvas.style.display = 'none'; // Click-through enabled
    if (successMsg) successMsg.classList.add('visible');

    // After 3 seconds, transition to the full image
    setTimeout(() => {
      wrapper.classList.add('full-revealed');
    }, 3000);

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
window.addEventListener('mouseup', () => {
  isDrawing = false;
  stopScratchSound();
});

// Touch Events
canvas.addEventListener('touchstart', (e) => {
  initAudio(); // Web Audio Context for reveal sound
  isDrawing = true;
  scratch(e);
}, { passive: false });
canvas.addEventListener('touchmove', scratch, { passive: false });
window.addEventListener('touchend', () => {
  isDrawing = false;
  stopScratchSound();
});

// Init
window.addEventListener('load', initCanvas);
// Handle resize roughly
window.addEventListener('resize', () => {
  // Only reset if not already revealed to avoid frustration
  if (!revealed) {
    initCanvas();
  }
});


/* Scratch Audio Logic */
const scratchAudio = document.getElementById('scratch-audio');
if (scratchAudio) {
  scratchAudio.volume = 0.5; // Set volume to 50%
}

function playScratchSound() {
  if (scratchAudio && scratchAudio.paused) {
    scratchAudio.currentTime = 0;
    scratchAudio.play().catch(e => console.log("Audio play failed (user interaction needed):", e));
  }
}

function stopScratchSound() {
  if (scratchAudio) {
    scratchAudio.pause();
    scratchAudio.currentTime = 0;
  }
}

/* Reset Logic */
const resetBtn = document.getElementById('reset-btn');

function resetReveal() {
  revealed = false;
  throttleCounter = 0;

  // Reset UI elements
  if (instruction) instruction.style.opacity = '1';
  if (successMsg) successMsg.classList.remove('visible');
  wrapper.classList.remove('revealed');
  wrapper.classList.remove('full-revealed');

  // Reset canvas
  canvas.style.display = 'block';
  // Trigger reflow to ensure display change registers before opacity transition
  void canvas.offsetWidth;
  canvas.style.opacity = '1';

  // Redraw the scratch layer
  initCanvas();
}

if (resetBtn) {
  resetBtn.addEventListener('click', resetReveal);
}

/* Hotspot Interaction Logic */
const detailView = document.getElementById('detail-view');
const detailImg = document.getElementById('detail-img');
const detailDesc = document.getElementById('detail-desc');
const closeDetailBtn = document.getElementById('close-detail');

const hotspots = {
  'hotspot-front': {
    img: './FlyingCar Front View.png',
    text: 'FlyingCar Front View'
  },
  'hotspot-wheel': {
    img: './FlyingCar Wheel2.png',
    text: 'Future Powerful Driving Wheel'
  },
  'hotspot-door': {
    img: './FiyingCar Wing.png',
    text: 'Vertical Takeoff Wing Door'
  }
};

function showDetail(id) {
  const data = hotspots[id];
  if (!data) return;

  detailImg.src = data.img;
  detailDesc.textContent = data.text;
  detailView.classList.add('visible');

  // Add subtle sound effect if audioCtx is available
  if (audioCtx && audioCtx.state !== 'suspended') {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.frequency.value = 880;
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gainNode).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
  }
}

function hideDetail() {
  detailView.classList.remove('visible');
}

document.querySelectorAll('.hotspot').forEach(btn => {
  btn.addEventListener('click', () => showDetail(btn.id));
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    showDetail(btn.id);
  });
});

if (closeDetailBtn) {
  closeDetailBtn.addEventListener('click', hideDetail);
}

// Ensure detail view is hidden on reset
const originalResetReveal = resetReveal;
resetReveal = function () {
  originalResetReveal();
  hideDetail();
};

// Inquiry Form Handling
const inquiryForm = document.getElementById('inquiry-form');
const formStatus = document.getElementById('form-status');
const submitBtn = document.getElementById('submit-btn');

if (inquiryForm) {
  inquiryForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable button and show loading state
    submitBtn.disabled = true;
    const originalBtnText = submitBtn.textContent;
    submitBtn.textContent = '제출 중...';
    formStatus.textContent = '';
    formStatus.className = 'form-status';

    const formData = {
      name: document.getElementById('user-name').value,
      email: document.getElementById('user-email').value,
      phone: document.getElementById('user-phone').value,
      message: document.getElementById('user-message').value
    };

    if (typeof saveInquiry === 'function') {
      const result = await saveInquiry(formData);

      if (result.success) {
        formStatus.textContent = '상담 신청이 완료되었습니다. 감사합니다!';
        formStatus.classList.add('success');
        inquiryForm.reset();
      } else {
        formStatus.textContent = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        formStatus.classList.add('error');
      }
    } else {
      console.error('saveInquiry function not found');
      formStatus.textContent = '시스템 설정 오류입니다. 관리자에게 문의하세요.';
      formStatus.classList.add('error');
    }

    // Restore button
    submitBtn.disabled = false;
    submitBtn.textContent = originalBtnText;
  });
}
