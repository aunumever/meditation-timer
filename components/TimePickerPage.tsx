import { View, Text } from "react-native";
import { ScrollPicker } from "./ScrollPicker";
import { useTheme } from "@/lib/theme";

interface TimePickerPageProps {
  hours: number;
  minutes: number;
  onChangeHours: (h: number) => void;
  onChangeMinutes: (m: number) => void;
}

const HOURS = Array.from({ length: 10 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimePickerPage({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
}: TimePickerPageProps) {
  const { tint } = useTheme();

  return (
    <View className="flex-1 items-center justify-center bg-black">
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <ScrollPicker
          values={HOURS}
          selected={hours}
          onChange={onChangeHours}
          width={80}
          label="hours"
        />

        <View style={{ width: 24 }} />

        <ScrollPicker
          values={MINUTES}
          selected={minutes}
          onChange={onChangeMinutes}
          width={80}
          label="min"
        />
      </View>
    </View>
  );
}
