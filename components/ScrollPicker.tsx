import { useRef, useEffect, useCallback } from "react";
import { View, Text, ScrollView, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/theme";

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const PAD_ITEMS = Math.floor(VISIBLE_ITEMS / 2);

interface ScrollPickerProps {
  values: number[];
  selected: number;
  onChange: (value: number) => void;
  width?: number;
}

export function ScrollPicker({ values, selected, onChange, width = 80 }: ScrollPickerProps) {
  const { tint } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const lastIndex = useRef(values.indexOf(selected));

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0 && idx !== lastIndex.current) {
      lastIndex.current = idx;
      scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
    }
  }, [selected, values]);

  // Initial scroll position
  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));

    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      onChange(values[clamped]);
      Haptics.selectionAsync();
    }

    // Snap to exact position
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });
  }, [onChange, values]);

  return (
    <View style={{ width, height: PICKER_HEIGHT, overflow: "hidden" }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollEnd={handleScrollEnd}
        onScrollEndDrag={handleScrollEnd}
        contentContainerStyle={{
          paddingTop: PAD_ITEMS * ITEM_HEIGHT,
          paddingBottom: PAD_ITEMS * ITEM_HEIGHT,
        }}
      >
        {values.map((val, i) => {
          const isSelected = val === selected;
          return (
            <View
              key={i}
              style={{
                height: ITEM_HEIGHT,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  color: tint(isSelected ? 1 : 0.3),
                  fontSize: isSelected ? 22 : 18,
                  fontWeight: "300",
                }}
              >
                {val}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Fade overlay top */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          backgroundColor: "transparent",
          borderBottomWidth: 0,
        }}
      />
      {/* Fade overlay bottom */}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: ITEM_HEIGHT * 2,
          backgroundColor: "transparent",
        }}
      />
    </View>
  );
}
