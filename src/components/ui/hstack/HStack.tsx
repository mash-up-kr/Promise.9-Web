import { View } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";

const hstackStyles = tv({
  base: "flex-row",
  variants: {
    space: {
      xs: "gap-1",
      sm: "gap-2",
      md: "gap-3",
      lg: "gap-4",
      xl: "gap-5",
      "2xl": "gap-6",
      "3xl": "gap-7",
      "4xl": "gap-8",
    },
    reversed: {
      true: "flex-row-reverse",
    },
  },
});

type RNViewProps = React.ComponentProps<typeof View>;

export interface HStackProps
  extends Omit<RNViewProps, "className">,
    VariantProps<typeof hstackStyles> {
  className?: string;
}

export function HStack({ className, space, reversed, ...props }: HStackProps) {
  return (
    <View
      {...props}
      className={hstackStyles({ space, reversed, class: className })}
    />
  );
}
