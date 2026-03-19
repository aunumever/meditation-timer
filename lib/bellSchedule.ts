export interface BellTime {
  /** Seconds from meditation start (after prep) when this bell fires */
  atSecs: number;
  type: "session-start" | "session-end" | "interval";
}

/**
 * Compute the full bell schedule for a meditation session.
 * All times are relative to meditation start (t=0 is when prep ends / meditation begins).
 */
export function computeBellSchedule(
  durationSecs: number,
  intervalEnabled: boolean,
  intervalFrequencyMins: number,
): BellTime[] {
  if (durationSecs <= 0) return [];

  const schedule: BellTime[] = [];

  // Session start bell at t=0
  schedule.push({ atSecs: 0, type: "session-start" });

  // Interval bells
  if (intervalEnabled && intervalFrequencyMins > 0) {
    const intervalSecs = intervalFrequencyMins * 60;
    for (let t = intervalSecs; t < durationSecs; t += intervalSecs) {
      schedule.push({ atSecs: t, type: "interval" });
    }
  }

  // Session end bell at t=durationSecs
  schedule.push({ atSecs: durationSecs, type: "session-end" });

  return schedule;
}
