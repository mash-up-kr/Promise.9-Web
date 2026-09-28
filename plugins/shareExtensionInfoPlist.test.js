/**
 * @jest-environment node
 */
const plist = require("@expo/plist").default;
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { updateShareExtensionInfoPlist } = require("./shareExtensionInfoPlist");
const {
  enableFullScreenPresentation,
} = require("./withShareExtensionFullScreenPresentation");

describe("updateShareExtensionInfoPlist", () => {
  let dir;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "share-ext-plist-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  test("Info.plist 를 읽어 고친 뒤 다시 쓴다", () => {
    const file = path.join(dir, "Info.plist");
    fs.writeFileSync(file, plist.build({ CFBundleDisplayName: "before" }));

    updateShareExtensionInfoPlist(file, "plugin", (parsed) => {
      parsed.CFBundleDisplayName = "after";
    });

    expect(plist.parse(fs.readFileSync(file, "utf8"))).toEqual({
      CFBundleDisplayName: "after",
    });
  });

  test("파일이 없으면 플러그인 이름을 붙여 실패한다", () => {
    expect(() =>
      updateShareExtensionInfoPlist(
        path.join(dir, "Info.plist"),
        "myPlugin",
        () => {},
      ),
    ).toThrow("[myPlugin]");
  });
});

describe("enableFullScreenPresentation", () => {
  test("NSExtensionAttributes 에 전체화면 키를 넣는다", () => {
    const parsed = { NSExtension: { NSExtensionAttributes: {} } };
    enableFullScreenPresentation(parsed);
    expect(
      parsed.NSExtension.NSExtensionAttributes
        .NSExtensionShareWantsFullScreenPresentation,
    ).toBe(true);
  });

  test("NSExtensionAttributes 가 없으면 플러그인 이름을 붙여 실패한다", () => {
    expect(() => enableFullScreenPresentation({})).toThrow(
      "[withShareExtensionFullScreenPresentation]",
    );
  });
});
