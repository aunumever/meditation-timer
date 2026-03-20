import { useReducer, useEffect, useRef, useCallback } from "react";
import { AppState, type AppStateStatus } from "react-native";
import {
  timerReducer,
  createInitialState,
  detectBellEvents,
  type TimerState,
  type BellEvent,
} from "@/lib/timer";

const TICK_INTERVAL_MS = 100;

interface UseTimerOptions {
  durationSecs: number;
  prepSecs: number;
  intervalEnabled: boolean;
  intervalFrequencyMins: number;
  onBellEvent?: (events: BellEvent[]) => void;
}

export function useTimer({
  durationSecs,
  prepSecs,
  intervalEnabled,
  intervalFrequencyMins,
  onBellEvent,
}: UseTimerOptions) {
  const onBellEventRef = useRef(onBellEvent);
  onBellEventRef.current = onBellEvent;

  const intervalEnabledRef = useRef(intervalEnabled);
  intervalEnabledRef.current = intervalEnabled;

  const intervalFrequencyMinsRef = useRef(intervalFrequencyMins);
  intervalFrequencyMinsRef.current = intervalFrequencyMins;

  const [state, dispatch] = useReducer(
    timerReducer,
    { durationSecs, prepSecs },
    ({ durationSecs: d, prepSecs: p }) => createInitialState(d, p),
  );

  // Detect bell events via useEffect instead of inside reducer (React purity)
  const prevStateRef = useRef(state);
  useEffect(() => {
    const prev = prevStateRef.current;
    prevStateRef.current = state;
    if (prev === state) return;

    const events = detectBellEvents(
      prev,
      state,
      intervalEnabledRef.current,
      intervalFrequencyMinsRef.current,
    );
    if (events.length > 0 && onBellEventRef.current) {
      onBellEventRef.current(events);
    }
  }, [state]);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Update duration/prep when settings change (only in ready state)
  useEffect(() => {
    if (stateRef.current.phase === "ready") {
      dispatch({ type: "SET_DURATION", durationSecs, prepSecs });
    }
  }, [durationSecs, prepSecs]);

  // Tick interval
  useEffect(() => {
    const isRunning =
      state.phase === "prep" ||
      state.phase === "meditating" ||
      state.phase === "overtime";

    if (!isRunning) return;

    const interval = setInterval(() => {
      dispatch({ type: "TICK", now: Date.now() });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [state.phase]);

  // Foreground sync
  useEffect(() => {
    const handleAppState = (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        const current = stateRef.current;
        if (
          current.phase === "prep" ||
          current.phase === "meditating" ||
          current.phase === "overtime"
        ) {
          dispatch({ type: "FOREGROUND_SYNC", now: Date.now() });
        }
      }
    };

    const subscription = AppState.addEventListener("change", handleAppState);
    return () => subscription.remove();
  }, []);

  const play = useCallback(() => {
    if (durationSecs <= 0) return;
    dispatch({
      type: "PLAY",
      durationSecs,
      prepSecs,
      now: Date.now(),
    });
  }, [durationSecs, prepSecs]);

  const pause = useCallback(() => {
    dispatch({ type: "PAUSE", now: Date.now() });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: "RESUME", now: Date.now() });
  }, []);

  const stop = useCallback(() => {
    dispatch({ type: "STOP" });
  }, []);

  return { state, play, pause, resume, stop };
}
