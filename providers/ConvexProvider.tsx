import { ConvexProvider as ConvexReactProvider, ConvexReactClient } from "convex/react";
import { ReactNode } from "react";

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL;

const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;

export function ConvexProvider({ children }: { children: ReactNode }) {
  if (!convex) {
    // Allow the app to run without Convex during development
    return <>{children}</>;
  }
  return <ConvexReactProvider client={convex}>{children}</ConvexReactProvider>;
}
