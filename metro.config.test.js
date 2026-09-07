/**
 * @jest-environment node
 */
const config = require("./metro.config");

const RN_INDEX = "/fake/node_modules/react-native/index.js";
const CSS_COMPONENTS =
  "/fake/node_modules/react-native-css/dist/commonjs/components/index.cjs";

function createContext(dependencyData) {
  return {
    originModulePath: "/fake/node_modules/react-native-worklets/src/x.ts",
    dependency: { data: dependencyData },
    resolveRequest: (_context, moduleName) => ({
      type: "sourceFile",
      filePath: moduleName === "react-native" ? RN_INDEX : CSS_COMPONENTS,
    }),
  };
}

describe("metro.config resolver", () => {
  it("resolves a weak react-native reference to react-native itself", () => {
    const context = createContext({ asyncType: "weak", isESMImport: false });

    const result = config.resolver.resolveRequest(
      context,
      "react-native",
      "ios",
    );

    expect(result.filePath).toBe(RN_INDEX);
  });

  it("still redirects a normal react-native import to react-native-css components", () => {
    const context = createContext({ asyncType: null, isESMImport: true });

    const result = config.resolver.resolveRequest(
      context,
      "react-native",
      "ios",
    );

    expect(result.filePath).toBe(CSS_COMPONENTS);
  });
});
