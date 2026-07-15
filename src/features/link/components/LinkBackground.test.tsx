import { render } from "@testing-library/react-native";

import { LinkBackground } from "./LinkBackground";

const THUMBNAIL = "https://picsum.photos/seed/test/335/235";

describe("LinkBackground", () => {
  it("dominantColor와 함께 렌더된다", () => {
    render(<LinkBackground thumbnailUrl={THUMBNAIL} dominantColor="#3182F6" />);
  });

  it("dominantColor 없이 렌더된다 (optional)", () => {
    render(<LinkBackground thumbnailUrl={THUMBNAIL} />);
  });
});
