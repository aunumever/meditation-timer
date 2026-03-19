import { View, Text, Switch, ScrollView } from "react-native";
import Svg, { Path as SvgPath } from "react-native-svg";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PillSelect } from "./PillSelect";
import { SettingRow } from "./SettingRow";
import type {
  Settings,
  SessionBell,
  IntervalBell,
  BellCount,
  PrepTime,
  IntervalFrequency,
} from "@/lib/settings";

interface SettingsPageProps {
  settings: Settings;
  /** Total meditation duration in minutes */
  durationMinutes: number;
  onUpdate: (patch: Partial<Settings>) => void;
  onPreviewSessionBell?: (bell: SessionBell) => void;
  onPreviewIntervalBell?: (bell: IntervalBell) => void;
}

const SESSION_BELL_OPTIONS: { label: string; value: SessionBell }[] = [
  { label: "Bowl Deep", value: "bowl-deep" },
  { label: "Bowl High", value: "bowl-high" },
  { label: "Bell Bright", value: "bell-bright" },
  { label: "Bell Soft", value: "bell-soft" },
  { label: "Gong", value: "gong" },
];

const INTERVAL_BELL_OPTIONS: { label: string; value: IntervalBell }[] = [
  { label: "Chime Soft", value: "chime-soft" },
  { label: "Chime High", value: "chime-high" },
  { label: "Woodblock", value: "woodblock" },
];

const BELL_COUNT_OPTIONS: { label: string; value: BellCount }[] = [
  { label: "1", value: 1 },
  { label: "3", value: 3 },
];

const PREP_TIME_OPTIONS: { label: string; value: PrepTime }[] = [
  { label: "Off", value: 0 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "45s", value: 45 },
  { label: "60s", value: 60 },
];

const INTERVAL_FREQ_OPTIONS: { label: string; value: IntervalFrequency }[] = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "20 min", value: 20 },
  { label: "30 min", value: 30 },
];

function SectionTitle({ children }: { children: string }) {
  return (
    <Text
      style={{
        color: "white",
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
  return (
    <View
      style={{
        height: 1,
        backgroundColor: "rgba(255,255,255,0.06)",
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
}: SettingsPageProps) {
  const insets = useSafeAreaInsets();

  // Only show interval frequencies shorter than the session duration
  const validIntervalOptions = INTERVAL_FREQ_OPTIONS.filter(
    (opt) => opt.value < durationMinutes,
  );
  const intervalsAvailable = validIntervalOptions.length > 0;

  return (
    <ScrollView
      className="flex-1 bg-black"
      contentContainerStyle={{
        paddingHorizontal: 28,
        paddingTop: insets.top + 48,
        paddingBottom: insets.bottom + 100,
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

      {/* Intervals */}
      <SectionTitle>Intervals</SectionTitle>

      {!intervalsAvailable ? (
        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, marginBottom: 16 }}>
          Session too short for interval bells
        </Text>
      ) : (
        <>
          <View className="flex-row items-center justify-between mb-6">
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
              Ring at regular intervals
            </Text>
            <Switch
              value={settings.intervalEnabled}
              onValueChange={(v) => onUpdate({ intervalEnabled: v })}
              trackColor={{ false: "rgba(255,255,255,0.08)", true: "rgba(255,255,255,0.25)" }}
              thumbColor="#fff"
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

      <Divider />

      {/* System */}
      <SectionTitle>System</SectionTitle>

      <View className="flex-row items-center justify-between">
        <View className="flex-1 mr-4">
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
            Override Silent Mode
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
            Bells play even when silenced
          </Text>
        </View>
        <Switch
          value={settings.overrideSilent}
          onValueChange={(v) => onUpdate({ overrideSilent: v })}
          trackColor={{ false: "rgba(255,255,255,0.08)", true: "rgba(255,255,255,0.25)" }}
          thumbColor="#fff"
        />
      </View>

      {/* Enso circle and quote */}
      <View style={{ alignItems: "center", marginTop: 80, marginBottom: 16 }}>
        <Svg width={60} height={60} viewBox="0 0 60 60">
          <SvgPath
            d="M30 6 C45 6, 54 18, 54 30 C54 42, 45 54, 30 54 C15 54, 6 42, 6 30 C6 18, 14 8, 26 6.5"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={2.5}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
        <Text
          style={{
            color: "rgba(255,255,255,0.2)",
            fontSize: 12,
            fontStyle: "italic",
            textAlign: "center",
            marginTop: 16,
            lineHeight: 18,
            paddingHorizontal: 20,
          }}
        >
          sit quietly, doing nothing,{"\n"}
          spring comes, and the grass{"\n"}
          grows by itself
        </Text>
      </View>
    </ScrollView>
  );
}
