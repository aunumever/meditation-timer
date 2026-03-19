import { View, Text } from "react-native";
import { useTheme } from "@/lib/theme";

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

export function SettingRow({ label, children }: SettingRowProps) {
  const { tint } = useTheme();
  return (
    <View style={{ marginBottom: 32 }}>
      <Text
        style={{
          color: tint(0.5),
          fontSize: 12,
          letterSpacing: 2,
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}
