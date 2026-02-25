"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, User, Mail, Phone, FileText, Briefcase, CheckCircle2, ArrowLeft } from "lucide-react";
import { validateEmail, validateFullName } from "@/lib/validation";
import { getSupabaseClient } from "@/lib/supabase";

const SERVICE_CATEGORIES = [
    "Electrical & Power Systems",
    "Plumbing & Water Systems",
    "HVAC & Air Conditioning",
    "Fire Safety & Protection",
    "Security Systems",
    "Landscaping & Grounds",
    "Cleaning & Sanitation",
    "Pest Control",
    "Elevator & Lift Maintenance",
    "Building Maintenance",
    "IT & Network Services",
    "Waste Management",
    "Swimming Pool Maintenance",
    "Other",
];

interface FormData {
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
    serviceCategory: string;
    registrationNumber: string;
    description: string;
}

export default function ProfessionalApplicationPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<FormData>({
        companyName: "",
        contactName: "",
        email: "",
        phone: "",
        serviceCategory: "",
        registrationNumber: "",
        description: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormData, string>>>({});
    const [success, setSuccess] = useState(false);

    const handleChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: undefined }));
        setError(null);
    };

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof FormData, string>> = {};

        if (!formData.companyName.trim()) {
            errors.companyName = "Company name is required";
        }

        const nameValidation = validateFullName(formData.contactName);
        if (!formData.contactName.trim()) {
            errors.contactName = "Contact name is required";
        } else if (!nameValidation.isValid) {
            errors.contactName = nameValidation.error;
        }

        const emailValidation = validateEmail(formData.email);
        if (!emailValidation.isValid) {
            errors.email = emailValidation.error;
        }

        if (!formData.phone.trim()) {
            errors.phone = "Phone number is required";
        } else if (!/^[\d\s+()-]{8,20}$/.test(formData.phone.trim())) {
            errors.phone = "Please enter a valid phone number";
        }

        if (!formData.serviceCategory) {
            errors.serviceCategory = "Please select a service category";
        }

        if (!formData.description.trim()) {
            errors.description = "Please provide a brief description of your services";
        } else if (formData.description.trim().length < 20) {
            errors.description = "Description must be at least 20 characters";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const supabase = getSupabaseClient();
            if (!supabase) {
                throw new Error("System configuration error. Please try again later.");
            }

            // Submit the professional application
            const { error: submitError } = await supabase
                .from('professional_applications')
                .insert({
                    company_name: formData.companyName.trim(),
                    contact_name: formData.contactName.trim(),
                    email: formData.email.trim().toLowerCase(),
                    phone: formData.phone.trim(),
                    service_category: formData.serviceCategory,
                    registration_number: formData.registrationNumber.trim() || null,
                    description: formData.description.trim(),
                    status: 'pending',
                    submitted_at: new Date().toISOString(),
                });

            if (submitError) {
                // Handle duplicate application
                if (submitError.code === '23505') {
                    throw new Error("An application with this email already exists. Please contact support if you need assistance.");
                }
                throw submitError;
            }

            setSuccess(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Failed to submit application. Please try again.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4">
                <Card className="w-full max-w-md glass-card">
                    <CardContent className="pt-8 pb-8 text-center">
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Application Submitted</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">
                            Thank you for your application! Our team will review your information and contact you at <strong>{formData.email}</strong> within 2-3 business days.
                        </p>
                        <div className="space-y-3">
                            <Button
                                onClick={() => router.push("/login")}
                                className="w-full bg-[var(--mb-primary)] hover:bg-[var(--mb-primary-hover)] text-white"
                            >
                                Go to Login
                            </Button>
                            <Link href="/" className="block">
                                <Button variant="outline" className="w-full">
                                    Return to Home
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 p-4 py-8">
            <div className="w-full max-w-lg">
                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-xl bg-[var(--mb-primary)] flex items-center justify-center shadow-lg overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="Muscat Bay Logo"
                                fill
                                className="object-contain p-1"
                                priority
                            />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Muscat Bay</h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Professional Services</p>
                        </div>
                    </div>
                </div>

                <Card className="glass-card">
                    <CardHeader className="space-y-1 pb-4">
                        <CardTitle className="text-2xl font-bold text-center">Professional Application</CardTitle>
                        <CardDescription className="text-center">
                            Apply for contractor or service provider access
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-4">
                            {error && (
                                <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">
                                    {error}
                                </div>
                            )}

                            {/* Company Name */}
                            <div className="space-y-2">
                                <Label htmlFor="companyName">Company / Business Name *</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="companyName"
                                        type="text"
                                        placeholder="Your company name"
                                        value={formData.companyName}
                                        onChange={(e) => handleChange('companyName', e.target.value)}
                                        className={`pl-10 ${fieldErrors.companyName ? 'border-red-500' : ''}`}
                                        maxLength={100}
                                    />
                                </div>
                                {fieldErrors.companyName && (
                                    <p className="text-xs text-red-500">{fieldErrors.companyName}</p>
                                )}
                            </div>

                            {/* Contact Name */}
                            <div className="space-y-2">
                                <Label htmlFor="contactName">Contact Person *</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="contactName"
                                        type="text"
                                        placeholder="Primary contact name"
                                        value={formData.contactName}
                                        onChange={(e) => handleChange('contactName', e.target.value)}
                                        className={`pl-10 ${fieldErrors.contactName ? 'border-red-500' : ''}`}
                                        maxLength={100}
                                    />
                                </div>
                                {fieldErrors.contactName && (
                                    <p className="text-xs text-red-500">{fieldErrors.contactName}</p>
                                )}
                            </div>

                            {/* Email and Phone Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email *</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="company@email.com"
                                            value={formData.email}
                                            onChange={(e) => handleChange('email', e.target.value)}
                                            className={`pl-10 ${fieldErrors.email ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {fieldErrors.email && (
                                        <p className="text-xs text-red-500">{fieldErrors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone *</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="+968 XXXX XXXX"
                                            value={formData.phone}
                                            onChange={(e) => handleChange('phone', e.target.value)}
                                            className={`pl-10 ${fieldErrors.phone ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {fieldErrors.phone && (
                                        <p className="text-xs text-red-500">{fieldErrors.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Service Category */}
                            <div className="space-y-2">
                                <Label htmlFor="serviceCategory">Service Category *</Label>
                                <Select
                                    value={formData.serviceCategory}
                                    onValueChange={(value) => value && handleChange('serviceCategory', value)}
                                >
                                    <SelectTrigger className={fieldErrors.serviceCategory ? 'border-red-500' : ''}>
                                        <Briefcase className="h-4 w-4 text-slate-400 mr-2" />
                                        <SelectValue placeholder="Select your service category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SERVICE_CATEGORIES.map((category) => (
                                            <SelectItem key={category} value={category}>
                                                {category}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {fieldErrors.serviceCategory && (
                                    <p className="text-xs text-red-500">{fieldErrors.serviceCategory}</p>
                                )}
                            </div>

                            {/* Registration Number (Optional) */}
                            <div className="space-y-2">
                                <Label htmlFor="registrationNumber">Business Registration Number (Optional)</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <Input
                                        id="registrationNumber"
                                        type="text"
                                        placeholder="CR Number or License ID"
                                        value={formData.registrationNumber}
                                        onChange={(e) => handleChange('registrationNumber', e.target.value)}
                                        className="pl-10"
                                        maxLength={50}
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <Label htmlFor="description">Description of Services *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Briefly describe your company and the services you provide..."
                                    value={formData.description}
                                    onChange={(e) => handleChange('description', e.target.value)}
                                    className={`min-h-[100px] ${fieldErrors.description ? 'border-red-500' : ''}`}
                                    maxLength={1000}
                                />
                                <div className="flex justify-between text-xs text-slate-400">
                                    {fieldErrors.description ? (
                                        <p className="text-red-500">{fieldErrors.description}</p>
                                    ) : (
                                        <span>Minimum 20 characters</span>
                                    )}
                                    <span>{formData.description.length}/1000</span>
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-4">
                            <Button
                                type="submit"
                                className="w-full bg-[var(--mb-primary)] hover:bg-[var(--mb-primary-hover)] text-white"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Application"
                                )}
                            </Button>

                            <div className="flex items-center justify-center gap-4 text-sm">
                                <Link
                                    href="/signup"
                                    className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-[var(--mb-primary)]"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    Back to Sign Up
                                </Link>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <Link
                                    href="/login"
                                    className="text-[var(--mb-primary)] hover:underline font-medium"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>

                <p className="text-center text-xs text-slate-500 dark:text-slate-400 mt-6">
                    Your application will be reviewed by our team. We&apos;ll contact you within 2-3 business days.
                </p>
            </div>
        </div>
    );
}
