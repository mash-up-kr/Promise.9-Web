const {
  AndroidConfig,
  withAndroidManifest,
  withAndroidStyles,
  withDangerousMod,
} = require("expo/config-plugins");
const fs = require("node:fs");
const path = require("node:path");

// Android 외부 공유를 iOS Share Extension 과 같은 UX 로 받는 전용 액티비티.
// 반투명 테마로 공유를 시작한 앱 위에 뜨고, RN "shareExtension" 루트(메인 번들)를 렌더한다.

const STYLE_NAME = "ShareActivityTheme";

function shareActivityKotlin(packageName) {
  return `package ${packageName}.share

import android.content.Intent
import android.os.Bundle
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import ${packageName}.BuildConfig
import expo.modules.ReactActivityDelegateWrapper

// ACTION_SEND 로 열리는 반투명 공유 액티비티 — 메인 번들의 "shareExtension" 루트를 그린다.
class ShareActivity : ReactActivity() {
  override fun getMainComponentName(): String = "shareExtension"

  override fun createReactActivityDelegate(): ReactActivityDelegate {
    return ReactActivityDelegateWrapper(
      this,
      BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
      object : DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled) {
        override fun getLaunchOptions(): Bundle {
          return Bundle().apply {
            putString("url", intent?.getStringExtra(Intent.EXTRA_TEXT))
          }
        }
      },
    )
  }
}
`;
}

function withShareActivitySource(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const packageName = config.android.package;
      const packageDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/java",
        ...packageName.split("."),
        "share",
      );
      fs.mkdirSync(packageDir, { recursive: true });
      fs.writeFileSync(
        path.join(packageDir, "ShareActivity.kt"),
        shareActivityKotlin(packageName),
      );
      return config;
    },
  ]);
}

function withShareActivityManifest(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );
    app.activity = (app.activity ?? []).filter(
      (activity) => activity.$["android:name"] !== ".share.ShareActivity",
    );
    app.activity.push({
      $: {
        "android:name": ".share.ShareActivity",
        "android:exported": "true",
        "android:theme": `@style/${STYLE_NAME}`,
        // 앱 태스크와 분리해 공유를 시작한 앱 위에 뜨고, 최근 앱 목록에도 남지 않게 한다.
        "android:taskAffinity": "",
        "android:excludeFromRecents": "true",
        "android:launchMode": "singleTop",
        // 시트 높이가 세로 기준 고정값이라 가로에선 헤더가 화면 밖으로 밀린다 — 앱과 같이 세로 고정.
        "android:screenOrientation": "portrait",
        // 메모 입력 시 창을 줄여 키보드 위로 시트가 올라오게 한다(MainActivity 와 동일).
        "android:windowSoftInputMode": "adjustResize",
        "android:configChanges":
          "keyboard|keyboardHidden|orientation|screenSize|uiMode",
      },
      "intent-filter": [
        {
          action: [{ $: { "android:name": "android.intent.action.SEND" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
          ],
          data: [{ $: { "android:mimeType": "text/*" } }],
        },
      ],
    });
    return config;
  });
}

function withShareActivityStyle(config) {
  return withAndroidStyles(config, (config) => {
    const styles = config.modResults.resources.style ?? [];
    config.modResults.resources.style = styles.filter(
      (style) => style.$.name !== STYLE_NAME,
    );
    config.modResults.resources.style.push({
      $: { name: STYLE_NAME, parent: "AppTheme" },
      item: [
        { $: { name: "android:windowIsTranslucent" }, _: "true" },
        {
          $: { name: "android:windowBackground" },
          _: "@android:color/transparent",
        },
        { $: { name: "android:windowNoTitle" }, _: "true" },
        {
          $: { name: "android:windowAnimationStyle" },
          _: "@android:style/Animation.Translucent",
        },
      ],
    });
    return config;
  });
}

module.exports = function withAndroidShareActivity(config) {
  return withShareActivityStyle(
    withShareActivityManifest(withShareActivitySource(config)),
  );
};
