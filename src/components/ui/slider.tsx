import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from '../../lib/utils'

function Slider({
  className,
  defaultValue,
  value,
  min = 0,
  max = 100,
  step,
  ...props
}: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const _values = React.useMemo(
    () =>
      Array.isArray(value)
        ? value
        : Array.isArray(defaultValue)
          ? defaultValue
          : typeof value === "number"
            ? [value]
            : typeof defaultValue === "number"
              ? [defaultValue]
              : [min],
    [value, defaultValue, min]
  )

  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      step={step}
      className={cn(
        "relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "bg-gray-200 relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-2"
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "bg-blue-600 absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full transition-all duration-150 ease-out"
          )}
        />
      </SliderPrimitive.Track>
      {Array.from({ length: _values.length }, (_, index) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={index}
          className="border-blue-600 ring-blue-200/50 block size-4.5 shrink-0 rounded-full border-2 bg-white shadow-md transition-all hover:scale-110 hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50 active:scale-125"
        />
      ))}
    </SliderPrimitive.Root>
  )
}

export { Slider }
