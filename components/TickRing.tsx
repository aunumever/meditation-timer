import { View } from "react-native";
import Svg, { Line } from "react-native-svg";

interface TickRingProps {
  size: number;
  /** Fractional — e.g. 60.3 means tick 60 is at 30% brightness */
  activeTicks: number;
  totalTicks: number;
}

const TICK_LENGTH = 14;
const MIN_OPACITY = 0.08;

export function TickRing({ size, activeTicks, totalTicks }: TickRingProps) {
  const center = size / 2;
  const radius = size / 2 - 20;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {Array.from({ length: totalTicks }, (_, i) => {
          const angle = (i / totalTicks) * 2 * Math.PI - Math.PI / 2;
          const x1 = center + (radius - TICK_LENGTH) * Math.cos(angle);
          const y1 = center + (radius - TICK_LENGTH) * Math.sin(angle);
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);

          // Smooth per-tick opacity:
          // Ticks well before the edge: full white
          // The tick at the edge: partial opacity based on fractional remainder
          // Ticks past the edge: near-invisible
          let opacity: number;
          if (i < Math.floor(activeTicks)) {
            opacity = 1;
          } else if (i < activeTicks) {
            // This is the fractional tick — fade smoothly
            opacity = MIN_OPACITY + (1 - MIN_OPACITY) * (activeTicks - i);
          } else {
            opacity = MIN_OPACITY;
          }

          return (
            <Line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={`rgba(255,255,255,${opacity})`}
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
    </View>
  );
}
