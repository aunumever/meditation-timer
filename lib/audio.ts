import {
  setAudioModeAsync,
  createAudioPlayer,
  type AudioPlayer,
} from "expo-audio";
import type { SessionBell, IntervalBell } from "./settings";

const SESSION_BELL_ASSETS: Record<SessionBell, number> = {
  "bowl-deep": require("@/assets/sounds/bowl-deep.mp3"),
  "bowl-high": require("@/assets/sounds/bowl-high.mp3"),
  "bell-bright": require("@/assets/sounds/bell-bright.mp3"),
  "bell-soft": require("@/assets/sounds/bell-soft.mp3"),
  gong: require("@/assets/sounds/gong.mp3"),
};

const INTERVAL_BELL_ASSETS: Record<IntervalBell, number> = {
  "chime-soft": require("@/assets/sounds/chime-soft.mp3"),
  "chime-high": require("@/assets/sounds/chime-high.mp3"),
  woodblock: require("@/assets/sounds/woodblock.mp3"),
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

// Track all active players and timers so we can cancel everything
const activePlayers: AudioPlayer[] = [];
const activeTimers: ReturnType<typeof setTimeout>[] = [];

function trackPlayer(player: AudioPlayer): void {
  activePlayers.push(player);
  setTimeout(() => {
    const idx = activePlayers.indexOf(player);
    if (idx !== -1) {
      activePlayers.splice(idx, 1);
      player.remove();
    }
  }, 10000);
}

export function stopAllBells(): void {
  for (const timer of activeTimers) {
    clearTimeout(timer);
  }
  activeTimers.length = 0;

  for (const player of activePlayers) {
    player.pause();
    player.remove();
  }
  activePlayers.length = 0;
}

function playSound(asset: number): void {
  const player = createAudioPlayer(asset);
  player.play();
  trackPlayer(player);
}

export function playBellSequence(asset: number, count: number): void {
  let played = 0;
  const playNext = () => {
    if (played >= count) return;
    playSound(asset);
    played++;
    if (played < count) {
      const timer = setTimeout(playNext, 3000);
      activeTimers.push(timer);
    }
  };
  playNext();
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
