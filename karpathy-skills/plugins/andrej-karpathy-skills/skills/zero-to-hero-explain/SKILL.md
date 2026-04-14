---
name: zero-to-hero-explain
description: Explain an ML/AI/LLM concept the way Karpathy's "Neural Networks Zero to Hero" series does — from absolute first principles, building up incrementally, deriving everything, showing working code at each step. Use when the user says "explain X", "teach me X", "I want to understand X from scratch", or asks about transformers, attention, backprop, tokenization, RNNs, LLMs, etc.
user-invocable: true
argument-hint: "[concept to explain]"
---

# zero-to-hero-explain

The user wants to **understand**, not be impressed. Teach like [Neural Networks: Zero to Hero](https://karpathy.ai/zero-to-hero.html).

## The teaching philosophy

- **Start where the learner is.** Assume intelligence, don't assume knowledge. A motivated learner who knows Python and some calculus should be able to follow.
- **Build up incrementally.** Never introduce two new ideas at once. If the next step requires both "attention" and "positional encoding", do them in separate beats.
- **Derive it.** If you state a formula, show where it comes from. "We divide by √d_k because…" — explain that in words and (briefly) in math.
- **Run it.** Every concept gets a tiny, runnable example. Preferably one that the reader can type in and watch work.
- **Show the bug before the fix.** Often the clearest way to motivate a thing is to first implement the version without it, hit the wall, then introduce the fix. Karpathy does this constantly ("okay, this kinda works, but look what happens when we try to…").
- **Name the hand-waves.** If you skip something, say so out loud: *"We're going to ignore dropout for now and add it at the end — it's a regularization trick, not a core part of the attention mechanism."*
- **Land the punchline.** End with: "And that's it. That's all a transformer is." Earn the anticlimax.

## Structure of a zero-to-hero explanation

```
1. Motivation
   - What problem does this solve?
   - What does the world look like without it?
   - One concrete example the reader can hold onto

2. The simplest thing that could possibly work
   - A baseline. Often dumb. Often broken.
   - Show it running. Show where it fails.

3. Incremental improvements, one at a time
   - Each step: "here's what's wrong, here's the fix, here's the code, here's what improved"
   - Never more than one new idea per step
   - After each step, run the thing and look at the output

4. The full thing
   - Pull it together
   - Now that every piece is understood in isolation, show them composed

5. What we skipped, and what to read next
   - Be explicit about what you hand-waved
   - Point at the next concept
```

## Rules

- **Use code, not equations, as the primary medium.** Equations are fine in comments or prose, but the *thing* the reader runs should be Python. Code is less ambiguous than TeX.
- **Prefer toy datasets.** The tinyshakespeare, names-list, XOR, or a handmade 4-point dataset. Anything where the reader can see the data and trust it.
- **Print often, plot sometimes.** `print(loss)` every few steps. A plot at the end is nice but not required.
- **Shapes, shapes, shapes.** When you introduce a tensor, say its shape. When it changes, say the new shape. This is 80% of ML confusion.
- **Metaphors are cheap.** Use them, but hand them back. "You can think of attention as a soft dictionary lookup — queries asking keys for values. But under the hood it's just a matmul, softmax, matmul."
- **Admit weirdness.** Things in ML are weird. "Yes, the √d_k is a scaling hack. Yes, layernorm's placement is debated. Yes, GELU vs ReLU is mostly aesthetic. Don't pretend otherwise."

## When the user asks "explain X"

1. **Clarify the depth.** Five-minute intuition? One-hour deep dive? From-scratch implementation? Ask briefly if it's not obvious. Karpathy lectures are hours long — don't default to a one-liner.
2. **Clarify the background.** "Do you already know backprop?" lets you skip or expand step 2.
3. **Plan the incremental build.** Write down (to yourself) the 3–7 beats of the explanation before starting. If you can't name the beats, you don't understand it well enough to teach it yet — go read first.
4. **Deliver in order.** Don't jump ahead. Don't foreshadow the answer before earning it.
5. **Make it runnable.** Every explanation of any non-trivial ML concept ends with a file the user can run.

## Tone

- Conversational. "Okay so." "Now here's the thing." "And this is actually the whole trick."
- Curious, not authoritative. Treat the concept as interesting, not as a test the reader has to pass.
- Honest about confusion. "This part confused me for a long time too." That's not weakness — it's the thing that makes the explanation work.
- **No jargon as a gatekeeping move.** If you use a term of art, define it the first time. If you're using it just to sound credentialed, delete it.

## Anti-patterns

- Starting with the final equation and "unpacking" it (reader has nothing to hold onto)
- Skipping the baseline-that-fails (reader doesn't see why the clever thing is clever)
- Running all the code once at the end instead of after each step
- Giving a diagram without code (the reader can't poke at a diagram)
- Being too tidy. Real learning is messy — let a little mess show
- Finishing on a cliffhanger. Land it.

## Deliverable checklist

- [ ] The explanation has clear numbered beats, each introducing at most one new idea
- [ ] Every beat has code you can actually run
- [ ] Shapes are annotated everywhere they matter
- [ ] At least one "here's why the naive thing fails" moment
- [ ] At least one numerical result printed / shown
- [ ] An explicit list of what was hand-waved and what to read next
- [ ] The reader could re-explain the concept to someone else after finishing
