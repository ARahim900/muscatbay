import React, { useState, useEffect, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  LineController,
  BarController,
  PieController,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Line } from 'react-chartjs-2';
import faker from 'faker';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { FilePie, Landmark } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
  ResizableSeparator,
} from "@/components/ui/resizable";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuSeparator, ContextMenuTrigger } from "@/components/ui/context-menu";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useFormField, Form, FormField, FormItem, FormLabel, FormMessage, FormPopover, } from "@/components/ui/form";
import { FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DateRange } from "react-day-picker";
import { addMonths, isBefore, isSameDay, startOfMonth } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { useOrigin } from "@/hooks/use-origin";
import { generatePalette } from "@/lib/utils";
import { DataTable } from "@/components/ui/data-table";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Check } from "lucide-react";
import { Copy, Edit, Trash } from "lucide-react";
import { CopyToClipboard } from 'react-copy-to-clipboard';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  LineController, 
  BarController,
  PieController
);

// Define types for the data
interface ZoneContribution {
  zone: string;
  contribution: number;
  unitCount: number;
  color: string;
}

interface PropertyData {
  unitNo: string;
  sector: string;
  unitType: string;
  bua: number;
  contribution: number;
  zone: string;
}

// Mock data for the reserve fund summary
const mockReserveFundData = {
  totalUnits: 481,
  totalBuildingArea: 156810,
  totalAnnualContribution: 481310,
  averageContribution: 1000.64,
  contributions: [
    { zone: 'Zone 3 (Zaha)', contribution: 172000, unitCount: 210, color: '#4CAF50' },
    { zone: 'Zone 5 (Nameer)', contribution: 145000, unitCount: 150, color: '#2196F3' },
    { zone: 'Zone 8 (Wajd)', contribution: 95000, unitCount: 85, color: '#FF9800' },
    { zone: 'Staff Accommodation', contribution: 45000, unitCount: 25, color: '#9C27B0' },
    { zone: 'Commercial', contribution: 24310, unitCount: 11, color: '#F44336' },
  ]
};

// Mock property data
const mockPropertyData: PropertyData[] = [
  { unitNo: 'Z3-A-101', sector: 'Zaha', unitType: 'Villa 4BR', bua: 285, contribution: 1205.75, zone: 'Zone 3' },
  { unitNo: 'Z3-A-102', sector: 'Zaha', unitType: 'Villa 5BR', bua: 320, contribution: 1356.80, zone: 'Zone 3' },
  { unitNo: 'Z3-B-101', sector: 'Zaha', unitType: 'Apartment 2BR', bua: 125, contribution: 675.50, zone: 'Zone 3' },
  { unitNo: 'Z3-B-102', sector: 'Zaha', unitType: 'Apartment 3BR', bua: 145, contribution: 784.30, zone: 'Zone 3' },
  { unitNo: 'Z5-A-101', sector: 'Nameer', unitType: 'Villa 4BR', bua: 295, contribution: 1325.50, zone: 'Zone 5' },
  { unitNo: 'Z5-A-102', sector: 'Nameer', unitType: 'Villa 5BR', bua: 330, contribution: 1485.00, zone: 'Zone 5' },
  { unitNo: 'Z8-A-101', sector: 'Wajd', unitType: 'Villa 4BR', bua: 305, contribution: 1280.00, zone: 'Zone 8' },
  { unitNo: 'Z8-A-102', sector: 'Wajd', unitType: 'Villa 5BR', bua: 340, contribution: 1428.00, zone: 'Zone 8' },
  { unitNo: 'SA-101', sector: 'Staff', unitType: 'Studio', bua: 45, contribution: 315.00, zone: 'Staff Accommodation' },
  { unitNo: 'COM-101', sector: 'Commercial', unitType: 'Retail', bua: 120, contribution: 816.00, zone: 'Commercial' },
];

