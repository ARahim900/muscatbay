# karpathy-skills

A Claude Code plugin marketplace of skills inspired by Andrej Karpathy's teaching and coding philosophy.

## Install

From Claude Code, add this marketplace and install the plugin:

```
/plugin marketplace add ARahim900/muscatbay
/plugin install andrej-karpathy-skills@karpathy-skills
```

> If you're vendoring this directory into another repo, point the marketplace command at the path or URL that hosts `.claude-plugin/marketplace.json`.

## What's in it

The `andrej-karpathy-skills` plugin ships six user-invocable skills plus a dispatcher command:

| Skill | Use when |
|---|---|
| `nanogpt-style` | Writing/refactoring ML code. Minimal, single-file, readable, shapes annotated, no unnecessary abstraction. |
| `micrograd-style` | Building an ML primitive (autograd, a layer, backprop) from scratch with zero framework magic. |
| `zero-to-hero-explain` | Teaching an ML/LLM concept step by step from first principles, with runnable code at each beat. |
| `tokenizer-deep-dive` | Explaining, implementing, or debugging tokenization (BPE, byte-level, Unicode pitfalls, glitch tokens). |
| `software-2-review` | Deciding which parts of a system should be rules (1.0), learned weights (2.0), or prompted LLMs (3.0). |
| `yolo-prototype` | Prototyping fast: end-to-end with cheats first, then iterate. Avoids architecture paralysis. |

And one command:

- `/karpathy <task>` — enters "Karpathy mode" and picks the most relevant skill for the task automatically.

## Philosophy (the short version)

- **Minimal over featureful.** Cut every line you can.
- **Readable over clever.** A junior ML engineer should be able to read your file top-to-bottom.
- **From first principles.** Show the gradients, show the shapes, show why.
- **Teach by running.** A runnable end-to-end example beats a beautiful diagram.
- **Single file when possible.** Frameworks hide things. The point is to not hide things.
- **Honest about what's hand-waved.** If you skipped something, say so.

## Structure

```
karpathy-skills/
├── .claude-plugin/
│   └── marketplace.json                # marketplace definition
├── plugins/
│   └── andrej-karpathy-skills/
│       ├── .claude-plugin/
│       │   └── plugin.json              # plugin metadata
│       ├── commands/
│       │   └── karpathy.md              # /karpathy dispatcher
│       └── skills/
│           ├── nanogpt-style/SKILL.md
│           ├── micrograd-style/SKILL.md
│           ├── zero-to-hero-explain/SKILL.md
│           ├── tokenizer-deep-dive/SKILL.md
│           ├── software-2-review/SKILL.md
│           └── yolo-prototype/SKILL.md
└── README.md
```

## Notes

This plugin is an homage. It is not affiliated with or endorsed by Andrej Karpathy. The skills are distillations of publicly shared teaching philosophy and coding style from sources like [nanoGPT](https://github.com/karpathy/nanoGPT), [micrograd](https://github.com/karpathy/micrograd), and the [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html) lecture series.
