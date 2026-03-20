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
  const isScrolling = useRef(false);

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0 && !isScrolling.current) {
      lastIndex.current = idx;
      setTimeout(() => {
        scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const snapTo = useCallback((y: number) => {
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));

    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      onChange(values[clamped]);
      Haptics.selectionAsync();
    }
  }, [onChange, values]);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    isScrolling.current = false;
    snapTo(e.nativeEvent.contentOffset.y);
  }, [snapTo]);

  const handleBeginDrag = useCallback(() => {
    isScrolling.current = true;
  }, []);

  return (
    <View style={{ width, height: PICKER_HEIGHT, overflow: "hidden" }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onScrollBeginDrag={handleBeginDrag}
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
