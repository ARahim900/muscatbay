"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PageSizeOption = number | 'All';

const DEFAULT_PAGE_SIZE_OPTIONS: PageSizeOption[] = [25, 50, 100, 'All'];

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: PageSizeOption;
    pageSizeOptions?: PageSizeOption[];
    startIndex: number;
    endIndex: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: PageSizeOption) => void;
}

export function TablePagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
    startIndex,
    endIndex,
    onPageChange,
    onPageSizeChange,
}: TablePaginationProps) {
    if (totalItems === 0) return null;

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
            {/* Page Size Selector */}
            <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">Show</span>
                <select
                    value={pageSize}
                    onChange={(e) => {
                        const val = e.target.value;
                        onPageSizeChange(val === 'All' ? 'All' : parseInt(val));
                    }}
                    className="px-2 py-1 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                    {pageSizeOptions.map(size => (
                        <option key={size} value={size}>{size}</option>
                    ))}
                </select>
                <span className="text-sm text-slate-500 dark:text-slate-400">entries</span>
            </div>

            {/* Page Info */}
            <div className="text-sm text-slate-500 dark:text-slate-400">
                Showing {startIndex + 1} to {endIndex} of {totalItems}
            </div>

            {/* Page Navigation */}
            {pageSize !== 'All' && totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    {(() => {
                        const pages: (number | string)[] = [];
                        const maxVisible = 5;

                        if (totalPages <= maxVisible) {
                            for (let i = 1; i <= totalPages; i++) pages.push(i);
                        } else {
                            if (currentPage <= 3) {
                                pages.push(1, 2, 3, 4, '...', totalPages);
                            } else if (currentPage >= totalPages - 2) {
                                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
                            } else {
                                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
                            }
                        }

                        return pages.map((page, idx) => (
                            page === '...' ? (
                                <span key={`ellipsis-${idx}`} className="px-2 text-slate-400">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page as number)}
                                    className={cn(
                                        "w-8 h-8 rounded-lg text-sm font-medium transition-colors",
                                        currentPage === page
                                            ? "bg-primary text-white"
                                            : "border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                                    )}
                                >
                                    {page}
                                </button>
                            )
                        ));
                    })()}

                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
