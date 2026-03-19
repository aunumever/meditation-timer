import { View, Pressable, Animated, Easing } from "react-native";
import Svg, { Path, Rect, Line } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { useEffect, useRef } from "react";
import type { TimerPhase } from "@/lib/timer";

interface TimerControlsProps {
  phase: TimerPhase;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const S = 30;
const STROKE_WIDTH = 1.2;
const ICON_COLOR = "rgba(255,255,255,0.85)";
const HIT = 56;
const GAP = 40;

function PlayIcon() {
  const p = 7;
  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Path
        d={`M${p + 1},${p} L${S - p},${S / 2} L${p + 1},${S - p} Z`}
        stroke={ICON_COLOR}
        strokeWidth={STROKE_WIDTH}
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

function PauseIcon() {
  const p = 7;
  const gap = S * 0.17;
  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Line
        x1={S / 2 - gap} y1={p} x2={S / 2 - gap} y2={S - p}
        stroke={ICON_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round"
      />
      <Line
        x1={S / 2 + gap} y1={p} x2={S / 2 + gap} y2={S - p}
        stroke={ICON_COLOR} strokeWidth={STROKE_WIDTH} strokeLinecap="round"
      />
    </Svg>
  );
}

function StopIcon() {
  const p = 7;
  const s = S - p * 2;
  return (
    <Svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
      <Rect
        x={p} y={p} width={s} height={s} rx={2}
        stroke={ICON_COLOR} strokeWidth={STROKE_WIDTH} fill="none"
      />
    </Svg>
  );
}

function ControlButton({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={{
        width: HIT,
        height: HIT,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </Pressable>
  );
}

export function TimerControls({
  phase,
  onPlay,
  onPause,
  onResume,
  onStop,
}: TimerControlsProps) {
  const showTwo = phase === "meditating" || phase === "paused";
  const offset = (HIT + GAP) / 2;

  // Animate the play/pause button position
  const mainX = useRef(new Animated.Value(0)).current;
  const stopOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(mainX, {
        toValue: showTwo ? offset : 0,
        duration: 250,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(stopOpacity, {
        toValue: showTwo ? 1 : 0,
        duration: showTwo ? 300 : 150,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [showTwo, mainX, stopOpacity, offset]);

  const showOnlyStop = phase === "prep" || phase === "overtime";

  return (
    <View style={{ height: 64, width: HIT * 2 + GAP, justifyContent: "center", alignItems: "center" }}>
      {showOnlyStop ? (
        <ControlButton onPress={onStop}>
          <StopIcon />
        </ControlButton>
      ) : (
        <>
          {/* Stop button — left side, fades in */}
          <Animated.View
            style={{
              position: "absolute",
              left: 0,
              opacity: stopOpacity,
            }}
            pointerEvents={showTwo ? "auto" : "none"}
          >
            <ControlButton onPress={onStop}>
              <StopIcon />
            </ControlButton>
          </Animated.View>

          {/* Play/Pause button — centered, slides right when stop appears */}
          <Animated.View
            style={{
              transform: [{ translateX: mainX }],
            }}
          >
            {phase === "meditating" ? (
              <ControlButton onPress={onPause}>
                <PauseIcon />
              </ControlButton>
            ) : phase === "paused" ? (
              <ControlButton onPress={onResume}>
                <PlayIcon />
              </ControlButton>
            ) : (
              <ControlButton onPress={onPlay}>
                <PlayIcon />
              </ControlButton>
            )}
          </Animated.View>
        </>
      )}
    </View>
  );
}
