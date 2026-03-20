export type TimerPhase = "ready" | "prep" | "meditating" | "paused" | "overtime";

export interface TimerState {
  phase: TimerPhase;
  /** Total meditation duration in seconds (not including prep) */
  durationSecs: number;
  /** Prep duration in seconds */
  prepSecs: number;
  /** Remaining prep seconds (counts down) */
  prepRemaining: number;
  /** Remaining meditation seconds (counts down) */
  remaining: number;
  /** Overtime seconds (counts up from 0 after meditation ends) */
  overtimeSecs: number;
  /** Wall-clock timestamp when the current phase started ticking */
  startedAt: number | null;
  /** Accumulated elapsed seconds before the last pause */
  elapsedBeforePause: number;
}

export type TimerAction =
  | { type: "PLAY"; durationSecs: number; prepSecs: number; now: number }
  | { type: "TICK"; now: number }
  | { type: "PAUSE"; now: number }
  | { type: "RESUME"; now: number }
  | { type: "STOP" }
  | { type: "FOREGROUND_SYNC"; now: number }
  | { type: "SET_DURATION"; durationSecs: number; prepSecs: number };

export function createInitialState(durationSecs: number, prepSecs: number): TimerState {
  return {
    phase: "ready",
    durationSecs,
    prepSecs,
    prepRemaining: prepSecs,
    remaining: durationSecs,
    overtimeSecs: 0,
    startedAt: null,
    elapsedBeforePause: 0,
  };
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case "PLAY": {
      const { durationSecs, prepSecs, now } = action;
      if (durationSecs <= 0) return state;
      const hasPrep = prepSecs > 0;
      return {
        phase: hasPrep ? "prep" : "meditating",
        durationSecs,
        prepSecs,
        prepRemaining: prepSecs,
        remaining: durationSecs,
        overtimeSecs: 0,
        startedAt: now,
        elapsedBeforePause: 0,
      };
    }

    case "TICK":
    case "FOREGROUND_SYNC": {
      if (state.phase === "ready" || state.phase === "paused") return state;
      if (state.startedAt === null) return state;

      const wallElapsed = (action.now - state.startedAt) / 1000;
      const totalElapsed = state.elapsedBeforePause + wallElapsed;

      if (state.phase === "prep") {
        const prepRemaining = Math.max(0, state.prepSecs - totalElapsed);
        if (prepRemaining <= 0) {
          // Transition to meditating — reset startedAt for meditation phase
          const overflowSecs = totalElapsed - state.prepSecs;
          const meditationRemaining = Math.max(0, state.durationSecs - overflowSecs);
          if (meditationRemaining <= 0) {
            // Backgrounded through entire session — keep original timeline
            // so overtime TICK can compute correctly
            return {
              ...state,
              phase: "overtime",
              prepRemaining: 0,
              remaining: 0,
              overtimeSecs: overflowSecs - state.durationSecs,
            };
          }
          return {
            ...state,
            phase: "meditating",
            prepRemaining: 0,
            remaining: meditationRemaining,
            startedAt: state.startedAt,
            elapsedBeforePause: state.elapsedBeforePause,
          };
        }
        return { ...state, prepRemaining };
      }

      if (state.phase === "meditating") {
        // totalElapsed includes prep time
        const meditationElapsed = totalElapsed - state.prepSecs;
        const remaining = Math.max(0, state.durationSecs - meditationElapsed);
        if (remaining <= 0) {
          const overtimeElapsed = meditationElapsed - state.durationSecs;
          return {
            ...state,
            phase: "overtime",
            remaining: 0,
            overtimeSecs: overtimeElapsed,
          };
        }
        return { ...state, remaining };
      }

      if (state.phase === "overtime") {
        const meditationElapsed = totalElapsed - state.prepSecs;
        const overtimeElapsed = meditationElapsed - state.durationSecs;
        return { ...state, overtimeSecs: Math.max(0, overtimeElapsed) };
      }

      return state;
    }

    case "PAUSE": {
      if (state.phase !== "meditating") return state;
      if (state.startedAt === null) return state;
      const wallElapsed = (action.now - state.startedAt) / 1000;
      return {
        ...state,
        phase: "paused",
        elapsedBeforePause: state.elapsedBeforePause + wallElapsed,
        startedAt: null,
      };
    }

    case "RESUME": {
      if (state.phase !== "paused") return state;
      return {
        ...state,
        phase: "meditating",
        startedAt: action.now,
      };
    }

    case "STOP": {
      return createInitialState(state.durationSecs, state.prepSecs);
    }

    case "SET_DURATION": {
      if (state.phase !== "ready") return state;
      return createInitialState(action.durationSecs, action.prepSecs);
    }

    default:
      return state;
  }
}

/**
 * Compute fractional active ticks (not rounded).
 * E.g. 60.3 means 60 ticks fully active, tick 61 is at 30% opacity.
 */
export function computeActiveTicks(
  remaining: number,
  durationSecs: number,
  totalTicks: number,
): number {
  if (durationSecs <= 0) return totalTicks;
  const fraction = Math.max(0, Math.min(1, remaining / durationSecs));
  return fraction * totalTicks;
}

/**
 * Detect if a bell should fire at the current tick.
 * Returns which bell event occurred, if any.
 */
export type BellEvent =
  | { type: "session-start" }
  | { type: "session-end" }
  | { type: "interval"; elapsedMinutes: number };

export function detectBellEvents(
  prevState: TimerState,
  nextState: TimerState,
  intervalEnabled: boolean,
  intervalFrequencyMins: number,
): BellEvent[] {
  const events: BellEvent[] = [];

  // Prep → Meditating transition: session start bell
  if (prevState.phase === "prep" && nextState.phase === "meditating") {
    events.push({ type: "session-start" });
  }

  // PLAY with no prep: session start bell
  if (prevState.phase === "ready" && nextState.phase === "meditating") {
    events.push({ type: "session-start" });
  }

  // Meditating → Overtime transition: session end bell
  if (prevState.phase === "meditating" && nextState.phase === "overtime") {
    events.push({ type: "session-end" });
  }

  // Interval bells during meditation
  if (
    intervalEnabled &&
    intervalFrequencyMins > 0 &&
    prevState.phase === "meditating" &&
    nextState.phase === "meditating"
  ) {
    const intervalSecs = intervalFrequencyMins * 60;
    const prevElapsed = prevState.durationSecs - prevState.remaining;
    const nextElapsed = nextState.durationSecs - nextState.remaining;

    // Check each interval boundary
    for (
      let boundary = intervalSecs;
      boundary < nextState.durationSecs;
      boundary += intervalSecs
    ) {
      if (prevElapsed < boundary && nextElapsed >= boundary) {
        events.push({ type: "interval", elapsedMinutes: boundary / 60 });
      }
    }
  }

  return events;
}
