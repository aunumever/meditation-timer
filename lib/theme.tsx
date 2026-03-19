import { createContext, useContext } from "react";

interface Theme {
  /** Returns rgba string for the primary color at given opacity */
  tint: (opacity: number) => string;
  /** The primary RGB values as a string "r,g,b" */
  rgb: string;
  /** Whether night mode is active */
  night: boolean;
}

const WHITE = "255,255,255";
const RED = "180,40,20";

function makeTint(rgb: string) {
  return (opacity: number) => `rgba(${rgb},${opacity})`;
}

const dayTheme: Theme = { tint: makeTint(WHITE), rgb: WHITE, night: false };
const nightTheme: Theme = { tint: makeTint(RED), rgb: RED, night: true };

export const ThemeContext = createContext<Theme>(dayTheme);

export function useTheme() {
  return useContext(ThemeContext);
}

export function getTheme(nightMode: boolean): Theme {
  return nightMode ? nightTheme : dayTheme;
}
