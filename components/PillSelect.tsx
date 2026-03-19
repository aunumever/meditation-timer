import { View, Text, Pressable } from "react-native";

interface PillSelectProps<T extends string | number> {
  options: { label: string; value: T }[];
  selected: T;
  onSelect: (value: T) => void;
}

export function PillSelect<T extends string | number>({
  options,
  selected,
  onSelect,
}: PillSelectProps<T>) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {options.map((opt) => {
        const isActive = opt.value === selected;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onSelect(opt.value)}
            style={{
              backgroundColor: isActive
                ? "rgba(255,255,255,0.95)"
                : "rgba(255,255,255,0.07)",
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 9,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                letterSpacing: 0.3,
                color: isActive ? "#000" : "rgba(255,255,255,0.5)",
              }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
