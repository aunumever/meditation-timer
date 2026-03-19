import { View } from "react-native";
import { useTheme } from "@/lib/theme";

interface PageDotsProps {
  total: number;
  active: number;
}

export function PageDots({ total, active }: PageDotsProps) {
  const { tint } = useTheme();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingBottom: 40 }}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            height: 8,
            width: 8,
            borderRadius: 4,
            backgroundColor: i === active ? tint(1) : tint(0.2),
          }}
        />
      ))}
    </View>
  );
}
