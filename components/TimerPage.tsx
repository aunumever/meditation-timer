import { View, Animated, Easing, useWindowDimensions } from "react-native";
import { useEffect, useRef } from "react";
import { TickRing } from "./TickRing";
import { TimeDisplay } from "./TimeDisplay";
import { TimerControls } from "./TimerControls";
import { computeActiveTicks, type TimerState } from "@/lib/timer";

const TOTAL_TICKS = 120;

interface TimerPageProps {
  state: TimerState;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

function PauseAnimationWrapper({
  isPaused,
  children,
}: {
  isPaused: boolean;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(1)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPaused) {
      opacity.setValue(1);
      animRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.15,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      animRef.current.start();
    } else {
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }
      opacity.setValue(1);
    }

    return () => {
      if (animRef.current) {
        animRef.current.stop();
        animRef.current = null;
      }
    };
  }, [isPaused, opacity]);

  return (
    <Animated.View style={{ opacity }}>{children}</Animated.View>
  );
}

export function TimerPage({
  state,
  onPlay,
  onPause,
  onResume,
  onStop,
}: TimerPageProps) {
  const { width } = useWindowDimensions();
  const ringSize = Math.min(width * 0.82, 340);

  const activeTicks =
    state.phase === "ready" || state.phase === "prep"
      ? TOTAL_TICKS
      : state.phase === "overtime"
        ? 0
        : computeActiveTicks(state.remaining, state.durationSecs, TOTAL_TICKS);

  const displaySeconds =
    state.phase === "prep"
      ? state.prepRemaining
      : state.phase === "overtime"
        ? state.overtimeSecs
        : state.remaining;

  const isDimmed = state.phase === "overtime";
  const isPrepCountdown = state.phase === "prep";

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <PauseAnimationWrapper isPaused={state.phase === "paused"}>
        <View className="items-center justify-center" style={{ marginTop: -40 }}>
          <TickRing
            size={ringSize}
            activeTicks={activeTicks}
            totalTicks={TOTAL_TICKS}
          />
          <View
            className="absolute items-center justify-center"
            style={{ width: ringSize, height: ringSize }}
          >
            {isPrepCountdown ? (
              <TimeDisplay seconds={Math.ceil(state.prepRemaining)} />
            ) : (
              <TimeDisplay seconds={displaySeconds} dimmed={isDimmed} />
            )}
          </View>
        </View>
      </PauseAnimationWrapper>

      <View className="mt-12">
        <TimerControls
          phase={state.phase}
          onPlay={onPlay}
          onPause={onPause}
          onResume={onResume}
          onStop={onStop}
        />
      </View>
    </View>
  );
}
