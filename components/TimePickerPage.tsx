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
      <View className="flex-row items-center">
        <ScrollPicker
          values={HOURS}
          selected={hours}
          onChange={onChangeHours}
          width={80}
        />
        <Text style={{ color: tint(0.4), fontSize: 18, marginHorizontal: 8 }}>hours</Text>

        <ScrollPicker
          values={MINUTES}
          selected={minutes}
          onChange={onChangeMinutes}
          width={80}
        />
        <Text style={{ color: tint(0.4), fontSize: 18, marginLeft: 8 }}>min</Text>
      </View>
    </View>
  );
}
