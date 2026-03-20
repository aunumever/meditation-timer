const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to auto-hide the iOS home indicator.
 * Adds prefersHomeIndicatorAutoHidden to the root view controller via swizzling.
 * Takes effect on dev client / production builds (not Expo Go).
 */
module.exports = function withHomeIndicatorHidden(config) {
  return withDangerousMod(config, [
    "ios",
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const projectName = config.modRequest.projectName;
      const iosDir = path.join(projectRoot, "ios", projectName);

      // Create a separate Swift file with method swizzling
      const swizzleFile = path.join(iosDir, "HomeIndicatorHidden.swift");
      if (!fs.existsSync(swizzleFile)) {
        fs.writeFileSync(
          swizzleFile,
          `import UIKit

// Swizzle UIViewController to auto-hide home indicator app-wide
private let swizzleOnce: Void = {
  let original = class_getInstanceMethod(UIViewController.self, #selector(getter: UIViewController.prefersHomeIndicatorAutoHidden))!
  let swizzled = class_getInstanceMethod(UIViewController.self, #selector(UIViewController.swizzled_prefersHomeIndicatorAutoHidden))!
  method_exchangeImplementations(original, swizzled)
}()

extension UIViewController {
  @objc func swizzled_prefersHomeIndicatorAutoHidden() -> Bool {
    return true
  }

  static let enableHomeIndicatorHidden: Void = {
    _ = swizzleOnce
  }()
}
`
        );
      }

      // Add the swizzle trigger to AppDelegate
      const appDelegate = path.join(iosDir, "AppDelegate.swift");
      if (fs.existsSync(appDelegate)) {
        let contents = fs.readFileSync(appDelegate, "utf-8");

        // Remove old broken extension if present
        contents = contents.replace(
          /\n\/\/ Auto-hide home indicator\nextension UIViewController \{[\s\S]*?\n\}\n/,
          "\n"
        );

        // Add swizzle trigger in didFinishLaunchingWithOptions
        if (!contents.includes("enableHomeIndicatorHidden")) {
          contents = contents.replace(
            "return super.application(application, didFinishLaunchingWithOptions: launchOptions)",
            "UIViewController.enableHomeIndicatorHidden\n\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)"
          );
          fs.writeFileSync(appDelegate, contents);
        }
      }

      return config;
    },
  ]);
};
