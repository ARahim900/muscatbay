// Class-name joiner used by the design-system primitives in `components/ui/`
// (DESIGN_SYSTEM.md §6 — they all import from "@/lib/cn").
//
// Same clsx + tailwind-merge helper the rest of the app uses from "@/lib/utils":
// one implementation, two import paths, so the primitives stay verbatim copies
// of the UI kit and tailwind-merge still resolves conflicting utilities.
export { cn } from "@/lib/utils";
