import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

interface STPData {
  date: string;
  tankerTrips: number;
  expectedVolumeTankers: number;
  directSewageMB: number;
  totalInfluent: number;
  totalWaterProcessed: number;
  tseToIrrigation: number;
}

interface MonthlyData {
  month: string;
  tankerTrips: number;
  expectedVolumeTankers: number;
  directSewageMB: number;
  totalInfluent: number;
  totalWaterProcessed: number;
  tseToIrrigation: number;
}

const monthlyData: MonthlyData[] = [
  {
    month: "Jul 2024",
    tankerTrips: 442,
    expectedVolumeTankers: 8840,
    directSewageMB: 8055,
    totalInfluent: 16895,
    totalWaterProcessed: 18308,
    tseToIrrigation: 16067
  },
  {
    month: "Aug 2024",
    tankerTrips: 378,
    expectedVolumeTankers: 7560,
    directSewageMB: 8081,
    totalInfluent: 15641,
    totalWaterProcessed: 17372,
    tseToIrrigation: 15139
  },
  {
    month: "Sep 2024",
    tankerTrips: 283,
    expectedVolumeTankers: 5660,
    directSewageMB: 8146,
    totalInfluent: 13806,
    totalWaterProcessed: 14859,
    tseToIrrigation: 13196
  },
  {
    month: "Oct 2024",
    tankerTrips: 289,
    expectedVolumeTankers: 5780,
    directSewageMB: 10617,
    totalInfluent: 16397,
    totalWaterProcessed: 17669,
    tseToIrrigation: 15490
  },
  {
    month: "Nov 2024",
    tankerTrips: 235,
    expectedVolumeTankers: 4700,
    directSewageMB: 9840,
    totalInfluent: 14540,
    totalWaterProcessed: 16488,
    tseToIrrigation: 14006
  },
  {
    month: "Dec 2024",
    tankerTrips: 196,
    expectedVolumeTankers: 3920,
    directSewageMB: 11293,
    totalInfluent: 15213,
    totalWaterProcessed: 17444,
    tseToIrrigation: 14676
  },
  {
    month: "Jan 2025",
    tankerTrips: 207,
    expectedVolumeTankers: 4140,
    directSewageMB: 11583,
    totalInfluent: 15723,
    totalWaterProcessed: 18212,
    tseToIrrigation: 15433
  },
  {
    month: "Feb 2025",
    tankerTrips: 121,
    expectedVolumeTankers: 2420,
    directSewageMB: 10660,
    totalInfluent: 13080,
    totalWaterProcessed: 14408,
    tseToIrrigation: 12075
  }
];

const dailyData: STPData[] = [
  {
    date: "2024-07-01",
    tankerTrips: 10,
    expectedVolumeTankers: 200,
    directSewageMB: 139,
    totalInfluent: 339,
    totalWaterProcessed: 385,
    tseToIrrigation: 340
  },
  {
    date: "2024-07-02",
    tankerTrips: 14,
    expectedVolumeTankers: 280,
    directSewageMB: 246,
    totalInfluent: 526,
    totalWaterProcessed: 519,
    tseToIrrigation: 458
  },
  // Add all the daily data here following the same pattern
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const STPDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState<string>("Jul 2024");

  const filteredDailyData = useMemo(() => {
    return dailyData.filter(item => {
      const itemDate = new Date(item.date);
      const monthYear = itemDate.toLocaleString('en-US', { month: 'short', year: 'numeric' });
      return monthYear === selectedMonth;
    });
  }, [selectedMonth]);

  const monthStats = useMemo(() => {
    const monthData = monthlyData.find(m => m.month === selectedMonth);
    if (!monthData) return null;

    const totalVolume = monthData.totalWaterProcessed;
    const tankerPercentage = (monthData.expectedVolumeTankers / totalVolume) * 100;
    const directSewagePercentage = (monthData.directSewageMB / totalVolume) * 100;
    const irrigationPercentage = (monthData.tseToIrrigation / totalVolume) * 100;

    return {
      totalVolume,
      tankerPercentage: Number(tankerPercentage.toFixed(1)),
      directSewagePercentage: Number(directSewagePercentage.toFixed(1)),
      irrigationPercentage: Number(irrigationPercentage.toFixed(1))
    };
  }, [selectedMonth]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">STP Plant Dashboard</h1>
        <p className="text-muted-foreground">
          Monitor and analyze Sewage Treatment Plant performance metrics
        </p>
      </div>

      <div className="flex items-center justify-between">
        <Tabs defaultValue="monthly" className="w-full">
          <TabsList>
            <TabsTrigger value="monthly">Monthly View</TabsTrigger>
            <TabsTrigger value="daily">Daily View</TabsTrigger>
          </TabsList>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Water Processed</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2v20M2 12h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthStats?.totalVolume.toLocaleString()} m³</div>
                <p className="text-xs text-muted-foreground">
                  Monthly total water processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tanker Volume</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthStats?.tankerPercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  Of total water processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Direct Sewage</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthStats?.directSewagePercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  Of total water processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Irrigation Usage</CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M12 22c6-6 8-12 8-16a8 8 0 0 0-16 0c0 4 2 10 8 16z" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{monthStats?.irrigationPercentage}%</div>
                <p className="text-xs text-muted-foreground">
                  Water reused for irrigation
                </p>
              </CardContent>
            </Card>
          </div>

          <TabsContent value="monthly" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Monthly Volume Trends</CardTitle>
                  <CardDescription>
                    Compare different water volume metrics over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart
                      data={monthlyData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="totalWaterProcessed"
                        stroke="#8884d8"
                        name="Total Processed"
                      />
                      <Line
                        type="monotone"
                        dataKey="totalInfluent"
                        stroke="#82ca9d"
                        name="Total Influent"
                      />
                      <Line
                        type="monotone"
                        dataKey="tseToIrrigation"
                        stroke="#ffc658"
                        name="TSE to Irrigation"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Volume Distribution</CardTitle>
                  <CardDescription>
                    Monthly breakdown of water sources and usage
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: 'Tanker Volume',
                            value: monthStats?.tankerPercentage || 0
                          },
                          {
                            name: 'Direct Sewage',
                            value: monthStats?.directSewagePercentage || 0
                          },
                          {
                            name: 'Other',
                            value: 100 - ((monthStats?.tankerPercentage || 0) + (monthStats?.directSewagePercentage || 0))
                          }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({
                          cx,
                          cy,
                          midAngle,
                          innerRadius,
                          outerRadius,
                          percent,
                          index
                        }) => {
                          const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                          const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                          const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                          return (
                            <text
                              x={x}
                              y={y}
                              fill="white"
                              textAnchor={x > cx ? 'start' : 'end'}
                              dominantBaseline="central"
                            >
                              {`${(percent * 100).toFixed(0)}%`}
                            </text>
                          );
                        }}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {monthlyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="daily" className="space-y-4">
            <div className="flex items-center space-x-2">
              <Select
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Month" />
                </SelectTrigger>
                <SelectContent>
                  {monthlyData.map((data) => (
                    <SelectItem key={data.month} value={data.month}>
                      {data.month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button variant="outline" size="icon">
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Daily Processing Volumes</CardTitle>
                <CardDescription>
                  Daily breakdown of water processing metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={filteredDailyData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalWaterProcessed" fill="#8884d8" name="Total Processed" />
                    <Bar dataKey="directSewageMB" fill="#82ca9d" name="Direct Sewage" />
                    <Bar dataKey="expectedVolumeTankers" fill="#ffc658" name="Tanker Volume" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default STPDashboard;
