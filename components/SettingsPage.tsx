import { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, ScrollView, Pressable, Animated as RNAnimated, Easing } from "react-native";
import Slider from "@react-native-community/slider";
import Svg, { Line as SvgLine } from "react-native-svg";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PillSelect } from "./PillSelect";
import { SettingRow } from "./SettingRow";
import { Toggle } from "./Toggle";
import { useTheme } from "@/lib/theme";
import type {
  Settings,
  SessionBell,
  IntervalBell,
  BellCount,
  PrepTime,
  IntervalFrequency,
  BackgroundNoise,
} from "@/lib/settings";
import { HAIKUS } from "@/lib/haiku";
interface SettingsPageProps {
  settings: Settings;
  /** Total meditation duration in minutes */
  durationMinutes: number;
  onUpdate: (patch: Partial<Settings>) => void;
  onPreviewSessionBell?: (bell: SessionBell) => void;
  onPreviewIntervalBell?: (bell: IntervalBell) => void;
  onPreviewBackgroundNoise?: (noise: BackgroundNoise) => void;
  onDimPreview?: (opacity: number) => void;
}

const SESSION_BELL_OPTIONS: { label: string; value: SessionBell }[] = [
  { label: "Rav Vast", value: "rav-vast" },
  { label: "Singing Bowl", value: "singing-bowl" },
  { label: "Gong", value: "gong-large" },
];

const INTERVAL_BELL_OPTIONS: { label: string; value: IntervalBell }[] = [
  { label: "E4", value: "rav-vast-e4" },
  { label: "C#4", value: "rav-vast-csharp4" },
  { label: "A4", value: "rav-vast-a4" },
];

const BELL_COUNT_OPTIONS: { label: string; value: BellCount }[] = [
  { label: "1", value: 1 },
  { label: "3", value: 3 },
];

const PREP_TIME_OPTIONS: { label: string; value: PrepTime }[] = [
  { label: "Off", value: 0 },
  { label: "3s", value: 3 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "45s", value: 45 },
  { label: "60s", value: 60 },
];

const BACKGROUND_NOISE_OPTIONS: { label: string; value: BackgroundNoise }[] = [
  { label: "Off", value: "none" },
  { label: "Brown Noise", value: "brown-noise" },
];

const INTERVAL_FREQ_OPTIONS: { label: string; value: IntervalFrequency }[] = [
  { label: "5 min", value: 5 },
  { label: "10", value: 10 },
  { label: "15", value: 15 },
  { label: "20", value: 20 },
  { label: "30", value: 30 },
  { label: "60", value: 60 },
];

