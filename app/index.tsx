import { useState, useCallback, useRef, useEffect } from "react";
import { View, StatusBar } from "react-native";
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
} from "@/lib/audio";
import type { BellEvent } from "@/lib/timer";

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

  const { state, play: rawPlay, pause: rawPause, resume, stop: rawStop } = useTimer({
    durationSecs,
    prepSecs: settings.prepTime,
    intervalEnabled: settings.intervalEnabled,
    intervalFrequencyMins: settings.intervalFrequency,
    onBellEvent: handleBellEvent,
  });

  const play = useCallback(() => { cancelBells(); rawPlay(); }, [rawPlay]);
  const pause = useCallback(() => { pauseBells(); rawPause(); }, [rawPause]);
  const stop = useCallback(() => { cancelBells(); rawStop(); }, [rawStop]);

  // Resume pending bells when unpausing
  const prevPhaseRef = useRef(state.phase);
  useEffect(() => {
    if (prevPhaseRef.current === "paused" && state.phase === "meditating") {
      resumeBells();
    }
    prevPhaseRef.current = state.phase;
  }, [state.phase]);

  const isTimerActive = state.phase !== "ready";

  // Snap to timer page when session starts
  useEffect(() => {
    if (isTimerActive) {
      pagerRef.current?.setPage(1);
    }
  }, [isTimerActive]);

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />
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
          />
        </View>
      </PagerView>

      <PageDots total={3} active={activePage} />
    </View>
  );
}
