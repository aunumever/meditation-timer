import {
  setAudioModeAsync,
  createAudioPlayer,
  type AudioPlayer,
} from "expo-audio";
import type { SessionBell, IntervalBell } from "./settings";

const SESSION_BELL_ASSETS: Record<SessionBell, number> = {
  "rav-vast": require("@/assets/sounds/rav-vast-b-celtic-minor/fsharp3-b2.mp3"),
  "singing-bowl": require("@/assets/sounds/singing-bowl.mp3"),
  "gong-large": require("@/assets/sounds/gong-large.mp3"),
};

const INTERVAL_BELL_ASSETS: Record<IntervalBell, number> = {
  "rav-vast-e4": require("@/assets/sounds/rav-vast-b-celtic-minor/E4.mp3"),
  "rav-vast-csharp4": require("@/assets/sounds/rav-vast-b-celtic-minor/csharp4.mp3"),
  "rav-vast-a4": require("@/assets/sounds/rav-vast-b-celtic-minor/A4.mp3"),
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
// On pause, ALL currently-ringing bells are paused at their playback positions.
// On resume, they all continue from where they were.

const BELL_SPACING_MS = 13000;

interface SequenceState {
  asset: number;
  totalCount: number;
  /** How many bells have been created */
  bellsStarted: number;
  /** Wall-clock time when the sequence started (or last resumed) */
  startedAt: number;
  /** Accumulated elapsed ms before the last pause */
  elapsedBeforePause: number;
}

let sequence: SequenceState | null = null;
const activeTimers: ReturnType<typeof setTimeout>[] = [];

/** All bell players that are currently ringing (may overlap) */
const ringingPlayers: AudioPlayer[] = [];
/** Players scheduled for cleanup */
const cleanupTimers: ReturnType<typeof setTimeout>[] = [];
/** Active fade-out intervals */
const fadeTimers: ReturnType<typeof setInterval>[] = [];

function clearTimers(): void {
  for (const t of activeTimers) clearTimeout(t);
  activeTimers.length = 0;
}

function removeAllPlayers(): void {
  for (const t of cleanupTimers) clearTimeout(t);
  cleanupTimers.length = 0;
  for (const t of fadeTimers) clearInterval(t);
  fadeTimers.length = 0;
  for (const p of ringingPlayers) {
    try { p.pause(); } catch { /* ok */ }
    try { p.remove(); } catch { /* already removed */ }
  }
  ringingPlayers.length = 0;
}

function scheduleBell(asset: number, delayMs: number, bellIndex: number): void {
  const fire = () => {
    if (!sequence || bellIndex >= sequence.totalCount) return;

    const player = createAudioPlayer(asset);
    ringingPlayers.push(player);
    player.play();
    sequence.bellsStarted = bellIndex + 1;

    // Clean up player after it finishes (generous timeout for long sounds)
    const ct = setTimeout(() => {
      const idx = ringingPlayers.indexOf(player);
      if (idx !== -1) {
        ringingPlayers.splice(idx, 1);
        try { player.remove(); } catch { /* ok */ }
      }
    }, 15000);
    cleanupTimers.push(ct);
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
      // This bell's moment has fully passed, skip
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

  // Capture timeline position
  const elapsed = sequence.elapsedBeforePause + (Date.now() - sequence.startedAt);
  sequence.elapsedBeforePause = elapsed;
  sequence.startedAt = Date.now();

  // Stop pending bell timers (bells that haven't started yet)
  clearTimers();

  // Pause ALL currently-ringing bell sounds at their current playback positions
  for (const player of ringingPlayers) {
    player.pause();
  }

  // Cancel cleanup timers (don't remove paused players)
  for (const t of cleanupTimers) clearTimeout(t);
  cleanupTimers.length = 0;
}

export function resumeBells(): void {
  if (!sequence) return;

  // Resume ALL paused bell sounds from where they stopped
  for (const player of ringingPlayers) {
    player.play();
  }

  // Re-schedule cleanup for resumed players
  for (const player of ringingPlayers) {
    const ct = setTimeout(() => {
      const idx = ringingPlayers.indexOf(player);
      if (idx !== -1) {
        ringingPlayers.splice(idx, 1);
        try { player.remove(); } catch { /* ok */ }
      }
    }, 15000);
    cleanupTimers.push(ct);
  }

  // Schedule any remaining bells that haven't started yet
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
  removeAllPlayers();
  sequence = null;
}

/** Fade out all ringing players over ~400ms, then remove them */
export function fadeOutAndStop(): void {
  clearTimers();
  sequence = null;

  for (const t of cleanupTimers) clearTimeout(t);
  cleanupTimers.length = 0;

  const playersToFade = [...ringingPlayers];
  ringingPlayers.length = 0;

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
      const idx = fadeTimers.indexOf(fade);
      if (idx !== -1) fadeTimers.splice(idx, 1);
      for (const p of playersToFade) {
        try { p.pause(); } catch { /* ok */ }
        try { p.remove(); } catch { /* ok */ }
      }
    }
  }, intervalMs);
  fadeTimers.push(fade);
}

// --- Simple one-shot sounds (for interval bells and previews) ---

function playSound(asset: number): void {
  const player = createAudioPlayer(asset);
  player.play();
  ringingPlayers.push(player);
  const ct = setTimeout(() => {
    const idx = ringingPlayers.indexOf(player);
    if (idx !== -1) {
      ringingPlayers.splice(idx, 1);
      try { player.remove(); } catch { /* ok */ }
    }
  }, 10000);
  cleanupTimers.push(ct);
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