function EnsoRing({ size }: { size: number }) {
  const { tint } = useTheme();
  const totalTicks = 48;
  const center = size / 2;
  const radius = size / 2 - 4;
  const tickLen = 8;
  const baseMax = 0.10;
  const baseMin = 0.03;
  const activeTicks = 40;
  const fadeTicks = 3;

  const [breath, setBreath] = useState(0);

  useEffect(() => {
    let rafId: number;
    let startTime: number | null = null;
    const breatheIn = 8000;
    const breatheOut = 8000;
    const rest = 6000;
    const cycle = breatheIn + breatheOut + rest;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = (timestamp - startTime) % cycle;

      if (elapsed < breatheIn) {
        const t = elapsed / breatheIn;
        setBreath(t * t);
      } else if (elapsed < breatheIn + breatheOut) {
        const t = (elapsed - breatheIn) / breatheOut;
        setBreath((1 - t) * (1 - t));
      } else {
        setBreath(0);
      }

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const breathBoost = breath * 0.2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {Array.from({ length: totalTicks }, (_, i) => {
        const angle = (i / totalTicks) * 2 * Math.PI - Math.PI / 2;
        const x1 = center + (radius - tickLen) * Math.cos(angle);
        const y1 = center + (radius - tickLen) * Math.sin(angle);
        const x2 = center + radius * Math.cos(angle);
        const y2 = center + radius * Math.sin(angle);

        const distFromEdge = activeTicks - i;
        let opacity: number;
        if (distFromEdge <= 0) {
          opacity = baseMin;
        } else if (distFromEdge > fadeTicks) {
          opacity = baseMax + breathBoost;
        } else {
          const t = distFromEdge / fadeTicks;
          opacity = baseMin + (baseMax + breathBoost - baseMin) * Math.pow(t, 0.7);
        }

        return (
          <SvgLine
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={tint(opacity)}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        );
      })}
    </Svg>
  );
}

function TappableHaiku() {
  const { tint } = useTheme();
  const [index, setIndex] = useState(() => Math.floor(Math.random() * HAIKUS.length));
  const opacity = useRef(new RNAnimated.Value(1)).current;

  const nextHaiku = useCallback(() => {
    RNAnimated.timing(opacity, {
      toValue: 0,
      duration: 1200,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start(() => {
      setIndex((prev) => {
        if (HAIKUS.length <= 1) return prev;
        let next = prev;
        while (next === prev) {
          next = Math.floor(Math.random() * HAIKUS.length);
        }
        return next;
      });
      RNAnimated.timing(opacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
  }, [opacity]);

  return (
    <Pressable onPress={nextHaiku}>
      <RNAnimated.Text
        style={{
          opacity,
          color: tint(0.18),
          fontSize: 12,
          fontStyle: "italic",
          textAlign: "center",
          marginTop: 16,
          lineHeight: 18,
          paddingHorizontal: 20,
        }}
      >
        {HAIKUS[index]}
      </RNAnimated.Text>
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  const { tint } = useTheme();
  return (
    <Text
      style={{
        color: tint(1),
        fontSize: 17,
        fontWeight: "300",
        letterSpacing: 1.5,
        textTransform: "uppercase",
        marginBottom: 24,
        marginTop: 8,
      }}
    >
      {children}
    </Text>
  );
}

function Divider() {
  const { tint } = useTheme();
  return (
    <View
      style={{
        height: 1,
        backgroundColor: tint(0.06),
        marginVertical: 12,
      }}
    />
  );
}

export function SettingsPage({
  settings,
  durationMinutes,
  onUpdate,
  onPreviewSessionBell,
  onPreviewIntervalBell,
  onPreviewBackgroundNoise,
  onDimPreview,
}: SettingsPageProps) {
  const { tint, night } = useTheme();
  const insets = useSafeAreaInsets();

  // Slider shows brightness (1 = full, 0.05 = nearly black), stored as overlay opacity (inverted)
  const onDimSliderChange = useCallback((v: number) => {
    onDimPreview?.(1 - v);
  }, [onDimPreview]);

  const onDimSliderComplete = useCallback((v: number) => {
    onUpdate({ dimBrightness: 1 - v });
    onDimPreview?.(0);
  }, [onUpdate, onDimPreview]);

  const validIntervalOptions = INTERVAL_FREQ_OPTIONS.filter(
    (opt) => opt.value < durationMinutes,
  );
  const intervalsAvailable = validIntervalOptions.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-black"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: 28,
        paddingTop: insets.top + 48,
        paddingBottom: insets.bottom + 20,
      }}
    >
      {/* Session */}
      <SectionTitle>Session</SectionTitle>

      <SettingRow label="Bell Sound">
        <PillSelect
          options={SESSION_BELL_OPTIONS}
          selected={settings.sessionBell}
          onSelect={(v) => {
            onUpdate({ sessionBell: v });
            onPreviewSessionBell?.(v);
          }}
        />
      </SettingRow>

      <SettingRow label="Bell Count">
        <PillSelect
          options={BELL_COUNT_OPTIONS}
          selected={settings.bellCount}
          onSelect={(v) => onUpdate({ bellCount: v })}
        />
      </SettingRow>

      <SettingRow label="Prep Time">
        <PillSelect
          options={PREP_TIME_OPTIONS}
          selected={settings.prepTime}
          onSelect={(v) => onUpdate({ prepTime: v })}
        />
      </SettingRow>

      <Divider />

      {/* Ambience */}
      <SectionTitle>Ambience</SectionTitle>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text style={{ color: tint(0.5), fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Night Mode
          </Text>
          <Text style={{ color: tint(0.35), fontSize: 13 }}>
            Removes blue light for evening use
          </Text>
        </View>
        <Toggle
          value={settings.nightMode}
          onValueChange={(v) => onUpdate({ nightMode: v })}
        />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: settings.dimEnabled ? 16 : 32 }}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text style={{ color: tint(0.5), fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Extra Dim
          </Text>
          <Text style={{ color: tint(0.35), fontSize: 13 }}>
            Layers over your device brightness during meditation
          </Text>
        </View>
        <Toggle
          value={settings.dimEnabled}
          onValueChange={(v) => onUpdate({ dimEnabled: v })}
        />
      </View>

      {settings.dimEnabled && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(150)}
          style={{ marginBottom: 32 }}
        >
          <Text style={{ color: tint(0.25), fontSize: 12, marginBottom: 8 }}>
            Drag to preview brightness
          </Text>
          <Slider
            value={1 - settings.dimBrightness}
            onValueChange={onDimSliderChange}
            onSlidingComplete={onDimSliderComplete}
            minimumValue={0.1}
            maximumValue={1}
            step={0.01}
            minimumTrackTintColor={tint(0.4)}
            maximumTrackTintColor={tint(0.1)}
            thumbTintColor={tint(1)}
          />
        </Animated.View>
      )}

      <SettingRow label="Background Sound">
        <PillSelect
          options={BACKGROUND_NOISE_OPTIONS}
          selected={settings.backgroundNoise}
          onSelect={(v) => {
            onUpdate({ backgroundNoise: v });
            onPreviewBackgroundNoise?.(v);
          }}
        />
      </SettingRow>

      <Divider />

      {/* Intervals */}
      <SectionTitle>Intervals</SectionTitle>

      {!intervalsAvailable ? (
        <Text style={{ color: tint(0.3), fontSize: 13, marginBottom: 16 }}>
          Session too short for interval bells
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <Text style={{ color: tint(0.6), fontSize: 14 }}>
              Ring at regular intervals
            </Text>
            <Toggle
              value={settings.intervalEnabled}
              onValueChange={(v) => onUpdate({ intervalEnabled: v })}
            />
          </View>

          {settings.intervalEnabled && (
            <Animated.View
              entering={FadeIn.duration(200)}
              exiting={FadeOut.duration(150)}
            >
              <SettingRow label="Every">
                <PillSelect
                  options={validIntervalOptions}
                  selected={
                    validIntervalOptions.some((o) => o.value === settings.intervalFrequency)
                      ? settings.intervalFrequency
                      : validIntervalOptions[0].value
                  }
                  onSelect={(v) => onUpdate({ intervalFrequency: v })}
                />
              </SettingRow>

              <SettingRow label="Bell Sound">
                <PillSelect
                  options={INTERVAL_BELL_OPTIONS}
                  selected={settings.intervalBell}
                  onSelect={(v) => {
                    onUpdate({ intervalBell: v });
                    onPreviewIntervalBell?.(v);
                  }}
                />
              </SettingRow>
            </Animated.View>
          )}
        </>
      )}

      {/* System section — hidden for now
      <Divider />
      <SectionTitle>System</SectionTitle>

      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flex: 1, marginRight: 16 }}>
          <Text style={{ color: tint(0.5), fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Override Silent Mode
          </Text>
          <Text style={{ color: tint(0.35), fontSize: 13 }}>
            Bells play even when your phone is set to silent
          </Text>
        </View>
        <Toggle
          value={settings.overrideSilent}
          onValueChange={(v) => onUpdate({ overrideSilent: v })}
        />
      </View>
      */}

      {/* Enso circle and haiku — hidden for now
      <View style={{ alignItems: "center", marginTop: 80, marginBottom: 16 }}>
        <EnsoRing size={70} />
        <TappableHaiku />
      </View>
      */}
    </ScrollView>
  );
}
