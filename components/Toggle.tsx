import { Pressable, Animated, Easing } from "react-native";
import { useRef, useEffect } from "react";
import { useTheme } from "@/lib/theme";

interface ToggleProps {
  value: boolean;
  onValueChange: (v: boolean) => void;
}

const TRACK_W = 51;
const TRACK_H = 31;
const THUMB_SIZE = 27;
const THUMB_TRAVEL = TRACK_W - THUMB_SIZE - 4;

export function Toggle({ value, onValueChange }: ToggleProps) {
  const { tint, night } = useTheme();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: value ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  const trackBg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      night ? "rgba(50,20,15,1)" : "rgba(55,55,55,1)",
      night ? "rgba(140,35,15,1)" : "rgba(100,100,100,1)",
    ],
  });

  const thumbX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, THUMB_TRAVEL + 2],
  });

  return (
    <Pressable onPress={() => onValueChange(!value)}>
      <Animated.View
        style={{
          width: TRACK_W,
          height: TRACK_H,
          borderRadius: TRACK_H / 2,
          backgroundColor: trackBg,
          justifyContent: "center",
        }}
      >
        <Animated.View
          style={{
            width: THUMB_SIZE,
            height: THUMB_SIZE,
            borderRadius: THUMB_SIZE / 2,
            backgroundColor: tint(1),
            transform: [{ translateX: thumbX }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}
