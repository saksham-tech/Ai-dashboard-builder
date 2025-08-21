"use client"

import * as React from "react"
import {
  Bar,
  BarChart as BarChartPrimitive,
  CartesianGrid,
  Legend as RechartsLegend,
  Line,
  LineChart as LineChartPrimitive,
  Pie,
  PieChart as PieChartPrimitive,
  RadialBar,
  RadialBarChart as RadialBarChartPrimitive,
  Radar,
  RadarChart as RadarChartPrimitive,
  ResponsiveContainer,
  Scatter,
  ScatterChart as ScatterChartPrimitive,
  Tooltip,
  XAxis,
  YAxis,
  type LegendProps,
  type TooltipProps,
} from "recharts"
import { type NameType, type ValueType } from "recharts/types/component/DefaultTooltipContent"

import { cn } from "@/lib/utils"

// Chart Container
// ---------------

type ChartContainerProps = React.ComponentProps<"div"> & {
  children: React.ReactElement
}

const ChartContainer = React.forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex aspect-video w-full items-center justify-center",
          className
        )}
        {...props}
      >
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    )
  }
)
ChartContainer.displayName = "ChartContainer"

// Chart Tooltip
// -------------

const ChartTooltip = Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & TooltipProps<ValueType, NameType>
>(({ active, payload, label, className, ...props }, ref) => {
  if (!active || !payload?.length) {
    return null
  }

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-lg border bg-background p-2 text-sm shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      {...props}
    >
      <div className="font-medium">{label}</div>
      <div className="text-muted-foreground">
        {payload.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: item.color,
              }}
            />
            {item.name}
          </div>
        ))}
      </div>
    </div>
  )
})
ChartTooltipContent.displayName = "ChartTooltipContent"

// Chart Legend
// ------------

type ChartLegendPayload = NonNullable<LegendProps["payload"]>

const ChartLegend = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    React.ComponentProps<typeof RechartsLegend> & {
      payload?: ChartLegendPayload
    }
>(({ className, ...props }, ref) => {
  return (
    <div ref={ref} className={cn("flex items-center", className)} {...props}>
      <RechartsLegend {...props} />
    </div>
  )
})
ChartLegend.displayName = "ChartLegend"

type ChartLegendContentProps = React.ComponentProps<"div"> &
  Pick<LegendProps, "verticalAlign"> & {
    payload?: ChartLegendPayload
    hideLabel?: boolean
  }

const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(({ className, hideLabel, payload, verticalAlign }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-4",
        verticalAlign === "top" ? "pb-4" : "pt-4",
        className
      )}
    >
      {payload?.map((item) => {
        const { color, value } = item
        return (
          <div
            key={value}
            className={cn(
              "flex items-center gap-1.5",
              verticalAlign === "top" ? "flex-row" : "flex-col"
            )}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
              style={{
                backgroundColor: color,
              }}
            />
            {!hideLabel && (
              <div
                className={cn(
                  "text-xs",
                  verticalAlign === "top"
                    ? "whitespace-nowrap"
                    : "flex flex-col items-center justify-center"
                )}
              >
                {value}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})
ChartLegendContent.displayName = "ChartLegendContent"

// Exports
// -------

const Chart = ChartContainer

const ChartXAxis = XAxis

const ChartYAxis = YAxis

const ChartGrid = CartesianGrid

const BarChart = BarChartPrimitive

const ChartBar = Bar

const LineChart = LineChartPrimitive

const ChartLine = Line

const PieChart = PieChartPrimitive

const ChartPie = Pie

const RadarChart = RadarChartPrimitive

const ChartRadar = Radar

const RadialBarChart = RadialBarChartPrimitive

const ChartRadialBar = RadialBar

const ScatterChart = ScatterChartPrimitive

const ChartScatter = Scatter

export {
  Chart,
  ChartBar,
  ChartContainer,
  ChartGrid,
  ChartLegend,
  ChartLegendContent,
  ChartLine,
  ChartPie,
  ChartRadar,
  ChartRadialBar,
  ChartScatter,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
  BarChart,
  LineChart,
  PieChart,
  RadarChart,
  RadialBarChart,
  ScatterChart,
}