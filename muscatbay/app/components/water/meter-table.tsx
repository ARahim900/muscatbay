"use client";

import React, { useState, useMemo, useCallback, type KeyboardEvent } from 'react';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown } from 'lucide-react';
import { WaterMeter, getConsumption } from '@/lib/water-data';

interface MeterTableProps {
    meters: WaterMeter[];
    months: string[];
    pageSize?: number;
}

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
    'L1': { bg: 'bg-mb-success', text: 'text-white' },
    'L2': { bg: 'bg-mb-primary', text: 'text-white' },
    'L3': { bg: 'bg-mb-secondary-active', text: 'text-white' },
    'L4': { bg: 'bg-mb-danger', text: 'text-white' },
    'DC': { bg: 'bg-mb-warning', text: 'text-white' },
    'N/A': { bg: 'bg-slate-400 dark:bg-slate-600', text: 'text-white' },
};

export function MeterTable({ meters, months, pageSize = 15 }: MeterTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Filter and sort meters
    const filteredMeters = useMemo(() => {
        let result = [...meters];

        // Search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(m =>
                m.label.toLowerCase().includes(term) ||
                m.accountNumber.toLowerCase().includes(term) ||
                m.zone.toLowerCase().includes(term) ||
                m.type.toLowerCase().includes(term)
            );
        }

        // Sort
        if (sortField) {
            result.sort((a, b) => {
                let aVal: string | number = '';
                let bVal: string | number = '';

                if (sortField === 'label') { aVal = a.label; bVal = b.label; }
                else if (sortField === 'account') { aVal = a.accountNumber; bVal = b.accountNumber; }
                else if (sortField === 'level') { aVal = a.level; bVal = b.level; }
                else if (sortField === 'zone') { aVal = a.zone; bVal = b.zone; }
                else if (sortField === 'parentMeter') { aVal = a.parentMeter || ''; bVal = b.parentMeter || ''; }
                else if (sortField === 'type') { aVal = a.type; bVal = b.type; }
                else if (months.includes(sortField)) {
                    aVal = getConsumption(a, sortField);
                    bVal = getConsumption(b, sortField);
                }

                if (typeof aVal === 'string') {
                    return sortDirection === 'asc'
                        ? aVal.localeCompare(bVal as string)
                        : (bVal as string).localeCompare(aVal);
                }
                return sortDirection === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
            });
        }

        return result;
    }, [meters, searchTerm, sortField, sortDirection, months]);

    const totalPages = Math.ceil(filteredMeters.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const paginatedMeters = filteredMeters.slice(startIndex, startIndex + pageSize);

    const handleSort = useCallback((field: string) => {
        setSortField(prev => {
            if (prev === field) {
                setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
            } else {
                setSortDirection('asc');
            }
            return prev === field ? prev : field;
        });
    }, []);

    const displayMonths = months; // Show all available months

    const handleSortKeyDown = (e: KeyboardEvent<HTMLTableCellElement>, field: string) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSort(field);
        }
    };

    const sortHeaderProps = (field: string) => ({
        tabIndex: 0 as const,
        'aria-sort': (sortField === field
            ? (sortDirection === 'asc' ? 'ascending' : 'descending')
            : undefined) as 'ascending' | 'descending' | undefined,
        onClick: () => handleSort(field),
        onKeyDown: (e: KeyboardEvent<HTMLTableCellElement>) => handleSortKeyDown(e, field),
    });

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search meters..."
                        aria-label="Search meters"
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="pl-10 pr-4 py-2 w-full rounded-full border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40 shadow-sm transition-shadow"
                    />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-300">
                    Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredMeters.length)} of {filteredMeters.length} entries
                </span>
            </div>

            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
                {paginatedMeters.map((meter) => {
                    const levelColors = LEVEL_COLORS[meter.level] || LEVEL_COLORS['N/A'];
                    return (
                        <div key={meter.accountNumber} className="rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 p-4 shadow-sm space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{meter.label}</p>
                                    <p className="text-xs text-slate-400 font-mono">{meter.accountNumber}</p>
                                </div>
                                <span className={`shrink-0 px-2.5 py-0.5 rounded-md text-xs font-bold ${levelColors.bg} ${levelColors.text}`}>
                                    {meter.level}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-300">
                                <span>{meter.zone}</span>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <span>{meter.type}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                                {displayMonths.map(m => {
                                    const val = getConsumption(meter, m);
                                    return (
                                        <div key={m} className="text-xs space-y-0.5">
                                            <span className="text-slate-400">{m}</span>
                                            <p className="font-mono font-medium text-slate-700 dark:text-slate-300">
                                                {val > 0 ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '-'}
                                            </p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06),0_4px_16px_-4px_rgba(0,0,0,0.1)] dark:shadow-[0_1px_3px_rgba(0,0,0,0.2),0_4px_16px_-4px_rgba(0,0,0,0.3)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/80">
                            <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" {...sortHeaderProps('label')}>
                                <div className="flex items-center gap-1.5">Meter Label <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" {...sortHeaderProps('account')}>
                                <div className="flex items-center gap-1.5">Account # <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="text-center py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" {...sortHeaderProps('level')}>
                                <div className="flex items-center justify-center gap-1.5">Level <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" {...sortHeaderProps('zone')}>
                                <div className="flex items-center gap-1.5">Zone <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" {...sortHeaderProps('parentMeter')}>
                                <div className="flex items-center gap-1.5">Parent Meter <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            <th className="text-left py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" {...sortHeaderProps('type')}>
                                <div className="flex items-center gap-1.5">Type <ArrowUpDown className="w-3 h-3" /></div>
                            </th>
                            {displayMonths.map(m => (
                                <th key={m} className="text-right py-4 px-5 font-semibold uppercase tracking-wider text-xs text-slate-500 dark:text-slate-400 border-b-2 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/60 transition-colors" {...sortHeaderProps(m)}>
                                    <div className="flex items-center justify-end gap-1.5">{m} <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedMeters.map((meter) => {
                            const levelColors = LEVEL_COLORS[meter.level] || LEVEL_COLORS['N/A'];
                            return (
                                <tr key={meter.accountNumber} className="border-b border-slate-100/80 dark:border-slate-800/80 hover:bg-[#00d2b3]/5 dark:hover:bg-slate-700/40 transition-colors even:bg-slate-50/40 dark:even:bg-slate-800/20">
                                    <td className="py-4 px-5 font-medium text-slate-800 dark:text-slate-200">{meter.label}</td>
                                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300 font-mono text-sm">{meter.accountNumber}</td>
                                    <td className="py-4 px-5 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${levelColors.bg} ${levelColors.text}`}>
                                            {meter.level}
                                        </span>
                                    </td>
                                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300 text-sm">{meter.zone}</td>
                                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300 text-sm max-w-[200px] truncate">{meter.parentMeter}</td>
                                    <td className="py-4 px-5 text-slate-600 dark:text-slate-300 text-sm">{meter.type}</td>
                                    {displayMonths.map(m => {
                                        const val = getConsumption(meter, m);
                                        return (
                                            <td key={m} className="py-4 px-5 text-right font-medium text-slate-700 dark:text-slate-300">
                                                {val > 0 ? val.toLocaleString('en-US', { maximumFractionDigits: 1 }) : '-'}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <div className="text-sm text-slate-500 dark:text-slate-300">
                    Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        aria-label="Previous page"
                        className="w-11 h-11 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let page = i + 1;
                        if (totalPages > 5) {
                            if (currentPage <= 3) page = i + 1;
                            else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                            else page = currentPage - 2 + i;
                        }
                        return (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none ${currentPage === page
                                    ? 'bg-primary text-white'
                                    : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                                    }`}
                            >
                                {page}
                            </button>
                        );
                    })}
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        aria-label="Next page"
                        className="w-11 h-11 flex items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:outline-none"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
}
