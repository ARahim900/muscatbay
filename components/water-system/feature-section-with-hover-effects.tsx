
import { cn } from "@/lib/utils";
import { DollarSign, Droplets, BarChart3, Map, AlertTriangle, PieChart, Layers, Activity } from "lucide-react";

interface FeatureProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  value: string;
  index: number;
  trend?: string;
  status?: string;
}

export function FeaturesSectionWithHoverEffects({ features }: { features: Omit<FeatureProps, 'index'>[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 relative z-10 py-4 max-w-7xl mx-auto">
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
  value,
  index,
  trend,
  status,
}: FeatureProps) => {
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
      <div className="mb-4 relative z-10 px-6 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="text-lg font-bold mb-1 relative z-10 px-6">
        <div className="absolute left-0 inset-y-0 h-6 group-hover/feature:h-8 w-1 rounded-tr-full rounded-br-full bg-neutral-300 dark:bg-neutral-700 group-hover/feature:bg-blue-500 transition-all duration-200 origin-center" />
        <span className="group-hover/feature:translate-x-1 transition duration-200 inline-block text-neutral-800 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="text-3xl font-semibold mb-1 px-6 relative z-10">
        {value}
        {trend && (
          <span className={cn(
            "text-xs ml-2",
            trend.startsWith('+') ? "text-green-500" : "text-red-500"
          )}>
            {trend}
          </span>
        )}
      </p>
      <p className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs relative z-10 px-6">
        {description}
      </p>
      {status && (
        <div className={cn(
          "mt-2 px-6 text-xs py-1 rounded-full w-fit ml-6",
          status === "Good" ? "bg-green-100 text-green-800" : 
          status === "Warning" ? "bg-yellow-100 text-yellow-800" : 
          "bg-red-100 text-red-800"
        )}>
          {status}
        </div>
      )}
    </div>
  );
};

export const getWaterSystemIcons = () => {
  return {
    mainBulk: <Droplets className="h-5 w-5" />,
    zonesBulk: <Map className="h-5 w-5" />,
    individual: <BarChart3 className="h-5 w-5" />,
    stage1Loss: <AlertTriangle className="h-5 w-5" />,
    stage2Loss: <PieChart className="h-5 w-5" />,
    totalLoss: <Activity className="h-5 w-5" />,
    consumption: <DollarSign className="h-5 w-5" />,
    distribution: <Layers className="h-5 w-5" />
  };
};
