import { createFolderSchema } from "./archive.contracts";

describe("createFolderSchema", () => {
  test("유효한 이름·색상을 통과시킨다", () => {
    const result = createFolderSchema.safeParse({
      name: "디자인",
      color: "blue",
    });
    expect(result.success).toBe(true);
  });

  test("빈 이름을 거부한다", () => {
    const result = createFolderSchema.safeParse({ name: "", color: "blue" });
    expect(result.success).toBe(false);
  });

  test("공백만 있는 이름을 거부한다", () => {
    const result = createFolderSchema.safeParse({ name: "   ", color: "blue" });
    expect(result.success).toBe(false);
  });

  test("선택 불가한 색상(gray)을 거부한다", () => {
    const result = createFolderSchema.safeParse({
      name: "폴더",
      color: "gray",
    });
    expect(result.success).toBe(false);
  });
});
