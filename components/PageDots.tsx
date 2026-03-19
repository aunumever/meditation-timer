import { View } from "react-native";

interface PageDotsProps {
  total: number;
  active: number;
}

export function PageDots({ total, active }: PageDotsProps) {
  return (
    <View className="flex-row items-center justify-center gap-2 pb-10">
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          className={`h-2 w-2 rounded-full ${
            i === active ? "bg-white" : "bg-neutral-600"
          }`}
        />
      ))}
    </View>
  );
}
