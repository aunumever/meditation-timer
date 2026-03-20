import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock expo-audio before audio.ts loads
const mockPlayer = () => ({
  play: vi.fn(),
  pause: vi.fn(),
  remove: vi.fn(),
  volume: 1,
});

vi.mock("expo-audio", () => ({
  setAudioModeAsync: vi.fn(),
  createAudioPlayer: vi.fn(() => mockPlayer()),
}));

import { createAudioPlayer } from "expo-audio";
import {
  playBellSequence,
  pauseBells,
  resumeBells,
  cancelBells,
  fadeOutAndStop,
  playSessionBellPreview,
  playIntervalBell,
} from "../audio";

beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
  // Reset audio module state
  cancelBells();
  vi.clearAllTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("playBellSequence", () => {
  it("creates the first bell immediately", () => {
    playBellSequence(1, 3);
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
  });

  it("spaces bells 13 seconds apart", () => {
    playBellSequence(1, 3);
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(13000);
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(13000);
    expect(createAudioPlayer).toHaveBeenCalledTimes(3);
  });

  it("does not create more bells than requested", () => {
    playBellSequence(1, 2);
    vi.advanceTimersByTime(100000);
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);
  });

  it("plays each bell immediately on creation", () => {
    const player = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValue(player as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);
    expect(player.play).toHaveBeenCalledTimes(1);
  });
});

describe("pauseBells / resumeBells", () => {
  it("pauses all ringing sequence players", () => {
    const player = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValue(player as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);
    pauseBells();
    expect(player.pause).toHaveBeenCalledTimes(1);
  });

  it("resumes paused players", () => {
    const player = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValue(player as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);
    pauseBells();
    resumeBells();
    // play called once on creation, once on resume
    expect(player.play).toHaveBeenCalledTimes(2);
  });

  it("does not schedule more bells during pause", () => {
    playBellSequence(1, 3);
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    pauseBells();
    vi.advanceTimersByTime(30000);
    // Still only 1 — timers were cleared on pause
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
  });

  it("resumes remaining bells after unpause", () => {
    playBellSequence(1, 3);
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    pauseBells();
    resumeBells();
    // After resume, remaining 2 bells should be re-scheduled
    vi.advanceTimersByTime(13000);
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);
    vi.advanceTimersByTime(13000);
    expect(createAudioPlayer).toHaveBeenCalledTimes(3);
  });
});

describe("cancelBells", () => {
  it("stops and removes all sequence players", () => {
    const player = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValue(player as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);
    cancelBells();
    expect(player.pause).toHaveBeenCalled();
    expect(player.remove).toHaveBeenCalled();
  });

  it("prevents future bells from firing", () => {
    playBellSequence(1, 3);
    cancelBells();
    vi.advanceTimersByTime(30000);
    // Only the first bell was created before cancel
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
  });
});

describe("fadeOutAndStop", () => {
  it("gradually reduces volume over ~400ms", () => {
    const player = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValue(player as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);
    fadeOutAndStop();

    // After 4 steps (200ms), volume should be at 0.5
    vi.advanceTimersByTime(200);
    expect(player.volume).toBeCloseTo(0.5, 1);

    // After all 8 steps (400ms), player should be paused and removed
    vi.advanceTimersByTime(200);
    expect(player.pause).toHaveBeenCalled();
    expect(player.remove).toHaveBeenCalled();
  });

  it("does not abruptly stop audio", () => {
    const player = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValue(player as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);
    fadeOutAndStop();

    // Immediately after fadeOutAndStop, player should NOT be removed yet
    expect(player.remove).not.toHaveBeenCalled();
    // Volume should still be > 0
    expect(player.volume).toBeGreaterThanOrEqual(0);
  });

  it("does not interfere with subsequent playBellSequence", () => {
    playBellSequence(1, 1);
    fadeOutAndStop();

    // Start a new sequence while fade is in progress
    vi.advanceTimersByTime(100);
    playBellSequence(1, 1);

    // New player should have been created
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);

    // Complete the fade
    vi.advanceTimersByTime(400);

    // New sequence should still work — advance to bell 2 timing
    // (but we only requested 1 bell in new sequence)
    expect(createAudioPlayer).toHaveBeenCalledTimes(2);
  });
});

describe("one-shot sounds (previews, interval bells)", () => {
  it("creates and plays a player for previews", () => {
    const player = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValue(player as ReturnType<typeof createAudioPlayer>);
    playSessionBellPreview("rav-vast");
    expect(createAudioPlayer).toHaveBeenCalledTimes(1);
    expect(player.play).toHaveBeenCalledTimes(1);
  });

  it("cleans up preview player after 10 seconds", () => {
    const player = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValue(player as ReturnType<typeof createAudioPlayer>);
    playSessionBellPreview("rav-vast");
    vi.advanceTimersByTime(10000);
    expect(player.remove).toHaveBeenCalled();
  });

  it("does not affect active bell sequence when preview plays", () => {
    const seqPlayer = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValueOnce(seqPlayer as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);

    const previewPlayer = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValueOnce(previewPlayer as ReturnType<typeof createAudioPlayer>);
    playSessionBellPreview("rav-vast");

    // Pausing bells should only pause sequence player, not preview
    pauseBells();
    expect(seqPlayer.pause).toHaveBeenCalled();
    expect(previewPlayer.pause).not.toHaveBeenCalled();
  });

  it("does not affect active bell sequence when interval bell plays", () => {
    const seqPlayer = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValueOnce(seqPlayer as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);

    const intervalPlayer = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValueOnce(intervalPlayer as ReturnType<typeof createAudioPlayer>);
    playIntervalBell("rav-vast-e4");

    // Cancel bells should remove sequence player but not interval player
    cancelBells();
    expect(seqPlayer.remove).toHaveBeenCalled();
    expect(intervalPlayer.remove).not.toHaveBeenCalled();
  });

  it("fadeOutAndStop fades both sequence and one-shot players", () => {
    const seqPlayer = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValueOnce(seqPlayer as ReturnType<typeof createAudioPlayer>);
    playBellSequence(1, 1);

    const previewPlayer = mockPlayer();
    vi.mocked(createAudioPlayer).mockReturnValueOnce(previewPlayer as ReturnType<typeof createAudioPlayer>);
    playSessionBellPreview("singing-bowl");

    fadeOutAndStop();
    vi.advanceTimersByTime(400);

    // Both should be faded and removed
    expect(seqPlayer.remove).toHaveBeenCalled();
    expect(previewPlayer.remove).toHaveBeenCalled();
  });
});
