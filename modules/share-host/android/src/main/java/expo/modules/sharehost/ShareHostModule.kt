package expo.modules.sharehost

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Android 공유 액티비티(ShareActivity)를 JS 에서 닫기 위한 최소 모듈.
// iOS 는 expo-share-extension 의 close() 를 쓰므로 android 전용이다.
class ShareHostModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ShareHost")

    Function("close") {
      val activity = appContext.currentActivity
      activity?.runOnUiThread { activity.finish() }
    }
  }
}
