import { describe, it, expect } from "vitest";
import {
  timerReducer,
  createInitialState,
  computeActiveTicks,
  detectBellEvents,
  type TimerState,
} from "../timer";

function play(durationSecs: number, prepSecs = 0, now = 0): TimerState {
  const initial = createInitialState(durationSecs, prepSecs);
  return timerReducer(initial, { type: "PLAY", durationSecs, prepSecs, now });
}

describe("timerReducer", () => {
  describe("PLAY", () => {
    it("transitions to prep when prepSecs > 0", () => {
      const state = play(600, 15);
      expect(state.phase).toBe("prep");
      expect(state.prepRemaining).toBe(15);
      expect(state.remaining).toBe(600);
    });

    it("transitions directly to meditating when no prep", () => {
      const state = play(600, 0);
      expect(state.phase).toBe("meditating");
      expect(state.remaining).toBe(600);
    });

    it("ignores 0-duration", () => {
      const initial = createInitialState(0, 0);
      const state = timerReducer(initial, { type: "PLAY", durationSecs: 0, prepSecs: 0, now: 0 });
      expect(state.phase).toBe("ready");
    });
  });

  describe("TICK during prep", () => {
    it("counts down prep", () => {
      const state = play(600, 15, 0);
      const ticked = timerReducer(state, { type: "TICK", now: 5000 });
      expect(ticked.phase).toBe("prep");
      expect(ticked.prepRemaining).toBeCloseTo(10, 0);
    });

    it("transitions to meditating when prep ends", () => {
      const state = play(600, 15, 0);
      const ticked = timerReducer(state, { type: "TICK", now: 16000 });
      expect(ticked.phase).toBe("meditating");
      expect(ticked.prepRemaining).toBe(0);
      // Timer starts fresh at full duration after prep
      expect(ticked.remaining).toBe(600);
    });
  });

  // Note: no-prep meditation has a 1s startedAt offset so the full
  // duration is visible for 1 second before counting down.
  // play(dur, 0, 0) sets startedAt = 1000, so tick times are +1s.

  describe("TICK during meditating", () => {
    it("counts down remaining time", () => {
      const state = play(60, 0, 0);
      const ticked = timerReducer(state, { type: "TICK", now: 11000 });
      expect(ticked.phase).toBe("meditating");
      expect(ticked.remaining).toBeCloseTo(50, 0);
    });

    it("transitions to overtime when time runs out", () => {
      const state = play(60, 0, 0);
      const ticked = timerReducer(state, { type: "TICK", now: 62000 });
      expect(ticked.phase).toBe("overtime");
      expect(ticked.remaining).toBe(0);
      expect(ticked.overtimeSecs).toBeCloseTo(1, 0);
    });
  });

  describe("TICK during overtime", () => {
    it("counts up overtime seconds", () => {
      const state = play(10, 0, 0);
      const overtime = timerReducer(state, { type: "TICK", now: 12000 });
      expect(overtime.phase).toBe("overtime");
      const later = timerReducer(overtime, { type: "TICK", now: 16000 });
      expect(later.overtimeSecs).toBeCloseTo(5, 0);
    });
  });

  describe("PAUSE / RESUME", () => {
    it("pauses during meditation", () => {
      const state = play(600, 0, 0);
      const ticked = timerReducer(state, { type: "TICK", now: 11000 });
      const paused = timerReducer(ticked, { type: "PAUSE", now: 11000 });
      expect(paused.phase).toBe("paused");
      expect(paused.startedAt).toBeNull();
      expect(paused.elapsedBeforePause).toBeCloseTo(10, 0);
    });

    it("does not pause during prep", () => {
      const state = play(600, 15, 0);
      const paused = timerReducer(state, { type: "PAUSE", now: 5000 });
      expect(paused.phase).toBe("prep");
    });

    it("resumes from paused to meditating", () => {
      const state = play(600, 0, 0);
      const paused = timerReducer(state, { type: "PAUSE", now: 11000 });
      const resumed = timerReducer(paused, { type: "RESUME", now: 20000 });
      expect(resumed.phase).toBe("meditating");
      expect(resumed.startedAt).toBe(20000);
    });

    it("preserves elapsed time across pause/resume cycle", () => {
      const state = play(600, 0, 0);
      const paused = timerReducer(state, { type: "PAUSE", now: 11000 });
      const resumed = timerReducer(paused, { type: "RESUME", now: 50000 });
      // 10s elapsed before pause, then 5s after resume = 15s total
      const ticked = timerReducer(resumed, { type: "TICK", now: 55000 });
      expect(ticked.remaining).toBeCloseTo(585, 0);
    });
  });

  describe("STOP", () => {
    it("resets to ready with original duration", () => {
      const state = play(600, 15, 0);
      const ticked = timerReducer(state, { type: "TICK", now: 30000 });
      const stopped = timerReducer(ticked, { type: "STOP" });
      expect(stopped.phase).toBe("ready");
      expect(stopped.remaining).toBe(600);
      expect(stopped.prepRemaining).toBe(15);
    });
  });

  describe("FOREGROUND_SYNC", () => {
    it("recalculates time from wall clock", () => {
      const state = play(600, 0, 0);
      // Simulate 5 minutes passing while backgrounded (+1s offset)
      const synced = timerReducer(state, { type: "FOREGROUND_SYNC", now: 301000 });
      expect(synced.remaining).toBeCloseTo(300, 0);
    });

    it("transitions to overtime if backgrounded past duration", () => {
      const state = play(60, 0, 0);
      const synced = timerReducer(state, { type: "FOREGROUND_SYNC", now: 121000 });
      expect(synced.phase).toBe("overtime");
      expect(synced.overtimeSecs).toBeCloseTo(60, 0);
    });

    it("completes prep and starts meditation if backgrounded through prep", () => {
      const state = play(600, 15, 0);
      const synced = timerReducer(state, { type: "FOREGROUND_SYNC", now: 20000 });
      expect(synced.phase).toBe("meditating");
      expect(synced.prepRemaining).toBe(0);
    });

    it("shows correct overtime when backgrounded through entire prep+session", () => {
      // 15s prep + 60s session, backgrounded for 120s total
      const state = play(60, 15, 0);
      const synced = timerReducer(state, { type: "FOREGROUND_SYNC", now: 120000 });
      expect(synced.phase).toBe("overtime");
      expect(synced.overtimeSecs).toBeCloseTo(45, 0); // 120 - 15 - 60 = 45s overtime
    });

    it("does nothing when paused", () => {
      const state = play(600, 0, 0);
      const paused = timerReducer(state, { type: "PAUSE", now: 10000 });
      const synced = timerReducer(paused, { type: "FOREGROUND_SYNC", now: 300000 });
      expect(synced.phase).toBe("paused");
    });
  });

  describe("SET_DURATION", () => {
    it("updates duration when ready", () => {
      const initial = createInitialState(600, 15);
      const updated = timerReducer(initial, { type: "SET_DURATION", durationSecs: 1800, prepSecs: 30 });
      expect(updated.durationSecs).toBe(1800);
      expect(updated.remaining).toBe(1800);
      expect(updated.prepSecs).toBe(30);
    });
  });

  describe("edge cases", () => {
    it("handles very short session (1 second)", () => {
      const state = play(1, 0, 0);
      expect(state.phase).toBe("meditating");
      const ticked = timerReducer(state, { type: "TICK", now: 2000 });
      expect(ticked.phase).toBe("overtime");
    });

    it("handles multiple pause/resume cycles", () => {
      let state = play(600, 0, 0);
      // Meditate 10s, pause, wait 100s, resume, meditate 10s (+1s offset)
      state = timerReducer(state, { type: "PAUSE", now: 11000 });
      state = timerReducer(state, { type: "RESUME", now: 111000 });
      state = timerReducer(state, { type: "TICK", now: 121000 });
      expect(state.remaining).toBeCloseTo(580, 0); // 20s elapsed total
    });

    it("stop resets all fields cleanly", () => {
      let state = play(600, 15, 0);
      state = timerReducer(state, { type: "TICK", now: 20000 });
      state = timerReducer(state, { type: "PAUSE", now: 30000 });
      state = timerReducer(state, { type: "STOP" });
      expect(state.phase).toBe("ready");
      expect(state.remaining).toBe(600);
      expect(state.prepRemaining).toBe(15);
      expect(state.overtimeSecs).toBe(0);
      expect(state.elapsedBeforePause).toBe(0);
      expect(state.startedAt).toBeNull();
    });
  });
});

