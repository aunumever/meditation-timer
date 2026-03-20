import { useRef, useEffect, useCallback, useState } from "react";
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
  label?: string;
}

export function ScrollPicker({ values, selected, onChange, width = 80, label }: ScrollPickerProps) {
  const { tint } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const lastEmitted = useRef(selected);
  const [centerIndex, setCenterIndex] = useState(values.indexOf(selected));

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0) {
      setCenterIndex(idx);
      lastEmitted.current = selected;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
        });
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track scroll position continuously for highlight
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    setCenterIndex(clamped);
  }, [values.length]);

  // Emit value change only when scroll fully settles
  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));
    const val = values[clamped];

    if (val !== lastEmitted.current) {
      lastEmitted.current = val;
      onChange(val);
      Haptics.selectionAsync();
    }
  }, [onChange, values]);

  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <View style={{ width, height: PICKER_HEIGHT, overflow: "hidden" }}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="normal"
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleMomentumEnd}
          contentContainerStyle={{
            paddingTop: PAD_ITEMS * ITEM_HEIGHT,
            paddingBottom: PAD_ITEMS * ITEM_HEIGHT,
          }}
        >
          {values.map((val, i) => (
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
                  color: tint(i === centerIndex ? 1 : 0.3),
                  fontSize: 22,
                  fontWeight: "300",
                  letterSpacing: 1,
                }}
              >
                {val}
              </Text>
            </View>
          ))}
        </ScrollView>
      </View>
      {label && (
        <Text
          style={{
            color: tint(0.4),
            fontSize: 16,
            fontWeight: "300",
            marginLeft: 8,
            width: 50,
          }}
        >
          {label}
        </Text>
      )}
    </View>
  );
}
