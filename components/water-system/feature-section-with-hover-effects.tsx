
import React from "react";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  CloudRain,
  CircleDollarSign,
  CirclePercent,
  ChartLineUp,
  ChartBar,
  CircleHelp,
  Activity,
} from "lucide-react";
import { formatNumber, formatPercentage } from "./water-data-utils";

interface SummaryData {
  l1Total: number;
  l2Total: number;
  l3Total: number;
  l1ToL2Loss: number;
  l2ToL3Loss: number;
  totalLoss: number;
}

export function FeaturesSectionWithHoverEffects({
  summaryData,
}: {
  summaryData: SummaryData;
}) {
  // Calculate percentages
  const l1ToL2LossPercent = ((summaryData.l1ToL2Loss / summaryData.l1Total) * 100).toFixed(1);
  const l2ToL3LossPercent = ((summaryData.l2ToL3Loss / summaryData.l2Total) * 100).toFixed(1);
  const totalLossPercent = ((summaryData.totalLoss / summaryData.l1Total) * 100).toFixed(1);

  const features = [
    {
      title: "Main Supply (L1)",
      description: `${formatNumber(summaryData.l1Total)} m³`,
      icon: <ChartBar className="h-6 w-6" />,
    },
    {
      title: "Zone Distribution (L2)",
      description: `${formatNumber(summaryData.l2Total)} m³`,
      icon: <CloudRain className="h-6 w-6" />,
    },
    {
      title: "End Consumption (L3)",
      description: `${formatNumber(summaryData.l3Total)} m³`,
      icon: <Activity className="h-6 w-6" />,
    },
    {
      title: "Supply to Zone Loss",
      description: `${formatNumber(summaryData.l1ToL2Loss)} m³ (${l1ToL2LossPercent}%)`,
      icon: <BarChart3 className="h-6 w-6" />,
    },
    {
      title: "Zone to End User Loss",
      description: `${formatNumber(summaryData.l2ToL3Loss)} m³ (${l2ToL3LossPercent}%)`,
      icon: <ChartLineUp className="h-6 w-6" />,
    },
    {
      title: "Total System Loss",
      description: `${formatNumber(summaryData.totalLoss)} m³ (${totalLossPercent}%)`,
      icon: <CirclePercent className="h-6 w-6" />,
    },
    {
      title: "Financial Impact",
      description: `${formatNumber(Math.round(summaryData.totalLoss * 1.32))} OMR`,
      icon: <CircleDollarSign className="h-6 w-6" />,
    },
    {
      title: "Water Quality",
      description: "98.5% compliance rate",
      icon: <CircleHelp className="h-6 w-6" />,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-6 max-w-7xl mx-auto">
      {features.map((feature, index) => (
        <Feature key={feature.title} {...feature} index={index} />
      ))}
    </div>
  );
}

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "flex flex-col lg:border-r py-6 relative group/feature dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800"
      )}
    >
      {index < 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      {index >= 4 && (
        <div className="opacity-0 group-hover/feature:opacity-100 transition duration-200 absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 dark:from-neutral-800 to-transparent pointer-events-none" />
      )}
      <div className="mb-3 relative z-10 px-6 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-2 relative z-10 px-6">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-2 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-6">
        {description}
      </p>
    </div>
  );
};
