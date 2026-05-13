
"use client";

import { useEffect, useState, useMemo } from "react";
import { getFireQuotations, FireQuotation, FireQuotationItem } from "@/lib/mock-data";
import { StatsGrid } from "@/components/shared/stats-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge, type BadgeColor } from "@/components/shared/data-table";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function FireQuotesPage() {
    const [data, setData] = useState<{ quotes: FireQuotation[], items: FireQuotationItem[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const result = await getFireQuotations();
                setData(result);
            } catch (e) {
                // console.error("Failed to load fire quotes", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const stats = useMemo(() => {
        if (!data) return [];

        const { quotes, items } = data;
        const grandTotal = quotes.reduce((sum, q) => sum + (q.total_omr || 0), 0);
        const criticalCost = items.filter(i => i.category === 'Critical Repairs').reduce((sum, i) => sum + i.cost_omr, 0);
        const approvedCount = quotes.filter(q => q.status === 'approved').length;
        const pendingCount = quotes.filter(q => q.status === 'pending_approval').length;

        return [
            {
                label: "GRAND TOTAL",
                value: `OMR ${grandTotal.toLocaleString('en-US', { maximumFractionDigits: 1 })}`,
                subtitle: "All Quotations",
                icon: FileText,
                color: "text-mb-success",
                bgColor: "bg-mb-success-light"
            },
            {
                label: "CRITICAL REPAIRS",
                value: `OMR ${criticalCost.toLocaleString('en-US', { maximumFractionDigits: 1 })}`,
                subtitle: "Urgent Maintenance",
                icon: AlertTriangle,
                color: "text-mb-danger",
                bgColor: "bg-mb-danger-light"
            },
            {
                label: "APPROVED QUOTES",
                value: approvedCount.toString(),
                subtitle: "Ready to proceed",
                icon: CheckCircle2,
                color: "text-mb-success",
                bgColor: "bg-mb-success-light"
            },
            {
                label: "PENDING APPROVAL",
                value: pendingCount.toString(),
                subtitle: "Awaiting Action",
                icon: FileText,
                color: "text-mb-warning",
                bgColor: "bg-mb-warning-light"
            }
        ];
    }, [data]);

    const getStatusColor = (status: string): BadgeColor => {
        switch (status) {
            case 'approved':         return 'green';
            case 'pending_approval': return 'amber';
            case 'rejected':         return 'red';
            default:                 return 'slate';
        }
    };

    const getPriorityColor = (priority: string): BadgeColor => {
        switch (priority.toLowerCase()) {
            case 'high':   return 'red';
            case 'medium': return 'amber';
            case 'low':    return 'slate';
            default:       return 'slate';
        }
    };

    const getCategoryColor = (category: string): BadgeColor => {
        switch (category.toLowerCase()) {
            case 'critical repairs': return 'red';
            case 'sprinklers':       return 'blue';
            case 'extinguishers':    return 'purple';
            case 'hose systems':     return 'blue';
            default:                 return 'slate';
        }
    };

    if (loading || !data) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-foreground"></div>
            </div>
        );
    }

    // Group items by quote
    const quotesWithItems = data.quotes.map(quote => ({
        ...quote,
        items: data.items.filter(item => item.quote_code === quote.quote_code)
    }));

    return (
        <div className="space-y-6 sm:space-y-7 md:space-y-8 w-full">
            <div className="flex items-center gap-4">
                <Link href="/firefighting">
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quotes & Repairs</h2>
                    <p className="text-muted-foreground">Track vendor quotations and maintenance costs.</p>
                </div>
            </div>

            <StatsGrid stats={stats} />

            <div className="space-y-6">
                {quotesWithItems.map(quote => (
                    <Card key={quote.id}>
                        <CardHeader className="flex flex-row items-center justify-between bg-muted dark:bg-muted/50 rounded-t-lg">
                            <div className="space-y-1">
                                <CardTitle className="text-lg flex items-center gap-3">
                                    {quote.quote_code}
                                    <StatusBadge label={quote.status.replace('_', ' ')} color={getStatusColor(quote.status)} />
                                </CardTitle>
                                <div className="text-sm text-muted-foreground">
                                    {quote.provider} • {format(new Date(quote.date), "MMMM d, yyyy")}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-mb-success-text">
                                    OMR {quote.total_omr.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                                </div>
                                <div className="text-xs text-muted-foreground">Incl. VAT: OMR {quote.vat_omr}</div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Location</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead>Priority</TableHead>
                                        <TableHead className="num">Cost (OMR)</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {quote.items.map(item => (
                                        <TableRow key={item.id}>
                                            <TableCell className="font-medium">{item.location}</TableCell>
                                            <TableCell>{item.description}</TableCell>
                                            <TableCell>
                                                <StatusBadge label={item.category} color={getCategoryColor(item.category)} />
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge label={item.priority} color={getPriorityColor(item.priority)} />
                                            </TableCell>
                                            <TableCell className="num">
                                                {item.cost_omr.toLocaleString('en-US', { maximumFractionDigits: 1 })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
