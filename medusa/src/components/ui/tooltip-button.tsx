import * as React from "react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { VariantProps } from "class-variance-authority"

interface TooltipButtonProps extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  tooltip: string
  tooltipSide?: "top" | "right" | "bottom" | "left"
  tooltipAlign?: "start" | "center" | "end"
  children: React.ReactNode
  asChild?: boolean
}

const TooltipButton = React.forwardRef<
  HTMLButtonElement,
  TooltipButtonProps
>(({ tooltip, tooltipSide = "top", tooltipAlign = "center", children, ...props }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button ref={ref} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side={tooltipSide} align={tooltipAlign}>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  )
})

TooltipButton.displayName = "TooltipButton"

export { TooltipButton, type TooltipButtonProps }