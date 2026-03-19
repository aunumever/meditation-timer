# Meditation Timer — Design Spec

## Purpose

A minimalist meditation timer for daily practice. The core principle is **get to meditation fast** — open the app, tap play, close your eyes. No tracking, no streaks, no messages. A trusted tool that rings when it should and stays out of the way.

## Reference

Screenshots from "Simple Meditation Timer" (alliblack) are in `docs/reference/`:
- `timer-active.jpg` — circular tick ring depleting, time in center, controls at bottom
- `time-picker.jpg` — iOS-style scroll wheels for hours/minutes
- `info-page.jpg` — about/instructions page (we replace this with Settings)

## Navigation

Three full-screen pages in a horizontal pager with page indicator dots at the bottom.

| Page 0 (Left) | Page 1 (Center / Home) | Page 2 (Right) |
|---|---|---|
| Time Picker | Timer | Settings |

- App always opens to Page 1 (Timer)
- Last-used duration is remembered and pre-loaded
- **Swipe is locked while the timer is running or paused.** User must stop/reset to navigate away. This prevents accidental page changes during meditation.
- Three page indicator dots at the bottom of every page

## Timer Page (Page 1 — Home)

### Visual Design

- Full black background
- Large circle centered on screen, composed of ~120 thin radial tick marks ("toothpicks")
- Ticks are bright white when representing remaining time
- Depleted ticks become faint dots (see reference `timer-active.jpg`)
- Depletion direction: clockwise from the top (12 o'clock position)
- Inside the circle: time remaining in `MM:SS` format (or `H:MM:SS` for durations >= 1 hour)
- Controls below the circle

### Timer States

**1. Ready**
- Full circle of white ticks
- Duration shown in center
- Single Play button below the circle

**2. Prep Countdown**
- Circle stays full (no depletion yet)
- Center shows the prep seconds counting down
- No text labels — just the countdown number
- Silent — no bells during prep

**3. Meditating**
- Session bell(s) ring (1 or 3, per setting) to signal the start
- Ticks begin depleting clockwise
- Center shows remaining time counting down
- Play button becomes Pause button
- Stop button appears alongside Pause
- If interval bells are enabled, a distinct interval bell sounds at each interval

**4. Paused**
- Tick depletion freezes
- Time remaining in center pulses/glows (subtle animation)
- Two buttons: Play (resume) and Stop (reset)

**5. Overtime**
- Final session bell(s) ring (1 or 3) to signal the end
- All ticks are depleted (faint dots only)
- Timer switches to counting UP from 0:00, showing extra time sat
- Display is slightly dimmer to distinguish from active countdown
- Stop button resets everything back to Ready state

### Controls

- **Play**: Start the session (begins with prep countdown if prep > 0, otherwise straight to Meditating)
- **Pause**: Freeze the timer, enter Paused state
- **Stop**: Cancel the session entirely and return to Ready state with the original duration restored. This is a reset button.

### Background Behavior

- **Switching apps (backgrounding)**: Timer keeps running. Bells fire via background audio session. On return to foreground, recalculate remaining time from wall-clock elapsed time (do not trust setInterval accuracy across background).
- **Closing/killing the app**: Timer stops. No memory of in-progress sessions. Next open returns to Ready state with the last-used duration.

## Time Picker Page (Page 0 — Left)

- Two iOS-style scroll wheels centered vertically on screen
- Left wheel: Hours (0-12)
- Right wheel: Minutes (0-59)
- Labels "hours" and "min" next to the selected values
- Selected row highlighted with subtle dark gray band (see reference `time-picker.jpg`)
- Numbers above and below selected row fade out
- Full black background, white text
- No buttons — scrolling automatically saves the selected duration
- Duration persists across app launches via AsyncStorage

## Settings Page (Page 2 — Right)

A single scrollable page with all controls inline. No sub-pages or drill-down navigation. Dark background, white text, grouped sections.

### Sound

**Session Bell**
- Row of 4-5 selectable options (pill buttons or small circles)
- Tap to preview the sound and select it
- Checkmark or highlight on the currently selected option
- Same sound is used for both the start and end bells

**Interval Bell**
- Same UI pattern as session bell
- Different set of sounds — lighter/softer tones that are clearly distinct from the session bell
- Only visible when interval bells are enabled

### Bells

**Bell Count**
- Toggle between "1" and "3"
- Controls how many times the session bell rings at start and end
- Zen tradition uses 3; simpler practice uses 1

### Timing

**Prep Time**
- Row of buttons: Off, 15s, 30s, 45s, 60s
- Time before the opening bell(s) ring
- Allows the meditator to settle in before the session officially starts
- The prep time is added on top of the meditation duration (20 min meditation + 30s prep = 20:30 total)

**Interval Bells**
- Toggle: Off (default) / On
- When on, show interval frequency row: 5, 10, 15, 20, 30 min
- The app calculates how many bells based on meditation duration (e.g., 60 min / 15 min interval = bells at 15, 30, 45)
- No bell at the very start or end — those are handled by the session bell

### System

**Override Silent Mode**
- Toggle switch, default ON
- When on, bells play even when the phone's silent/mute switch is engaged (like an alarm)
- When off, bells respect the system silent mode

**Theme**
- Dark (default) / Light / System
- Dark mode: white on black, matching the reference app aesthetic
- May simplify to Dark-only initially if Light mode is deferred

## Audio

- Use `expo-audio` for all sound playback
- Audio session category: "playback" to enable background audio and silent mode override
- Ship 4-5 built-in session bell sounds as bundled assets (range from deep singing bowl to higher bell)
- Ship 2-3 built-in interval bell sounds (distinctly lighter/softer than session bells)
- Custom audio upload is deferred to Phase 2

### Bell Sequence Example

For a 20-minute meditation with 3 bells, 30s prep, and 15-min interval:
1. Tap Play
2. 30 seconds of silence (prep countdown visible)
3. Session bell rings 3 times (meditation begins, ticks start depleting)
4. At 15:00 remaining (5 min elapsed): interval bell rings once
5. At 5:00 remaining (15 min elapsed): interval bell rings once
6. At 0:00: session bell rings 3 times (meditation complete)
7. Timer begins counting up (overtime)

## Data & Storage

- All data stored locally via `AsyncStorage`
- No backend, no Convex, no user accounts, no cloud sync
- Persisted settings:
  - Last-used duration (hours, minutes)
  - Selected session bell sound
  - Selected interval bell sound
  - Bell count (1 or 3)
  - Prep time (0, 15, 30, 45, or 60 seconds)
  - Interval enabled (boolean)
  - Interval frequency (5, 10, 15, 20, or 30 minutes)
  - Override silent mode (boolean)
  - Theme preference (dark, light, system)

## Tech Stack

- Expo SDK 54, React Native 0.81, React 19.1
- Expo Router (file-based routing, but the main UI is a pager component within a single route)
- NativeWind v4 + tailwindcss 3.4.17 for styling
- expo-audio for sound playback
- react-native-reanimated for the pulse/glow animation on pause
- AsyncStorage for local persistence
- Bun as package manager
- TypeScript (strict)
- Vitest for testing

## Out of Scope (v1)

- Meditation tracking / history / streaks
- Custom audio file upload
- Inspirational messages or quotes
- Guided meditations
- Social features
- Cloud sync / accounts
- Repeat/loop timer
- Separate start vs end bell sounds
