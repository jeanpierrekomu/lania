import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--radius-control)] px-6 text-base font-semibold transition-[background-color,box-shadow,transform] duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none [&_svg]:size-5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-ink shadow-card hover:bg-primary-hover hover:shadow-raised",
        secondary: "border border-border bg-surface text-ink shadow-card hover:border-primary hover:bg-primary-soft",
        ghost: "text-ink hover:bg-primary-soft",
        link: "min-h-0 px-0 text-primary underline underline-offset-4 hover:no-underline",
      },
      size: { md: "", lg: "min-h-14 px-8 text-lg", sm: "min-h-10 px-4 text-sm" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
