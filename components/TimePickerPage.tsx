import { View, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";
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
        <View className="w-32">
          <Picker
            selectedValue={hours}
            onValueChange={(v) => onChangeHours(v as number)}
            itemStyle={{ color: tint(1), fontSize: 24 }}
            selectionColor={tint(0.06)}
          >
            {HOURS.map((h) => (
              <Picker.Item key={h} label={String(h)} value={h} color={tint(1)} />
            ))}
          </Picker>
        </View>
        <Text style={{ color: tint(0.4), fontSize: 18 }}>hours</Text>

        <View className="w-32 ml-4">
          <Picker
            selectedValue={minutes}
            onValueChange={(v) => onChangeMinutes(v as number)}
            itemStyle={{ color: tint(1), fontSize: 24 }}
            selectionColor={tint(0.06)}
          >
            {MINUTES.map((m) => (
              <Picker.Item key={m} label={String(m)} value={m} color={tint(1)} />
            ))}
          </Picker>
        </View>
        <Text style={{ color: tint(0.4), fontSize: 18 }}>min</Text>
      </View>
    </View>
  );
}
