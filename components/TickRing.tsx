import { View } from "react-native";
import Svg, { Line } from "react-native-svg";

interface TickRingProps {
  size: number;
  /** Fractional — e.g. 60.3 means tick 60 is at 30% brightness */
  activeTicks: number;
  totalTicks: number;
}

const TICK_LENGTH = 14;
const MIN_OPACITY = 0.12;
const FADE_TICKS = 3;

export function TickRing({ size, activeTicks, totalTicks }: TickRingProps) {
  const center = size / 2;
  const radius = size / 2 - 20;

  // The "edge" is the fractional tick being depleted right now.
  // edgeIndex is the tick that's currently partially visible.
  const edgeIndex = Math.floor(activeTicks);
  // fraction = how much of the edge tick remains (1 = full, 0 = gone)
  const edgeFraction = activeTicks - edgeIndex;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {Array.from({ length: totalTicks }, (_, i) => {
          const angle = (i / totalTicks) * 2 * Math.PI - Math.PI / 2;
          const x1 = center + (radius - TICK_LENGTH) * Math.cos(angle);
          const y1 = center + (radius - TICK_LENGTH) * Math.sin(angle);
          const x2 = center + radius * Math.cos(angle);
          const y2 = center + radius * Math.sin(angle);

          let opacity: number;
          if (i > edgeIndex) {
            // Past the edge — depleted
            opacity = MIN_OPACITY;
          } else if (i === edgeIndex) {
            // The tick currently being depleted — fade with its fraction
            opacity = MIN_OPACITY + (1 - MIN_OPACITY) * edgeFraction;
          } else {
            // Before the edge — check if in the staggered trail zone
            const ticksBehindEdge = edgeIndex - i;
            if (ticksBehindEdge <= FADE_TICKS && edgeIndex < totalTicks) {
              // Staggered: ticks closer to edge are dimmer
              // ticksBehindEdge=1 is closest to edge (dimmest in trail)
              // ticksBehindEdge=FADE_TICKS is furthest (brightest in trail)
              const t = ticksBehindEdge / FADE_TICKS; // 1/3, 2/3, 1
              const trailDim = Math.pow(1 - t, 1.5) * 0.3; // max 30% dimming for closest
              opacity = 1 - trailDim;
            } else {
              opacity = 1;
            }
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
