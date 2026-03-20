const { withDangerousMod, withInfoPlist } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Expo config plugin to auto-hide the iOS home indicator.
 * - Wraps root VC with a custom controller that returns prefersHomeIndicatorAutoHidden = true
 * - Sets UIRequiresFullScreen and UIStatusBarHidden in Info.plist
 */
function withHomeIndicatorHidden(config) {
  // Step 1: Modify Info.plist
  config = withInfoPlist(config, (config) => {
    config.modResults.UIRequiresFullScreen = true;
    config.modResults.UIStatusBarHidden = true;
    config.modResults.UIViewControllerBasedStatusBarAppearance = false;
    return config;
  });

  // Step 2: Add wrapper VC to AppDelegate and ObjC swizzle file
  config = withDangerousMod(config, [
    "ios",
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const projectName = config.modRequest.projectName;
      const iosDir = path.join(projectRoot, "ios", projectName);

      // Write the ObjC swizzle file
      const homeIndicatorFile = path.join(iosDir, "HomeIndicator.m");
      fs.writeFileSync(
        homeIndicatorFile,
        `#import <UIKit/UIKit.h>
#import <objc/runtime.h>

@implementation UIViewController (HomeIndicatorHidden)

+ (void)load {
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class cls = [UIViewController class];
    {
      SEL sel = @selector(prefersHomeIndicatorAutoHidden);
      SEL swiz = @selector(_hi_prefersHomeIndicatorAutoHidden);
      Method orig = class_getInstanceMethod(cls, sel);
      Method swzl = class_getInstanceMethod(cls, swiz);
      BOOL added = class_addMethod(cls, sel,
        method_getImplementation(swzl), method_getTypeEncoding(swzl));
      if (added) {
        class_replaceMethod(cls, swiz,
          method_getImplementation(orig), method_getTypeEncoding(orig));
      } else {
        method_exchangeImplementations(orig, swzl);
      }
    }
    {
      SEL sel = @selector(childForHomeIndicatorAutoHidden);
      SEL swiz = @selector(_hi_childForHomeIndicatorAutoHidden);
      Method orig = class_getInstanceMethod(cls, sel);
      Method swzl = class_getInstanceMethod(cls, swiz);
      BOOL added = class_addMethod(cls, sel,
        method_getImplementation(swzl), method_getTypeEncoding(swzl));
      if (added) {
        class_replaceMethod(cls, swiz,
          method_getImplementation(orig), method_getTypeEncoding(orig));
      } else {
        method_exchangeImplementations(orig, swzl);
      }
    }
    {
      SEL sel = @selector(viewDidAppear:);
      SEL swiz = @selector(_hi_viewDidAppear:);
      Method orig = class_getInstanceMethod(cls, sel);
      Method swzl = class_getInstanceMethod(cls, swiz);
      method_exchangeImplementations(orig, swzl);
    }
  });
}

- (BOOL)_hi_prefersHomeIndicatorAutoHidden { return YES; }
- (nullable UIViewController *)_hi_childForHomeIndicatorAutoHidden { return nil; }
- (void)_hi_viewDidAppear:(BOOL)animated {
  [self _hi_viewDidAppear:animated];
  [self setNeedsUpdateOfHomeIndicatorAutoHidden];
}

@end
`
      );

      // Modify AppDelegate.swift to add wrapper VC
      const appDelegate = path.join(iosDir, "AppDelegate.swift");
      if (fs.existsSync(appDelegate)) {
        let contents = fs.readFileSync(appDelegate, "utf-8");

        if (!contents.includes("HiddenHomeIndicatorVC")) {
          // Add the wrapper VC class before @UIApplicationMain
          const wrapperClass = `
class HiddenHomeIndicatorVC: UIViewController {
  private let child: UIViewController
  init(child: UIViewController) {
    self.child = child
    super.init(nibName: nil, bundle: nil)
  }
  required init?(coder: NSCoder) { fatalError() }
  override func viewDidLoad() {
    super.viewDidLoad()
    addChild(child)
    child.view.frame = view.bounds
    child.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    view.addSubview(child.view)
    child.didMove(toParent: self)
  }
  override var prefersHomeIndicatorAutoHidden: Bool { true }
  override var prefersStatusBarHidden: Bool { true }
  override var childForHomeIndicatorAutoHidden: UIViewController? { nil }
}

`;
          contents = contents.replace("@UIApplicationMain", wrapperClass + "@UIApplicationMain");

          // Wrap root VC after startReactNative
          contents = contents.replace(
            "return super.application(application, didFinishLaunchingWithOptions: launchOptions)",
            `if let rootVC = window?.rootViewController {
      window?.rootViewController = HiddenHomeIndicatorVC(child: rootVC)
    }

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
          );

          fs.writeFileSync(appDelegate, contents);
        }
      }

      return config;
    },
  ]);

  return config;
}

module.exports = withHomeIndicatorHidden;
