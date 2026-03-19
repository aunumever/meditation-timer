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
});

describe("saveSettings", () => {
  it("persists settings and can reload them", async () => {
    const custom = { ...DEFAULT_SETTINGS, durationMinutes: 45, prepTime: 30 as const };
    await saveSettings(custom);
    const loaded = await loadSettings();
    expect(loaded.durationMinutes).toBe(45);
    expect(loaded.prepTime).toBe(30);
  });
});
