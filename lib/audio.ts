import {
  setAudioModeAsync,
  createAudioPlayer,
  type AudioPlayer,
} from "expo-audio";
import type { SessionBell, IntervalBell, BackgroundNoise } from "./settings";

const SESSION_BELL_ASSETS: Record<SessionBell, number> = {
  "rav-vast": require("@/assets/sounds/active/bells/rav-vast.mp3"),
  "singing-bowl": require("@/assets/sounds/active/bells/singing-bowl.mp3"),
  "gong-large": require("@/assets/sounds/active/bells/gong-large.mp3"),
};

const INTERVAL_BELL_ASSETS: Record<IntervalBell, number> = {
  "rav-vast-e4": require("@/assets/sounds/active/intervals/rav-vast-e4.mp3"),
  "rav-vast-csharp4": require("@/assets/sounds/active/intervals/rav-vast-csharp4.mp3"),
  "rav-vast-a4": require("@/assets/sounds/active/intervals/rav-vast-a4.mp3"),
};

export async function initAudioMode(overrideSilent: boolean): Promise<void> {
  await setAudioModeAsync({
    playsInSilentMode: overrideSilent,
  });
}

export function getSessionBellAsset(bell: SessionBell): number {
  return SESSION_BELL_ASSETS[bell];
}

export function getIntervalBellAsset(bell: IntervalBell): number {
  return INTERVAL_BELL_ASSETS[bell];
}

// --- Bell sequence timeline ---
// Bells are spaced at BELL_SPACING_MS intervals.
// Each bell's sound may ring longer than the spacing (overlap is fine).
// On pause, ALL currently-ringing sequence bells are paused.
// On resume, they continue from where they were.

const BELL_SPACING_MS = 13000;

interface SequenceState {
  asset: number;
  totalCount: number;
  bellsStarted: number;
  startedAt: number;
  elapsedBeforePause: number;
}

let sequence: SequenceState | null = null;
const activeTimers: ReturnType<typeof setTimeout>[] = [];

/** Sequence bell players (managed by pause/resume/cancel) */
const sequencePlayers: AudioPlayer[] = [];
/** One-shot players (interval bells, previews — independent lifecycle) */
const oneshotPlayers: AudioPlayer[] = [];
/** Cleanup timers for sequence players */
const seqCleanupTimers: ReturnType<typeof setTimeout>[] = [];
/** Cleanup timers for one-shot players */
const oneshotCleanupTimers: ReturnType<typeof setTimeout>[] = [];

function clearTimers(): void {
  for (const t of activeTimers) clearTimeout(t);
  activeTimers.length = 0;
}

function removeSequencePlayers(): void {
  for (const t of seqCleanupTimers) clearTimeout(t);
  seqCleanupTimers.length = 0;
  for (const p of sequencePlayers) {
    try { p.pause(); } catch { /* ok */ }
    try { p.remove(); } catch { /* already removed */ }
  }
  sequencePlayers.length = 0;
}

function removeOneshotPlayers(): void {
  for (const t of oneshotCleanupTimers) clearTimeout(t);
  oneshotCleanupTimers.length = 0;
  for (const p of oneshotPlayers) {
    try { p.pause(); } catch { /* ok */ }
    try { p.remove(); } catch { /* already removed */ }
  }
  oneshotPlayers.length = 0;
}

function scheduleBell(asset: number, delayMs: number, bellIndex: number): void {
  const fire = () => {
    if (!sequence || bellIndex >= sequence.totalCount) return;

    const player = createAudioPlayer(asset);
    sequencePlayers.push(player);
    player.play();
    sequence.bellsStarted = bellIndex + 1;

    const ct = setTimeout(() => {
      const idx = sequencePlayers.indexOf(player);
      if (idx !== -1) {
        sequencePlayers.splice(idx, 1);
        try { player.remove(); } catch { /* ok */ }
      }
    }, 15000);
    seqCleanupTimers.push(ct);
  };

  if (delayMs <= 0) {
    fire();
  } else {
    const timer = setTimeout(fire, delayMs);
    activeTimers.push(timer);
  }
}

function startSequenceFrom(asset: number, totalCount: number, elapsedMs: number): void {
  const now = Date.now();

  sequence = {
    asset,
    totalCount,
    bellsStarted: 0,
    startedAt: now,
    elapsedBeforePause: elapsedMs,
  };

  for (let i = 0; i < totalCount; i++) {
    const bellTimeMs = i * BELL_SPACING_MS;
    const delayMs = bellTimeMs - elapsedMs;

    if (delayMs < -500) {
      sequence.bellsStarted = i + 1;
      continue;
    }

    scheduleBell(asset, Math.max(0, delayMs), i);
  }
}

