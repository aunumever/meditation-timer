import { Text } from "react-native";
import { useTheme } from "@/lib/theme";

interface TimeDisplayProps {
  seconds: number;
  dimmed?: boolean;
}

function formatTime(totalSeconds: number): string {
  const absSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(absSeconds / 3600);
  const minutes = Math.floor((absSeconds % 3600) / 60);
  const secs = absSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

export function TimeDisplay({ seconds, dimmed }: TimeDisplayProps) {
  const { tint } = useTheme();
  return (
    <Text
      style={{
        fontSize: 44,
        fontWeight: "200",
        letterSpacing: 4,
        fontVariant: ["tabular-nums"],
        color: dimmed ? tint(0.4) : tint(1),
      }}
    >
      {formatTime(seconds)}
    </Text>
  );
}
