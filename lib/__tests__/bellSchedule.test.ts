import { describe, it, expect } from "vitest";
import { computeBellSchedule } from "../bellSchedule";

describe("computeBellSchedule", () => {
  it("returns empty for 0 duration", () => {
    expect(computeBellSchedule(0, false, 15)).toEqual([]);
  });

  it("returns start and end bells for simple session", () => {
    const schedule = computeBellSchedule(600, false, 15);
    expect(schedule).toEqual([
      { atSecs: 0, type: "session-start" },
      { atSecs: 600, type: "session-end" },
    ]);
  });

  it("includes interval bells when enabled", () => {
    // 60 min session with 15 min intervals
    const schedule = computeBellSchedule(3600, true, 15);
    expect(schedule).toEqual([
      { atSecs: 0, type: "session-start" },
      { atSecs: 900, type: "interval" },
      { atSecs: 1800, type: "interval" },
      { atSecs: 2700, type: "interval" },
      { atSecs: 3600, type: "session-end" },
    ]);
  });

  it("skips interval bell at exact end time", () => {
    // 30 min session with 15 min intervals — bell at 15, not at 30 (that's end)
    const schedule = computeBellSchedule(1800, true, 15);
    expect(schedule).toEqual([
      { atSecs: 0, type: "session-start" },
      { atSecs: 900, type: "interval" },
      { atSecs: 1800, type: "session-end" },
    ]);
  });

  it("no interval bells if duration shorter than interval", () => {
    // 5 min session with 10 min intervals
    const schedule = computeBellSchedule(300, true, 10);
    expect(schedule).toEqual([
      { atSecs: 0, type: "session-start" },
      { atSecs: 300, type: "session-end" },
    ]);
  });
});
