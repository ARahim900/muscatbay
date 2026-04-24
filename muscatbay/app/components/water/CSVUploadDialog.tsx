"use client";

import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { processCSVUpload, ImportResult } from "@/functions/api/csv-upload";
import {
    Upload,
    FileSpreadsheet,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Loader2,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CSVUploadDialogProps {
    month: string;
    year: number;
    onUploadComplete?: () => void;
}

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error';

export function CSVUploadDialog({ month, year, onUploadComplete }: CSVUploadDialogProps) {
    const [open, setOpen] = useState(false);
    const [uploadState, setUploadState] = useState<UploadState>('idle');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [result, setResult] = useState<ImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setUploadState('idle');
        setSelectedFile(null);
        setResult(null);
        // Reset file input so the same file can be re-uploaded
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleOpenChange = useCallback((newOpen: boolean) => {
        setOpen(newOpen);
        if (!newOpen) {
            resetState();
        }
    }, [resetState]);

    const validateFile = useCallback((file: File): boolean => {
        const validTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
        const isValidType = validTypes.includes(file.type) || file.name.endsWith('.csv');

        if (!isValidType) {
            setResult({
                success: false,
                imported: 0,
                skipped: 0,
                errors: ['Please upload a CSV file']
            });
            setUploadState('error');
            return false;
        }

        // 50MB limit
        if (file.size > 52428800) {
            setResult({
                success: false,
                imported: 0,
                skipped: 0,
                errors: ['File size exceeds 50MB limit']
            });
            setUploadState('error');
            return false;
        }

        return true;
    }, []);

    const handleFileSelect = useCallback(async (file: File) => {
        if (!validateFile(file)) return;

        setSelectedFile(file);
        setUploadState('uploading');
        setResult(null);

        try {
            const importResult = await processCSVUpload(file, month, year);
            setResult(importResult);
            setUploadState(importResult.success ? 'success' : 'error');

            if (importResult.success && onUploadComplete) {
                // Trigger refresh after short delay
                setTimeout(() => {
                    onUploadComplete();
                }, 1000);
            }
        } catch (err) {
            setResult({
                success: false,
                imported: 0,
                skipped: 0,
                errors: [err instanceof Error ? err.message : 'Upload failed']
            });
            setUploadState('error');
        }
    }, [month, year, onUploadComplete, validateFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (uploadState === 'idle' || uploadState === 'error') {
            setUploadState('dragging');
        }
    }, [uploadState]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (uploadState === 'dragging') {
            setUploadState('idle');
        }
    }, [uploadState]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileSelect(files[0]);
        }
    }, [handleFileSelect]);

    const handleClickUpload = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger
                render={
                    <Button variant="outline" size="sm" className="gap-2">
                        <Upload className="h-4 w-4" />
                        Upload CSV
                    </Button>
                }
            />
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        Import Water Consumption Data
                    </DialogTitle>
                    <DialogDescription>
                        Upload a CSV file to import daily water consumption readings for {month}.
                        Only meters configured in your system will be imported.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 space-y-4">
                    {/* Drop Zone */}
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={uploadState === 'idle' || uploadState === 'error' ? handleClickUpload : undefined}
                        className={cn(
                            "relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
                            uploadState === 'idle' && "border-slate-300 dark:border-slate-600 hover:border-primary hover:bg-primary/5",
                            uploadState === 'dragging' && "border-primary bg-primary/10",
                            uploadState === 'uploading' && "border-mb-warning bg-mb-warning-light cursor-wait",
                            uploadState === 'success' && "border-mb-success bg-mb-success-light cursor-default",
                            uploadState === 'error' && "border-mb-danger bg-mb-danger-light"
                        )}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            onChange={handleFileInputChange}
                            className="hidden"
                        />

                        {uploadState === 'idle' && (
                            <div className="space-y-2">
                                <Upload className="h-10 w-10 mx-auto text-slate-400" />
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Drag & drop your CSV file here
                                </p>
                                <p className="text-xs text-slate-500">
                                    or click to browse
                                </p>
                            </div>
                        )}

                        {uploadState === 'dragging' && (
                            <div className="space-y-2">
                                <Upload className="h-10 w-10 mx-auto text-primary motion-safe:animate-pulse" />
                                <p className="text-sm font-medium text-primary">
                                    Drop your file here
                                </p>
                            </div>
                        )}

                        {uploadState === 'uploading' && (
                            <div className="space-y-2">
                                <Loader2 className="h-10 w-10 mx-auto text-mb-warning animate-spin" />
                                <p className="text-sm font-medium text-mb-warning-text">
                                    Processing {selectedFile?.name}...
                                </p>
                                <p className="text-xs text-mb-warning-text/70">
                                    Parsing, filtering, and importing data
                                </p>
                            </div>
                        )}

                        {uploadState === 'success' && result && (
                            <div className="space-y-2">
                                <CheckCircle2 className="h-10 w-10 mx-auto text-mb-success" />
                                <p className="text-sm font-medium text-mb-success-text">
                                    Import Successful!
                                </p>
                            </div>
                        )}

                        {uploadState === 'error' && (
                            <div className="space-y-2">
                                <XCircle className="h-10 w-10 mx-auto text-destructive" />
                                <p className="text-sm font-medium text-mb-danger-text">
                                    Import Failed
                                </p>
                                <p className="text-xs text-slate-500">
                                    Click to try again
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Results Panel */}
                    {result && (
                        <div className={cn(
                            "rounded-lg p-4 space-y-3",
                            result.success
                                ? "bg-mb-success-light border border-mb-success/20"
                                : "bg-mb-danger-light border border-mb-danger/20"
                        )}>
                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-mb-success-text">
                                        {result.imported}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Rows Imported
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-2xl font-bold text-mb-warning-text">
                                        {result.skipped}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        Rows Skipped
                                    </p>
                                </div>
                            </div>

                            {/* Errors */}
                            {result.errors.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-mb-danger-text flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" />
                                        Issues:
                                    </p>
                                    <ul className="text-xs text-mb-danger-text space-y-0.5 max-h-20 overflow-y-auto">
                                        {result.errors.map((error, idx) => (
                                            <li key={idx} className="truncate">• {error}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Storage path */}
                            {result.storagePath && (
                                <p className="text-xs text-slate-500 truncate">
                                    📁 Saved to: {result.storagePath}
                                </p>
                            )}

                            {result.success && (
                                <p className="text-xs text-mb-success-text flex items-center gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Dashboard will refresh automatically
                                </p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-2">
                        {result && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={resetState}
                            >
                                Upload Another
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenChange(false)}
                        >
                            {result?.success ? 'Done' : 'Cancel'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
