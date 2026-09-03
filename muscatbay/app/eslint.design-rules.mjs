// eslint.design-rules.mjs
// Add to eslint.config.mjs:   import design from './eslint.design-rules.mjs';  …  export default [ ...existing, design ];
// Fails the build when UI code bypasses the design tokens.
// (Named before export: the repo's `import/no-anonymous-default-export` rule.)
const designRules = {
  files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
  ignores: ['components/ui/**'], // the primitives themselves are allowed a few escape hatches
  rules: {
    'no-restricted-syntax': ['error',
      {
        // arbitrary values: text-[13px], shadow-[...], rounded-[...], h-[104px], bg-[#4E4456]
        selector: "Literal[value=/\\b(bg|border|ring|text|shadow|rounded|h|w|p|px|py|m|mx|my|gap|leading|tracking)-\\[/]",
        message: 'Arbitrary Tailwind value. Use a token from DESIGN_SYSTEM.md (text-title, shadow-card, rounded-card, h-kpi …).',
      },
      {
        selector: "TemplateElement[value.raw=/\\b(bg|border|ring|text|shadow|rounded|h|w|p|px|py|m|mx|my|gap|leading|tracking)-\\[/]",
        message: 'Arbitrary Tailwind value in a template string. Use a design token.',
      },
      {
        // Tailwind palette colours: blue-500, slate-900, red-100 …
        selector: "Literal[value=/\\b(bg|text|border|from|to|via|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\\d{2,3}\\b/]",
        message: 'Tailwind palette colour. Use semantic tokens (bg-card, text-muted, text-success, bg-mod-water …).',
      },
      {
        // raw text sizes: text-xs … text-4xl
        selector: "Literal[value=/\\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl)\\b/]",
        message: 'Use the seven type steps: text-display, text-title, text-body, text-label, text-caption, text-eyebrow, text-kpi.',
      },
      {
        selector: "Literal[value=/\\b(shadow-(sm|md|lg|xl|2xl)|rounded-(sm|md|lg|xl|2xl|3xl|full))\\b/]",
        message: 'Use shadow-card / shadow-card-hover and rounded-card / rounded-control / rounded-pill.',
      },
    ],
  },
};

export default designRules;
