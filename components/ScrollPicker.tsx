import { useRef, useEffect, useCallback } from "react";
import { View, Text, ScrollView, type NativeSyntheticEvent, type NativeScrollEvent } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/theme";

const ITEM_HEIGHT = 40;
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
  const isDragging = useRef(false);

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0 && !isDragging.current) {
      lastIndex.current = idx;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const snapAndEmit = useCallback((y: number) => {
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));

    // Snap to exact position
    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });

    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      onChange(values[clamped]);
      Haptics.selectionAsync();
    }
  }, [onChange, values]);

  const handleBeginDrag = useCallback(() => {
    isDragging.current = true;
  }, []);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isDragging.current = false;
    snapAndEmit(e.nativeEvent.contentOffset.y);
  }, [snapAndEmit]);

  const handleDragEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    // If velocity is ~0, momentum event won't fire — snap immediately
    const vel = e.nativeEvent.velocity?.y ?? 0;
    if (Math.abs(vel) < 0.1) {
      isDragging.current = false;
      snapAndEmit(e.nativeEvent.contentOffset.y);
    }
  }, [snapAndEmit]);

  return (
    <View style={{ width, height: PICKER_HEIGHT, overflow: "hidden" }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        decelerationRate="normal"
        onScrollBeginDrag={handleBeginDrag}
        onScrollEndDrag={handleDragEnd}
        onMomentumScrollEnd={handleMomentumEnd}
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
                  fontSize: 22,
                  fontWeight: "300",
                  letterSpacing: 1,
                }}
              >
                {val}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