export function playBellSequence(asset: number, count: number): void {
  cancelBells();
  startSequenceFrom(asset, count, 0);
}

export function pauseBells(): void {
  if (!sequence) return;

  const elapsed = sequence.elapsedBeforePause + (Date.now() - sequence.startedAt);
  sequence.elapsedBeforePause = elapsed;
  sequence.startedAt = Date.now();

  clearTimers();

  for (const player of sequencePlayers) {
    player.pause();
  }

  for (const t of seqCleanupTimers) clearTimeout(t);
  seqCleanupTimers.length = 0;
}

export function resumeBells(): void {
  if (!sequence) return;

  for (const player of sequencePlayers) {
    player.play();
  }

  for (const player of sequencePlayers) {
    const ct = setTimeout(() => {
      const idx = sequencePlayers.indexOf(player);
      if (idx !== -1) {
        sequencePlayers.splice(idx, 1);
        try { player.remove(); } catch { /* ok */ }
      }
    }, 15000);
    seqCleanupTimers.push(ct);
  }

  const elapsed = sequence.elapsedBeforePause;
  sequence.startedAt = Date.now();

  for (let i = sequence.bellsStarted; i < sequence.totalCount; i++) {
    const bellTimeMs = i * BELL_SPACING_MS;
    const delayMs = bellTimeMs - elapsed;

    if (delayMs < -500) continue;

    scheduleBell(sequence.asset, Math.max(0, delayMs), i);
  }
}

export function cancelBells(): void {
  clearTimers();
  removeSequencePlayers();
  sequence = null;
}

/** Fade out all players (sequence + oneshot) over ~400ms, then remove them */
export function fadeOutAndStop(): void {
  clearTimers();
  sequence = null;

  for (const t of seqCleanupTimers) clearTimeout(t);
  seqCleanupTimers.length = 0;
  for (const t of oneshotCleanupTimers) clearTimeout(t);
  oneshotCleanupTimers.length = 0;

  const playersToFade = [...sequencePlayers, ...oneshotPlayers];
  sequencePlayers.length = 0;
  oneshotPlayers.length = 0;

  if (playersToFade.length === 0) return;

  const steps = 8;
  const intervalMs = 50;
  let step = 0;

  const fade = setInterval(() => {
    step++;
    const vol = 1 - step / steps;
    for (const p of playersToFade) {
      try { p.volume = Math.max(0, vol); } catch { /* ok */ }
    }
    if (step >= steps) {
      clearInterval(fade);
      for (const p of playersToFade) {
        try { p.pause(); } catch { /* ok */ }
        try { p.remove(); } catch { /* ok */ }
      }
    }
  }, intervalMs);
}

// --- One-shot sounds (interval bells and previews) ---
// These use a separate player pool so they don't interfere with
// bell sequence pause/resume/cancel.

function playSound(asset: number): void {
  const player = createAudioPlayer(asset);
  player.play();
  oneshotPlayers.push(player);
  const ct = setTimeout(() => {
    const idx = oneshotPlayers.indexOf(player);
    if (idx !== -1) {
      oneshotPlayers.splice(idx, 1);
      try { player.remove(); } catch { /* ok */ }
    }
  }, 10000);
  oneshotCleanupTimers.push(ct);
}

export function playSessionBell(bell: SessionBell, count: number): void {
  playBellSequence(SESSION_BELL_ASSETS[bell], count);
}

export function playIntervalBell(bell: IntervalBell): void {
  playSound(INTERVAL_BELL_ASSETS[bell]);
}

export function playSessionBellPreview(bell: SessionBell): void {
  playSound(SESSION_BELL_ASSETS[bell]);
}

export function playIntervalBellPreview(bell: IntervalBell): void {
  playSound(INTERVAL_BELL_ASSETS[bell]);
}

// --- Background noise (looping ambient sound during meditation) ---

const BACKGROUND_NOISE_ASSETS: Record<Exclude<BackgroundNoise, "none">, number> = {
  "brown-noise": require("@/assets/sounds/active/background/brown-noise.mp3"),
};

// Double-buffered background noise for gapless looping.
// Two players alternate with a crossfade overlap so there's never silence.

const BG_LOOP_DURATION_MS = 8000;
const BG_CROSSFADE_MS = 500;
const BG_SCHEDULE_AHEAD_MS = BG_CROSSFADE_MS + 200;

let bgPlayers: AudioPlayer[] = [];
let bgLoopTimer: ReturnType<typeof setTimeout> | null = null;
let bgFadeTimer: ReturnType<typeof setInterval> | null = null;
let bgAsset: number | null = null;
let bgTargetVol = 1;
let bgActive = false;

