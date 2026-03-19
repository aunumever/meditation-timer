import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { useTheme } from "@/lib/theme";

interface TickRingProps {
  size: number;
  /** Fractional — e.g. 60.3 means tick 60 is at 30% brightness */
  activeTicks: number;
  totalTicks: number;
}

const TICK_LENGTH = 22;
const MIN_OPACITY = 0.12;
const FADE_TICKS = 3;

export function TickRing({ size, activeTicks, totalTicks }: TickRingProps) {
  const { tint } = useTheme();
  const center = size / 2;
  const radius = size / 2 - 20;

  const edgeIndex = Math.floor(activeTicks);
  const edgeFraction = activeTicks - edgeIndex;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {Array.from({ length: totalTicks }, (_, i) => {
          const angle = (i / totalTicks) * 2 * Math.PI - Math.PI / 2;
          const cosA = Math.cos(angle);
          const sinA = Math.sin(angle);

          const dotX = center + radius * cosA;
          const dotY = center + radius * sinA;

          const isDepleted = i > edgeIndex;
          const isEdge = i === edgeIndex;

          if (isDepleted) {
            return (
              <Line
                key={i}
                x1={dotX}
                y1={dotY}
                x2={dotX}
                y2={dotY}
                stroke={tint(0.8)}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            );
          }

          let opacity: number;
          if (isEdge) {
            opacity = MIN_OPACITY + (1 - MIN_OPACITY) * edgeFraction;
          } else {
            const ticksBehindEdge = edgeIndex - i;
            if (ticksBehindEdge <= FADE_TICKS && edgeIndex < totalTicks) {
              const t = ticksBehindEdge / FADE_TICKS;
              const trailDim = Math.pow(1 - t, 1.5) * 0.3;
              opacity = 1 - trailDim;
            } else {
              opacity = 1;
            }
          }

          const x1 = center + (radius - TICK_LENGTH) * cosA;
          const y1 = center + (radius - TICK_LENGTH) * sinA;

          return (
            <Line
              key={i}
              x1={x1}
              y1={y1}
              x2={dotX}
              y2={dotY}
              stroke={tint(opacity)}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
}
