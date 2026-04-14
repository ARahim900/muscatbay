---
name: nanogpt-style
description: Write or refactor ML/PyTorch code in the style of nanoGPT — minimal, single-file, readable top-to-bottom, no unnecessary abstractions, heavy use of explanatory comments. Use when the user asks for "nanoGPT style", "Karpathy style", a "minimal implementation", a "from-scratch" version of a model, or wants a training loop that fits in one file.
user-invocable: true
argument-hint: "[model or component to implement]"
---

# nanogpt-style

Channel the aesthetic of [nanoGPT](https://github.com/karpathy/nanoGPT): **small, clean, hackable, educational**. The reader should be able to load a single file and understand every line.

## Core principles

1. **Single file, top to bottom.** The whole thing (model + training loop + config) should fit in one file if at all possible. No `utils/` directory dumping ground. No 12-file package layout for a 300-line model.
2. **No unnecessary abstraction.** If a function is called once, inline it. If a class has one method, make it a function. If you find yourself writing `BaseAbstractTrainerFactory`, stop.
3. **Literal over clever.** `q = q.view(B, T, nh, hs).transpose(1, 2)` is better than `q = rearrange(q, "b t (h d) -> b h t d")` if the reader doesn't know einops. Optimize for the lowest common denominator.
4. **Explain the shapes.** Comment tensor shapes inline: `# (B, T, C)`. This is the single highest-leverage comment in ML code.
5. **Explain the why, not the what.** Don't write `# increment i by 1`. Do write `# we scale by 1/sqrt(d_k) because otherwise the dot products grow with dimension and softmax saturates`.
6. **Globals over config objects** (in moderation). A dataclass config at the top of the file beats a YAML + argparse + config loader + validator for a teaching implementation.
7. **Print things.** A training loop that prints loss, tokens/sec, and a sample every N steps is more useful than one that logs to W&B and shows nothing locally.
8. **Reproducibility up front.** Set the seed at the top. Make it obvious.
9. **Readable > fastest.** Save the `torch.compile` + flash-attn + fused optimizers for a second pass. First pass: correctness and clarity.
10. **Delete code aggressively.** Every line you cut is a line the reader doesn't have to understand.

## Structure of a nanogpt-style file

```
# 1. Imports (stdlib, then torch, then nothing else if you can help it)
# 2. Config dataclass / @dataclass or constants at the top
# 3. Model definition
#    - small building blocks first (attention, MLP, Block)
#    - then the full model class
# 4. Data loading (tiny, often just a file read + a batch iterator)
# 5. Training loop (straight-line code, no Trainer class)
# 6. Generation / eval (inline)
# 7. `if __name__ == "__main__": train()` at the bottom
```

## Before writing code

Ask yourself — and if needed, ask the user:
- What's the **smallest** version of this that's still interesting? Start there.
- Can I delete any hyperparameter? Hardcode it.
- Can I delete any config option? Hardcode it.
- Is there a dependency I can remove? Remove it.

## Concrete stylistic rules

- **Imports**: group as `stdlib`, blank line, `torch`, blank line, `local`. No unused imports.
- **Names**: short, meaningful. `B, T, C` for batch, time, channels. `n_embd`, `n_head`, `n_layer`. Not `embedding_dimension_size`.
- **Shapes as comments**: `x = x + self.attn(self.ln_1(x))  # (B, T, C)`
- **Docstrings**: sparse. A one-liner for the model class is fine. Don't docstring every helper.
- **Type hints**: optional. Use them when they help clarity, skip them when they add noise.
- **Error handling**: minimal. `assert` for invariants (e.g. `assert n_embd % n_head == 0`). No try/except soup.
- **Tests**: one overfitting test on a tiny batch is worth more than a full test suite for a teaching impl.

## Anti-patterns to reject

- Hydra configs, OmegaConf, nested YAML
- Inheritance hierarchies (`BaseModel` → `TransformerBase` → `GPTBase` → `GPT`)
- Dependency injection, registries, factories
- Wrapping everything in `nn.Sequential` when explicit forward reads better
- Splitting a 200-line model across 6 files
- Abstract interfaces with a single implementation
- Logging frameworks when `print` would do

## When the user already has code

If the user hands you existing code and asks for "nanoGPT style":
1. **Measure the damage first.** How many files? How many classes? How deep is the inheritance? How much config plumbing?
2. **Propose a collapse plan.** Show what will merge into the single file and what will get deleted.
3. **Confirm before deleting aggressively.** Ask if specific abstractions exist for a reason you don't see.
4. **Refactor in one pass.** Don't leave half-collapsed intermediates.

## Deliverable checklist

Before reporting done, verify:
- [ ] The entire implementation is in one file (or as close as possible — justify any extras)
- [ ] The file reads top-to-bottom without jumping around
- [ ] Every tensor op has a shape comment where the shape is non-obvious
- [ ] The file runs end-to-end with `python file.py` (no argparse gauntlet required)
- [ ] You can point at any line and explain *why* it exists
- [ ] No dead code, no commented-out code, no TODOs left behind
- [ ] A fresh reader could learn the concept from this file alone
