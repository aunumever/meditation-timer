import { View, Text } from "react-native";

interface SettingRowProps {
  label: string;
  children: React.ReactNode;
}

export function SettingRow({ label, children }: SettingRowProps) {
  return (
    <View className="mb-8">
      <Text className="text-neutral-500 text-xs tracking-widest uppercase mb-3">
        {label}
      </Text>
      {children}
    </View>
  );
}
