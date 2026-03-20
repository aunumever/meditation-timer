import AsyncStorage from "@react-native-async-storage/async-storage";

export type SessionBell = "rav-vast" | "singing-bowl" | "gong-large";
export type IntervalBell = "rav-vast-e4" | "rav-vast-csharp4" | "rav-vast-a4";
export type BellCount = 1 | 3;
export type PrepTime = 0 | 3 | 15 | 30 | 45 | 60;
export type IntervalFrequency = 5 | 10 | 15 | 20 | 30 | 60;
export type BackgroundNoise = "none" | "brown-noise";

export interface Settings {
  durationHours: number;
  durationMinutes: number;
  sessionBell: SessionBell;
  intervalBell: IntervalBell;
  bellCount: BellCount;
  prepTime: PrepTime;
  intervalEnabled: boolean;
  intervalFrequency: IntervalFrequency;
  overrideSilent: boolean;
  nightMode: boolean;
  dimEnabled: boolean;
  /** Screen dim overlay opacity during session, 0 = no dim, 0.9 = darkest */
  dimBrightness: number;
  backgroundNoise: BackgroundNoise;
}

export const DEFAULT_SETTINGS: Settings = {
  durationHours: 0,
  durationMinutes: 10,
  sessionBell: "rav-vast",
  intervalBell: "rav-vast-e4",
  bellCount: 3,
  prepTime: 15,
  intervalEnabled: false,
  intervalFrequency: 15,
  overrideSilent: true,
  nightMode: false,
  dimEnabled: false,
  dimBrightness: 0.5,
  backgroundNoise: "none",
};

const STORAGE_KEY = "meditation-timer-settings";

export async function loadSettings(): Promise<Settings> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (!json) return { ...DEFAULT_SETTINGS };
    const stored = JSON.parse(json) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...stored };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage unavailable (e.g. Expo Go without native module)
  }
}
