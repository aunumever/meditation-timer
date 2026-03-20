import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { View, StatusBar, StyleSheet, Animated, Easing } from "react-native";
import PagerView from "react-native-pager-view";
import { PageDots } from "@/components/PageDots";
import { TimerPage } from "@/components/TimerPage";
import { TimePickerPage } from "@/components/TimePickerPage";
import { SettingsPage } from "@/components/SettingsPage";
import { useSettings } from "@/hooks/useSettings";
import { useTimer } from "@/hooks/useTimer";
import {
  initAudioMode,
  playSessionBell,
  playIntervalBell,
  playSessionBellPreview,
  playIntervalBellPreview,
  pauseBells,
  resumeBells,
  cancelBells,
  fadeOutAndStop,
} from "@/lib/audio";
import type { BellEvent } from "@/lib/timer";
import { ThemeContext, getTheme } from "@/lib/theme";

export default function Index() {
  const [activePage, setActivePage] = useState(1);
  const pagerRef = useRef<PagerView>(null);
  const [settings, updateSettings] = useSettings();

  const durationSecs =
    settings.durationHours * 3600 + settings.durationMinutes * 60;

  // Initialize audio mode
  useEffect(() => {
    initAudioMode(settings.overrideSilent);
  }, [settings.overrideSilent]);

  // Use refs so the callback doesn't go stale
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const handleBellEvent = useCallback((events: BellEvent[]) => {
    const s = settingsRef.current;
    for (const event of events) {
      switch (event.type) {
        case "session-start":
        case "session-end":
          playSessionBell(s.sessionBell, s.bellCount);
          break;
        case "interval":
          playIntervalBell(s.intervalBell);
          break;
      }
    }
  }, []);

  const { state, play: rawPlay, pause: rawPause, resume: rawResume, stop: rawStop } = useTimer({
    durationSecs,
    prepSecs: settings.prepTime,
    intervalEnabled: settings.intervalEnabled,
    intervalFrequencyMins: settings.intervalFrequency,
    onBellEvent: handleBellEvent,
  });

  const play = useCallback(() => { cancelBells(); rawPlay(); }, [rawPlay]);
  const pause = useCallback(() => { pauseBells(); rawPause(); }, [rawPause]);
  const resume = useCallback(() => { resumeBells(); rawResume(); }, [rawResume]);
  const stop = useCallback(() => { fadeOutAndStop(); rawStop(); }, [rawStop]);

  const isTimerActive = state.phase !== "ready";

  // Fade out preview sounds when swiping away from settings page
  // Only when no session is active — otherwise it kills the bell sequence
  const prevPageRef = useRef(activePage);
  useEffect(() => {
    if (prevPageRef.current === 2 && activePage !== 2 && !isTimerActive) {
      fadeOutAndStop();
    }
    prevPageRef.current = activePage;
  }, [activePage, isTimerActive]);

  // Dim overlay: animated for session start/stop, instant for slider preview
  const dimAnim = useRef(new Animated.Value(0)).current;
  const dimPreviewActive = useRef(false);

  useEffect(() => {
    if (dimPreviewActive.current) return;
    const target = isTimerActive && settings.dimEnabled && settings.dimBrightness > 0 ? settings.dimBrightness : 0;
    Animated.timing(dimAnim, {
      toValue: target,
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [isTimerActive, settings.dimEnabled, settings.dimBrightness, dimAnim]);

  const setDimOverlay = useCallback((v: number) => {
    if (v > 0) {
      dimPreviewActive.current = true;
      dimAnim.setValue(v);
    } else {
      dimPreviewActive.current = false;
      dimAnim.setValue(0);
    }
  }, [dimAnim]);

  const dimBg = useMemo(
    () => dimAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ["rgba(0,0,0,0)", "rgba(0,0,0,1)"],
    }),
    [dimAnim],
  );

  // Snap to timer page when session starts
  useEffect(() => {
    if (isTimerActive) {
      pagerRef.current?.setPage(1);
    }
  }, [isTimerActive]);

  const theme = getTheme(settings.nightMode);

  return (
    <ThemeContext.Provider value={theme}>
    <View className="flex-1 bg-black">
      <StatusBar hidden />
      <PagerView
        ref={pagerRef}
        style={{ flex: 1 }}
        initialPage={1}
        scrollEnabled={!isTimerActive}
        onPageSelected={(e) => setActivePage(e.nativeEvent.position)}
      >
        <View key="0" style={{ flex: 1 }}>
          <TimePickerPage
            hours={settings.durationHours}
            minutes={settings.durationMinutes}
            onChangeHours={(h) => updateSettings({ durationHours: h })}
            onChangeMinutes={(m) => updateSettings({ durationMinutes: m })}
          />
        </View>

        <View key="1" style={{ flex: 1 }}>
          <TimerPage
            state={state}
            onPlay={play}
            onPause={pause}
            onResume={resume}
            onStop={stop}
          />
        </View>

        <View key="2" style={{ flex: 1 }}>
          <SettingsPage
            settings={settings}
            durationMinutes={settings.durationHours * 60 + settings.durationMinutes}
            onUpdate={updateSettings}
            onPreviewSessionBell={playSessionBellPreview}
            onPreviewIntervalBell={playIntervalBellPreview}
            onDimPreview={setDimOverlay}
          />
        </View>
      </PagerView>

      <PageDots total={3} active={activePage} />

      <Animated.View
        style={[StyleSheet.absoluteFill, { backgroundColor: dimBg }]}
        pointerEvents="none"
      />
    </View>
    </ThemeContext.Provider>
  );
}
