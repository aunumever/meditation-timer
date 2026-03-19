import { View, Pressable } from "react-native";
import { Play, Pause, Square } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import type { TimerPhase } from "@/lib/timer";

interface TimerControlsProps {
  phase: TimerPhase;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
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
      className="items-center justify-center p-4"
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
  return (
    <View className="flex-row items-center justify-center gap-12" style={{ height: 64 }}>
      {phase === "ready" && (
        <ControlButton onPress={onPlay}>
          <Play size={36} color="white" fill="white" />
        </ControlButton>
      )}

      {phase === "prep" && (
        <ControlButton onPress={onStop}>
          <Square size={28} color="white" fill="white" />
        </ControlButton>
      )}

      {phase === "meditating" && (
        <>
          <ControlButton onPress={onStop}>
            <Square size={28} color="white" />
          </ControlButton>
          <ControlButton onPress={onPause}>
            <Pause size={36} color="white" fill="white" />
          </ControlButton>
        </>
      )}

      {phase === "paused" && (
        <>
          <ControlButton onPress={onStop}>
            <Square size={28} color="white" />
          </ControlButton>
          <ControlButton onPress={onResume}>
            <Play size={36} color="white" fill="white" />
          </ControlButton>
        </>
      )}

      {phase === "overtime" && (
        <ControlButton onPress={onStop}>
          <Square size={28} color="white" fill="white" />
        </ControlButton>
      )}
    </View>
  );
}
