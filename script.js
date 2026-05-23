const MODES = {
  focus: { minutes: 25, color: '#FF6B6B' },
  short: { minutes: 5, color: '#4ECDC4' },
  long: { minutes: 15, color: '#45B7D1' },
};

const CIRCUMFERENCE = 2 * Math.PI * 108; // 678.584...

let currentMode = 'focus';
let totalSeconds = MODES.focus.minutes * 60;
let remainingSeconds = totalSeconds;
let timerId = null;
let isRunning = false;

const timeDisplay = document.querySelector('.time-display');
const progressFill = document.querySelector('.progress-ring-fill');
const toggleBtn = document.getElementById('toggleBtn');
const resetBtn = document.getElementById('resetBtn');
const tabs = document.querySelectorAll('.tab');

progressFill.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function updateDisplay() {
  timeDisplay.textContent = formatTime(remainingSeconds);
  const offset = CIRCUMFERENCE - (remainingSeconds / totalSeconds) * CIRCUMFERENCE;
  progressFill.style.strokeDashoffset = offset;
  document.title = `${formatTime(remainingSeconds)} - 番茄钟`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {
    // AudioContext may be blocked until user interaction
  }
}

function onTimerComplete() {
  pauseTimer();
  playBeep();
  toggleBtn.textContent = '开始';
  // Briefly flash the time display
  timeDisplay.style.color = MODES[currentMode].color;
  setTimeout(() => {
    timeDisplay.style.color = '';
  }, 1000);
}

function tick() {
  if (remainingSeconds > 0) {
    remainingSeconds--;
    updateDisplay();
  } else {
    onTimerComplete();
  }
}

function startTimer() {
  if (isRunning) return;
  isRunning = true;
  timerId = setInterval(tick, 1000);
  toggleBtn.textContent = '暂停';
}

function pauseTimer() {
  if (!isRunning) return;
  isRunning = false;
  clearInterval(timerId);
  timerId = null;
  toggleBtn.textContent = '继续';
}

function resetTimer() {
  pauseTimer();
  remainingSeconds = totalSeconds;
  toggleBtn.textContent = '开始';
  updateDisplay();
}

function switchMode(mode) {
  currentMode = mode;
  totalSeconds = MODES[mode].minutes * 60;
  remainingSeconds = totalSeconds;

  // Update UI colors
  progressFill.style.stroke = MODES[mode].color;
  toggleBtn.style.background = MODES[mode].color;

  document.body.classList.remove('mode-focus', 'mode-short', 'mode-long');
  document.body.classList.add(`mode-${mode}`);

  // Update active tab
  tabs.forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode);
  });

  resetTimer();
}

// Event listeners
toggleBtn.addEventListener('click', () => {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
});

resetBtn.addEventListener('click', resetTimer);

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    switchMode(tab.dataset.mode);
  });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    toggleBtn.click();
  } else if (e.code === 'Escape') {
    resetBtn.click();
  }
});

// Initialize
updateDisplay();
