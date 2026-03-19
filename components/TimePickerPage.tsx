import { View, Text } from "react-native";
import { Picker } from "@react-native-picker/picker";

interface TimePickerPageProps {
  hours: number;
  minutes: number;
  onChangeHours: (h: number) => void;
  onChangeMinutes: (m: number) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

export function TimePickerPage({
  hours,
  minutes,
  onChangeHours,
  onChangeMinutes,
}: TimePickerPageProps) {
  return (
    <View className="flex-1 items-center justify-center bg-black">
      <View className="flex-row items-center">
        <View className="w-32">
          <Picker
            selectedValue={hours}
            onValueChange={(v) => onChangeHours(v as number)}
            itemStyle={{ color: "white", fontSize: 24 }}
          >
            {HOURS.map((h) => (
              <Picker.Item key={h} label={String(h)} value={h} />
            ))}
          </Picker>
        </View>
        <Text className="text-neutral-400 text-lg">hours</Text>

        <View className="w-32 ml-4">
          <Picker
            selectedValue={minutes}
            onValueChange={(v) => onChangeMinutes(v as number)}
            itemStyle={{ color: "white", fontSize: 24 }}
          >
            {MINUTES.map((m) => (
              <Picker.Item key={m} label={String(m)} value={m} />
            ))}
          </Picker>
        </View>
        <Text className="text-neutral-400 text-lg">min</Text>
      </View>
    </View>
  );
}