const ReserveFundDashboard = () => {
  const { toast } = useToast();
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedZone, setSelectedZone] = useState<string>('All Zones');
  const [propertiesData, setPropertiesData] = useState<PropertyData[]>(mockPropertyData);
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  // Filter properties by zone
  const filteredProperties = useMemo(() => {
    if (selectedZone === 'All Zones') {
      return propertiesData;
    }
    return propertiesData.filter(property => property.zone === selectedZone);
  }, [propertiesData, selectedZone]);
  
  // Calculate summary data based on filters
  const summaryData = useMemo(() => {
    const totalUnits = filteredProperties.length;
    const totalBuildingArea = filteredProperties.reduce((sum, property) => sum + property.bua, 0);
    const totalContribution = filteredProperties.reduce((sum, property) => sum + property.contribution, 0);
    const averageContribution = totalUnits > 0 ? totalContribution / totalUnits : 0;
    
    return {
      totalUnits,
      totalBuildingArea,
      totalAnnualContribution: totalContribution,
      averageContribution
    };
  }, [filteredProperties]);
  
  // Prepare data for pie chart
  const contributionByZoneData = useMemo(() => {
    const zoneMap = new Map<string, ZoneContribution>();
    
    // Initialize with zones from mock data
    mockReserveFundData.contributions.forEach(item => {
      zoneMap.set(item.zone, { ...item, contribution: 0, unitCount: 0 });
    });
    
    // Update with actual filtered data
    filteredProperties.forEach(property => {
      const zoneName = property.zone === 'Zone 3' ? 'Zone 3 (Zaha)' : 
                       property.zone === 'Zone 5' ? 'Zone 5 (Nameer)' :
                       property.zone === 'Zone 8' ? 'Zone 8 (Wajd)' : 
                       property.zone;
      
      if (zoneMap.has(zoneName)) {
        const current = zoneMap.get(zoneName)!;
        zoneMap.set(zoneName, {
          ...current,
          contribution: current.contribution + property.contribution,
          unitCount: current.unitCount + 1
        });
      }
    });
    
    return Array.from(zoneMap.values());
  }, [filteredProperties]);
  
  // Prepare chart data
  const pieChartData = {
    labels: contributionByZoneData.map(item => item.zone),
    datasets: [
      {
        data: contributionByZoneData.map(item => item.contribution),
        backgroundColor: contributionByZoneData.map(item => item.color),
        borderColor: contributionByZoneData.map(item => item.color),
        borderWidth: 1,
      },
    ],
  };
  
  // Prepare data for bar chart - monthly contribution trends
  const monthlyContributionData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Contributions',
        data: contributionByZoneData.length > 0 
          ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(() => 
              (summaryData.totalAnnualContribution / 12).toFixed(2))
          : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: '#2196F3',
      }
    ],
  };
  
  // Prepare data for line chart - annual growth projections
  const annualGrowthData = {
    labels: [2023, 2024, 2025, 2026, 2027, 2028],
    datasets: [
      {
        label: 'Annual Contributions',
        data: [
          summaryData.totalAnnualContribution * 0.9,
          summaryData.totalAnnualContribution * 0.95,
          summaryData.totalAnnualContribution,
          summaryData.totalAnnualContribution * 1.05,
          summaryData.totalAnnualContribution * 1.10,
          summaryData.totalAnnualContribution * 1.15,
        ],
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.3,
        fill: true,
      }
    ],
  };
  
  // Chart options
  const pieChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          boxWidth: 15,
          padding: 15,
        },
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${value.toLocaleString()} OMR (${percentage}%)`;
          }
        }
      }
    },
  };
  
  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      }
    }
  };
  
  const lineChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
        }
      }
    }
  };
  
  // Handle year change
  const handleYearChange = (newYear: number) => {
    setSelectedYear(newYear);
    toast({
      title: "Year updated",
      description: `Reserve fund data updated for ${newYear}`,
    });
  };
  
  // Handle zone filter change
  const handleZoneChange = (zone: string) => {
    setSelectedZone(zone);
  };
  
  // Handle export click
  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your data is being exported to Excel",
    });
  };
  
  return (
    <StandardPageLayout
      title="Reserve Fund Dashboard"
      description="Track and analyze reserve fund contributions and forecasts"
      icon={<Landmark className="h-6 w-6 text-primary" />}
    >
      <div className="grid grid-cols-1 gap-6">
        {/* Filters Section */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="year">Year</Label>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => handleYearChange(parseInt(value))}
                >
                  <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                    <SelectItem value="2027">2027</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="date">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={selectedZone}
                  onValueChange={handleZoneChange}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Zone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All Zones">All Zones</SelectItem>
                    <SelectItem value="Zone 3">Zone 3 (Zaha)</SelectItem>
                    <SelectItem value="Zone 5">Zone 5 (Nameer)</SelectItem>
                    <SelectItem value="Zone 8">Zone 8 (Wajd)</SelectItem>
                    <SelectItem value="Staff Accommodation">Staff Accommodation</SelectItem>
                    <SelectItem value="Commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="ml-auto">
                <Button onClick={handleExport}>
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Units</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">{summaryData.totalUnits}</div>
              <p className="text-xs text-muted-foreground mt-1">Properties in selected zone</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Building Area</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">{summaryData.totalBuildingArea.toLocaleString()} SqM</div>
              <p className="text-xs text-muted-foreground mt-1">Built-up area included</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Annual Contribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">{summaryData.totalAnnualContribution.toLocaleString()} OMR</div>
              <p className="text-xs text-muted-foreground mt-1">For current year</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Contribution</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1">
              <div className="text-2xl font-bold">{summaryData.averageContribution.toLocaleString()} OMR</div>
              <p className="text-xs text-muted-foreground mt-1">Per unit annually</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Zone Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Zone Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex justify-center">
                <Pie data={pieChartData} options={pieChartOptions} />
              </div>
            </CardContent>
          </Card>
          
          {/* Monthly Contribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Contributions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Bar data={monthlyContributionData} options={barChartOptions} />
              </div>
            </CardContent>
          </Card>
          
          {/* Annual Growth Chart */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Annual Growth Projection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <Line data={annualGrowthData} options={lineChartOptions} />
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Properties Table */}
        <Card>
          <CardHeader>
            <CardTitle>Property Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Unit No</TableHead>
                    <TableHead>Sector</TableHead>
                    <TableHead>Unit Type</TableHead>
                    <TableHead>BUA (SqM)</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead className="text-right">Annual Contribution (OMR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProperties.map((property) => (
                    <TableRow key={property.unitNo}>
                      <TableCell className="font-medium">{property.unitNo}</TableCell>
                      <TableCell>{property.sector}</TableCell>
                      <TableCell>{property.unitType}</TableCell>
                      <TableCell>{property.bua}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{property.zone}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{property.contribution.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={5} className="text-right font-medium">Total</TableCell>
                    <TableCell className="text-right font-medium">
                      {summaryData.totalAnnualContribution.toFixed(2)} OMR
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default ReserveFundDashboard;
