
/* Replace only the specific PieChart component usage with the correct props */
import { PieChart } from "@/components/ui/chart";

export default function DashboardOverview() {
  return (
    <PieChart
      data={[
        { name: "Type 1", value: 42 },
        { name: "Type 2", value: 28 },
        { name: "Type 3", value: 18 },
      ]}
      valueKey="value"
      categoryKey="name"
      index="name"
      categories={["value"]}
      colors={["blue", "green", "amber"]}
      valueFormatter={(value: number) => `${value}%`}
      className="h-full"
    />
  );
}
