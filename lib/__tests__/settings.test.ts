import { describe, it, expect, vi, beforeEach } from "vitest";
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from "../settings";

vi.mock("@react-native-async-storage/async-storage", () => {
  let store: Record<string, string> = {};
  return {
    default: {
      getItem: vi.fn((key: string) => Promise.resolve(store[key] ?? null)),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value;
        return Promise.resolve();
      }),
      clear: () => {
        store = {};
      },
    },
  };
});

import AsyncStorage from "@react-native-async-storage/async-storage";

beforeEach(() => {
  vi.clearAllMocks();
  (AsyncStorage as unknown as { clear: () => void }).clear();
});

describe("DEFAULT_SETTINGS", () => {
  it("has rav-vast as default session bell", () => {
    expect(DEFAULT_SETTINGS.sessionBell).toBe("rav-vast");
  });

  it("has rav-vast-e4 as default interval bell", () => {
    expect(DEFAULT_SETTINGS.intervalBell).toBe("rav-vast-e4");
  });

  it("has night mode off by default", () => {
    expect(DEFAULT_SETTINGS.nightMode).toBe(false);
  });

  it("has dim disabled by default", () => {
    expect(DEFAULT_SETTINGS.dimEnabled).toBe(false);
  });

  it("has dimBrightness at 0.5", () => {
    expect(DEFAULT_SETTINGS.dimBrightness).toBe(0.5);
  });

  it("has 10 minute default duration", () => {
    expect(DEFAULT_SETTINGS.durationHours).toBe(0);
    expect(DEFAULT_SETTINGS.durationMinutes).toBe(10);
  });

  it("has 3 bell count", () => {
    expect(DEFAULT_SETTINGS.bellCount).toBe(3);
  });

  it("has 15s prep time", () => {
    expect(DEFAULT_SETTINGS.prepTime).toBe(15);
  });

  it("has intervals disabled", () => {
    expect(DEFAULT_SETTINGS.intervalEnabled).toBe(false);
  });

  it("has override silent enabled", () => {
    expect(DEFAULT_SETTINGS.overrideSilent).toBe(true);
  });
});

describe("loadSettings", () => {
  it("returns defaults when nothing stored", async () => {
    const settings = await loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });

  it("merges stored values with defaults", async () => {
    await AsyncStorage.setItem(
      "meditation-timer-settings",
      JSON.stringify({ durationMinutes: 20, bellCount: 1 }),
    );
    const settings = await loadSettings();
    expect(settings.durationMinutes).toBe(20);
    expect(settings.bellCount).toBe(1);
    expect(settings.sessionBell).toBe(DEFAULT_SETTINGS.sessionBell);
  });

  it("preserves new fields when loading old settings", async () => {
    // Simulate settings saved before nightMode/dim existed
    await AsyncStorage.setItem(
      "meditation-timer-settings",
      JSON.stringify({ durationMinutes: 30 }),
    );
    const settings = await loadSettings();
    expect(settings.nightMode).toBe(false);
    expect(settings.dimEnabled).toBe(false);
    expect(settings.dimBrightness).toBe(0.5);
  });

  it("handles corrupted JSON gracefully", async () => {
    await AsyncStorage.setItem("meditation-timer-settings", "not-json");
    const settings = await loadSettings();
    expect(settings).toEqual(DEFAULT_SETTINGS);
  });
});

describe("saveSettings", () => {
  it("persists settings and can reload them", async () => {
    const custom = { ...DEFAULT_SETTINGS, durationMinutes: 45, prepTime: 30 as const };
    await saveSettings(custom);
    const loaded = await loadSettings();
    expect(loaded.durationMinutes).toBe(45);
    expect(loaded.prepTime).toBe(30);
  });

  it("persists night mode and dim settings", async () => {
    const custom = { ...DEFAULT_SETTINGS, nightMode: true, dimEnabled: true, dimBrightness: 0.7 };
    await saveSettings(custom);
    const loaded = await loadSettings();
    expect(loaded.nightMode).toBe(true);
    expect(loaded.dimEnabled).toBe(true);
    expect(loaded.dimBrightness).toBe(0.7);
  });

  it("persists bell selections", async () => {
    const custom = { ...DEFAULT_SETTINGS, sessionBell: "singing-bowl" as const, intervalBell: "rav-vast-a4" as const };
    await saveSettings(custom);
    const loaded = await loadSettings();
    expect(loaded.sessionBell).toBe("singing-bowl");
    expect(loaded.intervalBell).toBe("rav-vast-a4");
  });

  it("persists 60 min interval frequency", async () => {
    const custom = { ...DEFAULT_SETTINGS, intervalFrequency: 60 as const };
    await saveSettings(custom);
    const loaded = await loadSettings();
    expect(loaded.intervalFrequency).toBe(60);
  });
});
