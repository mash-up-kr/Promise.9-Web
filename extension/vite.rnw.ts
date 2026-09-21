import path from "node:path";

import type { Plugin } from "vite";

export interface ReactNativeWebOptions {
  /** `react-native` 대신 줄 모듈 — RNW + className 을 받는 react-native-css 컴포넌트. */
  shim: string;
}

const NODE_MODULES = `${path.sep}node_modules${path.sep}`;

/**
 * Metro 의 react-native-css 리졸버가 하는 일을 Vite 에서 재현한다.
 *
 * 앱·패키지 코드의 `react-native` 는 shim 으로, 라이브러리와 shim 자신의 `react-native` 는
 * react-native-web 으로 보낸다(shim 으로 되돌아오면 순환한다). `resolve.alias` 는 importer 를
 * 몰라서 이 구분을 못 한다.
 */
export function reactNativeWeb({ shim }: ReactNativeWebOptions): Plugin {
  return {
    name: "promise9:react-native-web",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (source !== "react-native" || !importer) return null;

      const isLibrary = importer.includes(NODE_MODULES) || importer === shim;
      if (!isLibrary) return shim;

      // 패키지 소스는 extension/ 밖이라 그 자리에서 풀면 루트 node_modules 사본을 집는다.
      return this.resolve("react-native-web", shim, {
        ...options,
        skipSelf: true,
      });
    },
  };
}
