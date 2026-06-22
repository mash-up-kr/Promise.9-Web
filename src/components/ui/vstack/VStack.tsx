import { View } from "react-native";
import { tv, type VariantProps } from "tailwind-variants";

const vstackStyles = tv({
  base: "flex-col",
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
      true: "flex-col-reverse",
    },
  },
});

type RNViewProps = React.ComponentProps<typeof View>;

export interface VStackProps
  extends Omit<RNViewProps, "className">,
    VariantProps<typeof vstackStyles> {
  className?: string;
}

export function VStack({ className, space, reversed, ...props }: VStackProps) {
  return (
    <View
      {...props}
      className={vstackStyles({ space, reversed, class: className })}
    />
  );
}