describe("computeActiveTicks", () => {
  it("returns all ticks when full", () => {
    expect(computeActiveTicks(600, 600, 120)).toBe(120);
  });

  it("returns 0 ticks when empty", () => {
    expect(computeActiveTicks(0, 600, 120)).toBe(0);
  });

  it("returns half ticks at halfway", () => {
    expect(computeActiveTicks(300, 600, 120)).toBe(60);
  });

  it("handles 0 duration", () => {
    expect(computeActiveTicks(0, 0, 120)).toBe(120);
  });
});

describe("detectBellEvents", () => {
  it("fires session-start when prep transitions to meditating", () => {
    const prev: TimerState = { ...createInitialState(600, 15), phase: "prep", prepRemaining: 1 };
    const next: TimerState = { ...prev, phase: "meditating", prepRemaining: 0 };
    const events = detectBellEvents(prev, next, false, 15);
    expect(events).toEqual([{ type: "session-start" }]);
  });

  it("fires session-start on play with no prep", () => {
    const prev = createInitialState(600, 0);
    const next: TimerState = { ...prev, phase: "meditating" };
    const events = detectBellEvents(prev, next, false, 15);
    expect(events).toEqual([{ type: "session-start" }]);
  });

  it("fires session-end when meditating transitions to overtime", () => {
    const prev: TimerState = { ...createInitialState(600, 0), phase: "meditating", remaining: 1 };
    const next: TimerState = { ...prev, phase: "overtime", remaining: 0, overtimeSecs: 0 };
    const events = detectBellEvents(prev, next, false, 15);
    expect(events).toEqual([{ type: "session-end" }]);
  });

  it("fires interval bells at correct boundaries", () => {
    const base = createInitialState(3600, 0);
    const prev: TimerState = { ...base, phase: "meditating", remaining: 2710 };
    const next: TimerState = { ...base, phase: "meditating", remaining: 2695 };
    // elapsed goes from 890 to 905, crossing 900 (15 min)
    const events = detectBellEvents(prev, next, true, 15);
    expect(events).toEqual([{ type: "interval", elapsedMinutes: 15 }]);
  });

  it("does not fire interval bells when disabled", () => {
    const base = createInitialState(3600, 0);
    const prev: TimerState = { ...base, phase: "meditating", remaining: 2710 };
    const next: TimerState = { ...base, phase: "meditating", remaining: 2695 };
    const events = detectBellEvents(prev, next, false, 15);
    expect(events).toEqual([]);
  });

  it("does not fire events during normal meditation tick", () => {
    const base = createInitialState(600, 0);
    const prev: TimerState = { ...base, phase: "meditating", remaining: 500 };
    const next: TimerState = { ...base, phase: "meditating", remaining: 499 };
    const events = detectBellEvents(prev, next, false, 15);
    expect(events).toEqual([]);
  });

  it("does not fire events on pause/resume", () => {
    const base = createInitialState(600, 0);
    const prev: TimerState = { ...base, phase: "meditating", remaining: 500 };
    const next: TimerState = { ...base, phase: "paused", remaining: 500 };
    const events = detectBellEvents(prev, next, false, 15);
    expect(events).toEqual([]);
  });

  it("fires 60 min interval bell", () => {
    const base = createInitialState(7200, 0);
    const prev: TimerState = { ...base, phase: "meditating", remaining: 3605 };
    const next: TimerState = { ...base, phase: "meditating", remaining: 3595 };
    // elapsed crosses 3600 (60 min)
    const events = detectBellEvents(prev, next, true, 60);
    expect(events).toEqual([{ type: "interval", elapsedMinutes: 60 }]);
  });
});
