import { View, Text, Pressable } from "react-native";
import { useTheme } from "@/lib/theme";

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
  const { tint } = useTheme();
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {options.map((opt) => {
        const isActive = opt.value === selected;
        return (
          <Pressable
            key={String(opt.value)}
            onPress={() => onSelect(opt.value)}
            style={{
              backgroundColor: isActive ? tint(0.95) : tint(0.07),
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
                color: isActive ? "#000" : tint(0.5),
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
