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
        <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] z-20 flex flex-col flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-background/95 px-2 py-3 shadow-[0_-8px_20px_-18px_rgb(15_23_42_/_0.55)] backdrop-blur sm:static sm:flex-row sm:gap-4 sm:border-0 sm:bg-transparent sm:py-3.5 sm:shadow-none sm:backdrop-blur-none">
            {/* Left side: Page Size + Showing info */}
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-start">
                <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">Show</span>
                    <select
                        value={pageSize}
                        onChange={(e) => {
                            const val = e.target.value;
                            onPageSizeChange(val === 'All' ? 'All' : parseInt(val));
                        }}
                        aria-label="Rows per page"
                        className="min-h-11 rounded-full border border-border bg-card px-3 py-2 text-xs text-foreground transition-colors focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30 sm:text-sm"
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                <div className="text-xs sm:text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{startIndex + 1}</span>–<span className="font-medium text-foreground">{endIndex}</span> of <span className="font-medium text-foreground">{totalItems}</span>
                </div>
            </div>

            {/* Right side: Page Navigation */}
            {pageSize !== 'All' && totalPages > 1 && (
                <>
                <div className="flex w-full items-center justify-between gap-2 sm:hidden" aria-label="Pagination">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                        Previous
                    </button>
                    <span className="text-xs font-semibold tabular-nums text-foreground" aria-live="polite">Page {currentPage} of {totalPages}</span>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-30"
                        aria-label="Next page"
                    >
                        Next
                        <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
                <div className="hidden items-center gap-1 sm:flex sm:gap-1.5">
                    <button
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1}
                        className="w-11 h-11 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="First page"
                        aria-label="First page"
                    >
                        <ChevronsLeft className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="w-11 h-11 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Previous page"
                        aria-label="Previous page"
                    >
                        <ChevronLeft className="w-4 h-4 text-muted-foreground" />
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
                                <span key={`ellipsis-${idx}`} className="px-1.5 text-muted-foreground/70 text-sm">...</span>
                            ) : (
                                <button
                                    key={page}
                                    onClick={() => onPageChange(page as number)}
                                    aria-current={currentPage === page ? "page" : undefined}
                                    className={cn(
                                        "min-w-11 h-11 rounded-full text-sm font-medium transition-colors duration-200",
                                        currentPage === page
                                            ? "bg-primary text-primary-foreground shadow-sm"
                                            : "border border-border hover:bg-muted text-muted-foreground"
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
                        className="w-11 h-11 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Next page"
                        aria-label="Next page"
                    >
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages}
                        className="w-11 h-11 flex items-center justify-center rounded-full border border-border hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Last page"
                        aria-label="Last page"
                    >
                        <ChevronsRight className="w-4 h-4 text-muted-foreground" />
                    </button>
                </div>
                </>
            )}
        </div>
    );
}
