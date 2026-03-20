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
  label?: string;
}

export function ScrollPicker({ values, selected, onChange, width = 80, label }: ScrollPickerProps) {
  const { tint } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const lastIndex = useRef(values.indexOf(selected));

  useEffect(() => {
    const idx = values.indexOf(selected);
    if (idx >= 0) {
      lastIndex.current = idx;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollRef.current?.scrollTo({ y: idx * ITEM_HEIGHT, animated: false });
        });
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const snapAndEmit = useCallback((y: number) => {
    const idx = Math.round(y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(idx, values.length - 1));

    scrollRef.current?.scrollTo({ y: clamped * ITEM_HEIGHT, animated: true });

    if (clamped !== lastIndex.current) {
      lastIndex.current = clamped;
      onChange(values[clamped]);
      Haptics.selectionAsync();
    }
  }, [onChange, values]);

  const handleMomentumEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    snapAndEmit(e.nativeEvent.contentOffset.y);
  }, [snapAndEmit]);

  const totalWidth = label ? width + 60 : width;

  return (
    <View style={{ width: totalWidth, height: PICKER_HEIGHT, overflow: "hidden", flexDirection: "row" }}>
      <ScrollView
        ref={scrollRef}
        style={{ width: totalWidth }}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="normal"
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
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View style={{ width, alignItems: "center" }}>
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
              {label && isSelected && (
                <Text
                  style={{
                    color: tint(0.4),
                    fontSize: 16,
                    fontWeight: "300",
                    marginLeft: 4,
                  }}
                >
                  {label}
                </Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
