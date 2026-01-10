"use client";

import { useEffect, useState, useMemo } from "react";
import {
    getContractorTrackerData,
    isSupabaseConfigured,
    ContractorTracker
} from "@/lib/supabase";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { PageHeader } from "@/components/shared/page-header";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, Users, DollarSign, AlertCircle, Database, Download, Calendar, Building2, FileText, RefreshCw, Wifi, WifiOff } from "lucide-react";
import { exportToCSV, getDateForFilename } from "@/lib/export-utils";

export default function ContractorsPage() {
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [contractTypeFilter, setContractTypeFilter] = useState<string>("all");

    // Data state for new Contractor_Tracker table
    const [contractors, setContractors] = useState<ContractorTracker[]>([]);
    const [dataSource, setDataSource] = useState<'supabase' | 'none'>('none');

    useEffect(() => {
        async function loadData() {
            setLoading(true);

            // Check if Supabase is configured
            if (!isSupabaseConfigured()) {
                setDataSource('none');
                setLoading(false);
                return;
            }

            try {
                const data = await getContractorTrackerData();
                setContractors(data);
                setDataSource(data.length > 0 ? 'supabase' : 'none');
            } catch (e) {
                console.error("Failed to load contractors data", e);
                setDataSource('none');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const getStatusColor = (status: string | null) => {
        const s = status?.toLowerCase() || '';
        if (s.includes('active')) return 'bg-mb-success-light text-mb-success hover:bg-mb-success-light/80 dark:bg-mb-success-light/20 dark:text-mb-success-hover';
        if (s.includes('expired')) return 'bg-mb-danger-light text-mb-danger hover:bg-mb-danger-light/80 dark:bg-mb-danger-light/20 dark:text-mb-danger-hover';
        if (s.includes('retain')) return 'bg-mb-warning-light text-mb-warning hover:bg-mb-warning-light/80 dark:bg-mb-warning-light/20 dark:text-mb-warning';
        return 'bg-mb-primary-light/20 text-mb-primary dark:bg-mb-primary-light/10 dark:text-mb-primary-light';
    };

    const getContractTypeColor = (type: string | null) => {
        const t = type?.toLowerCase() || '';
        if (t.includes('contract')) return 'bg-mb-info-light text-mb-info dark:bg-mb-info-light/20 dark:text-mb-info';
        if (t.includes('po') || t.includes('purchase')) return 'bg-mb-success-light text-mb-success dark:bg-mb-success-light/20 dark:text-mb-success';
        if (t.includes('quotation')) return 'bg-mb-warning-light text-mb-warning dark:bg-mb-warning-light/20 dark:text-mb-warning';
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    // Get unique statuses and contract types for filters
    const uniqueStatuses = [...new Set(contractors.map(c => c.Status).filter(Boolean))] as string[];
    const uniqueContractTypes = [...new Set(contractors.map(c => c["Contract Type"]).filter(Boolean))] as string[];

    // Apply filters
    const filteredContractors = contractors.filter(c => {
        const matchesSearch =
            c.Contractor?.toLowerCase().includes(search.toLowerCase()) ||
            c["Service Provided"]?.toLowerCase().includes(search.toLowerCase()) ||
            c.Note?.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'all' || c.Status === statusFilter;
        const matchesType = contractTypeFilter === 'all' || c["Contract Type"] === contractTypeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    // Calculate summary stats
    const totalContractors = contractors.length;
    const activeContractors = contractors.filter(c => c.Status?.toLowerCase().includes('active')).length;
    const expiredContractors = contractors.filter(c => c.Status?.toLowerCase().includes('expired')).length;
    const totalAnnualValue = contractors.reduce((sum, c) => sum + (c["Annual Value (OMR)"] || 0), 0);

    const stats = [
        {
            label: "TOTAL CONTRACTORS",
            value: totalContractors.toString(),
            subtitle: "All registered providers",
            icon: Building2,
            variant: "primary" as const
        },
        {
            label: "ACTIVE CONTRACTS",
            value: activeContractors.toString(),
            subtitle: "Currently valid",
            icon: Users,
            variant: "success" as const
        },
        {
            label: "EXPIRED",
            value: expiredContractors.toString(),
            subtitle: "Action required",
            icon: AlertCircle,
            variant: "danger" as const
        },
        {
            label: "ANNUAL VALUE",
            value: `${totalAnnualValue.toLocaleString()} OMR`,
            subtitle: "Total commitments",
            icon: DollarSign,
            variant: "success" as const // Using success for money usually (or info)
        }
    ];

    return (
        <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 pt-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Contractor Tracker"
                    description="Monitor AMC service providers, contracts, and renewal plans"
                    action={{ label: "Add Contractor", icon: Plus }}
                />
                <div className="flex flex-col items-end gap-1">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${dataSource === 'supabase' ? 'bg-mb-success-light text-mb-success dark:bg-mb-success-light/20 dark:text-mb-success-hover' : 'bg-mb-warning-light text-mb-warning dark:bg-mb-warning-light/20 dark:text-mb-warning'}`}>
                        {dataSource === 'supabase' ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                        {dataSource === 'supabase' ? 'Connected to Supabase' : 'No Data Connection'}
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <StatsGrid stats={stats} />

            {/* Filters and Search - Wrapped in Glass Card */}
            <Card className="glass-card">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative flex-1 max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search contractors..."
                                className="pl-8 bg-white/50 dark:bg-slate-800/50"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        {/* Status Filter */}
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="h-10 rounded-md border border-input bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="all">All Statuses</option>
                            {uniqueStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>

                        {/* Contract Type Filter */}
                        <select
                            value={contractTypeFilter}
                            onChange={(e) => setContractTypeFilter(e.target.value)}
                            className="h-10 rounded-md border border-input bg-white/50 dark:bg-slate-800/50 px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="all">All Types</option>
                            {uniqueContractTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>

                        {/* Export Button */}
                        {filteredContractors.length > 0 && (
                            <Button
                                onClick={() => exportToCSV(
                                    filteredContractors.map(c => ({
                                        'Contractor': c.Contractor || '',
                                        'Service Provided': c["Service Provided"] || '',
                                        'Status': c.Status || '',
                                        'Contract Type': c["Contract Type"] || '',
                                        'Start Date': c["Start Date"] || '',
                                        'End Date': c["End Date"] || '',
                                        'Monthly (OMR)': c["Contract (OMR)/Month"] || '',
                                        'Yearly (OMR)': c["Contract Total (OMR)/Year"] || '',
                                        'Annual Value': c["Annual Value (OMR)"] || '',
                                        'Renewal Plan': c["Renewal Plan"] || '',
                                        'Note': c.Note || ''
                                    })),
                                    `contractors-${getDateForFilename()}`
                                )}
                                variant="outline"
                                className="ml-auto"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Export CSV
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Contractors Table */}
            <Card className="glass-card">
                <CardHeader className="glass-card-header">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <FileText className="h-5 w-5" />
                        Contractor Registry
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({filteredContractors.length} of {totalContractors})
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent">
                                <TableHead className="min-w-[200px]">Contractor</TableHead>
                                <TableHead className="min-w-[180px]">Service Provided</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Contract Type</TableHead>
                                <TableHead>Start Date</TableHead>
                                <TableHead>End Date</TableHead>
                                <TableHead className="text-right">Monthly (OMR)</TableHead>
                                <TableHead className="text-right">Annual Value (OMR)</TableHead>
                                <TableHead className="min-w-[150px]">Renewal Plan</TableHead>
                                <TableHead className="min-w-[200px]">Note</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredContractors.map((contractor, index) => (
                                <TableRow key={`${contractor.Contractor}-${index}`} className="hover:bg-muted/50">
                                    <TableCell className="font-medium">
                                        {contractor.Contractor || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {contractor["Service Provided"] || '-'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className={`font-normal ${getStatusColor(contractor.Status)}`}>
                                            {contractor.Status || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={`font-normal ${getContractTypeColor(contractor["Contract Type"])}`}>
                                            {contractor["Contract Type"] || 'N/A'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            {contractor["Start Date"] || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-3 w-3 text-muted-foreground" />
                                            {contractor["End Date"] || '-'}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium">
                                        {contractor["Contract (OMR)/Month"] || '-'}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-mb-primary">
                                        {contractor["Annual Value (OMR)"]?.toLocaleString() || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {contractor["Renewal Plan"] ? (
                                            <div className="flex items-center gap-1">
                                                <RefreshCw className="h-3 w-3 text-mb-info" />
                                                <span className="text-sm">{contractor["Renewal Plan"]}</span>
                                            </div>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={contractor.Note || ''}>
                                        {contractor.Note || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredContractors.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={10} className="h-24 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <AlertCircle className="h-8 w-8" />
                                            <p>No contractors found matching your criteria.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