function clearBgTimers(): void {
  if (bgFadeTimer) { clearInterval(bgFadeTimer); bgFadeTimer = null; }
  if (bgLoopTimer) { clearTimeout(bgLoopTimer); bgLoopTimer = null; }
}

function removeAllBgPlayers(): void {
  for (const p of bgPlayers) {
    try { p.pause(); } catch { /* ok */ }
    try { p.remove(); } catch { /* ok */ }
  }
  bgPlayers = [];
}

function scheduleNextLoop(): void {
  if (!bgActive || !bgAsset) return;

  bgLoopTimer = setTimeout(() => {
    if (!bgActive || !bgAsset) return;

    // Create next player and start it
    const next = createAudioPlayer(bgAsset);
    next.volume = bgTargetVol;
    next.play();
    bgPlayers.push(next);

    // Remove oldest player after crossfade completes
    setTimeout(() => {
      if (bgPlayers.length > 1) {
        const old = bgPlayers.shift();
        if (old) {
          try { old.pause(); } catch { /* ok */ }
          try { old.remove(); } catch { /* ok */ }
        }
      }
    }, BG_CROSSFADE_MS + 100);

    // Schedule the next one
    scheduleNextLoop();
  }, BG_LOOP_DURATION_MS - BG_SCHEDULE_AHEAD_MS);
}

export function startBackgroundNoise(noise: BackgroundNoise): void {
  stopBackgroundNoiseImmediate();
  if (noise === "none") return;

  bgAsset = BACKGROUND_NOISE_ASSETS[noise];
  bgActive = true;
  bgTargetVol = 0;

  const player = createAudioPlayer(bgAsset);
  bgPlayers.push(player);

  // Start muted, then begin fade-in after player is playing
  player.play();
  // Force volume to 0 after play starts (expo-audio may reset volume on play)
  player.volume = 0;

  // Fade in over 3 seconds, starting after a brief delay
  setTimeout(() => {
    const steps = 60;
    const intervalMs = 50;
    let step = 0;
    bgFadeTimer = setInterval(() => {
      step++;
      bgTargetVol = Math.min(1, step / steps);
      for (const p of bgPlayers) {
        try { p.volume = bgTargetVol; } catch { /* ok */ }
      }
      if (step >= steps) {
        if (bgFadeTimer) { clearInterval(bgFadeTimer); bgFadeTimer = null; }
      }
    }, intervalMs);
  }, 100);

  // Start the loop scheduling
  scheduleNextLoop();
}

function stopBackgroundNoiseImmediate(): void {
  bgActive = false;
  bgAsset = null;
  clearBgTimers();
  removeAllBgPlayers();
}

export function stopBackgroundNoise(): void {
  if (!bgActive && bgPlayers.length === 0) return;

  bgActive = false;
  if (bgLoopTimer) { clearTimeout(bgLoopTimer); bgLoopTimer = null; }
  if (bgFadeTimer) { clearInterval(bgFadeTimer); bgFadeTimer = null; }

  const playersToFade = [...bgPlayers];
  bgPlayers = [];
  bgAsset = null;

  // Fade out over 2 seconds
  const steps = 40;
  const intervalMs = 50;
  let step = 0;
  const startVol = bgTargetVol;

  const fadeOut = setInterval(() => {
    step++;
    const vol = startVol * (1 - step / steps);
    for (const p of playersToFade) {
      try { p.volume = Math.max(0, vol); } catch { /* ok */ }
    }
    if (step >= steps) {
      clearInterval(fadeOut);
      for (const p of playersToFade) {
        try { p.pause(); } catch { /* ok */ }
        try { p.remove(); } catch { /* ok */ }
      }
    }
  }, intervalMs);
}

export function pauseBackgroundNoise(): void {
  for (const p of bgPlayers) {
    try { p.pause(); } catch { /* ok */ }
  }
  clearBgTimers();
}

export function resumeBackgroundNoise(): void {
  if (bgPlayers.length === 0) return;
  for (const p of bgPlayers) {
    try { p.play(); } catch { /* ok */ }
  }
  bgActive = true;
  scheduleNextLoop();
}

export function previewBackgroundNoise(noise: BackgroundNoise): void {
  stopBackgroundNoiseImmediate();
  if (noise === "none") return;

  bgAsset = BACKGROUND_NOISE_ASSETS[noise];
  bgActive = true;
  bgTargetVol = 1;

  const player = createAudioPlayer(bgAsset);
  player.volume = 1;
  player.play();
  bgPlayers.push(player);

  scheduleNextLoop();

  // Auto-stop after 4 seconds
  setTimeout(() => {
    if (bgActive) stopBackgroundNoise();
  }, 4000);
}
