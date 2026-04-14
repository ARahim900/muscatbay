---
name: software-2-review
description: Review code or a proposed feature through the "Software 2.0" lens — which parts should be explicitly programmed (Software 1.0), which parts should be learned from data (Software 2.0), and which parts are now better expressed as a prompt / LLM call (Software 3.0). Use when the user asks whether something should be rules-based or model-based, or is evaluating whether to replace code with an LLM call or vice versa.
user-invocable: true
argument-hint: "[feature or file to review]"
---

# software-2-review

Karpathy's ["Software 2.0"](https://karpathy.medium.com/software-2-0-a64152b37c35) thesis: large chunks of software that used to be explicit instructions written by humans (Software 1.0) are better written as optimization problems over labeled data (Software 2.0). More recently, many of *those* are now better written as natural-language prompts against an LLM (sometimes called Software 3.0).

This skill reviews a codebase or a feature and asks, for each non-trivial component: **which stack is this really in, and is it in the right one?**

## The three stacks

### Software 1.0 — explicit code
- You write rules, data structures, and algorithms.
- Deterministic, inspectable, debuggable with a debugger.
- Right for: well-specified logic, invariants, math, data transformations, anything with a clear spec and sharp edges.
- Right for: things that must be reliable, cheap, fast, and auditable.

### Software 2.0 — learned weights
- You write a dataset, a loss, and an architecture; gradient descent writes the function.
- Probabilistic, opaque, debuggable via data and training curves.
- Right for: tasks humans do well but can't specify (image recognition, speech, basic language understanding, embeddings, recommendation).
- Right for: tasks where the input distribution is fuzzy and handwritten rules chase their tail.

### Software 3.0 — prompted LLM
- You write a prompt (+ tools, + schema, + examples); a general model does the work.
- Highly flexible, brittle in different ways, debuggable via prompt iteration and evals.
- Right for: tasks that need world knowledge, language understanding, or reasoning you can't easily label a dataset for.
- Right for: low-volume tasks where the cost per call is acceptable, or tasks where the alternative is hiring someone.

## The review

For each significant component, ask:

1. **What is this thing actually doing?** Not what the function name says — what's the actual transformation from input to output?
2. **Which stack is it in now?** 1.0, 2.0, or 3.0?
3. **Which stack does it *belong* in?**
4. **If it's in the wrong place, what would the right version look like?**

## Signals that 1.0 code should become 2.0 or 3.0

- **The rules list keeps growing.** Every new edge case adds an `if`. You're losing the battle against the input distribution.
- **The function is a giant switch/regex/lookup-table for human language.** This is almost always a sign that 3.0 (a prompt) would be more robust.
- **The heuristic has "magic numbers" that got tuned by trial and error.** That's half a learned model, implemented badly.
- **You have a labeled dataset sitting around that nobody's using.** Could you fit a tiny model?
- **You're trying to classify, extract, or summarize freeform text** with hand-written parsing. 2.0 or 3.0, almost certainly.
- **The spec is "whatever a human would do"** and nobody can make it more precise. That's a data-and-model problem, not a code problem.

## Signals that 2.0 / 3.0 code should become 1.0

- **The task has a clean spec and sharp edges** (arithmetic, date math, string reversal, counting, schema validation). Don't ask a model. Write the code.
- **You need determinism or auditability.** Regulatory, financial, safety-critical.
- **The model is a 10B parameter language model doing `int(x) + int(y)`.** Stop. Write the code.
- **Cost per call matters.** 1.0 is orders of magnitude cheaper at scale.
- **Latency matters.** Same.
- **You already have a well-tested rule-based solution** and the 2.0/3.0 version isn't clearly better. Don't replace working code with vibes.

## Signals that 2.0 code should become 3.0

- The thing you trained a model for is now trivially done by a general LLM with a prompt.
- You're maintaining a pipeline (data → train → serve) for a task that a zero-shot LLM call handles, and the volume doesn't justify the pipeline cost.

## Signals that 3.0 code should become 2.0

- You're paying per token for billions of calls. A small fine-tuned model or a distilled version would pay for itself.
- The task is narrow and high-volume (classification, embedding, simple extraction). A 300M param model often beats a 70B general model on cost/latency/quality for one specific thing.
- You need offline or low-resource deployment.

## Signals that 3.0 is being misused as 1.0

- The prompt is being asked to do arithmetic, counting, string-indexing, or anything the tokenizer makes hard. **Give the LLM a tool instead.** Write the tool in 1.0, let the LLM call it.
- The LLM is being asked to produce structured output and getting it wrong sometimes — use a constrained decoder, a schema, or a parser with retry.
- The prompt is 2000 lines of "rules" for the LLM to follow. That's 1.0 disguised as 3.0. Either trust the model or write the code.

## How to deliver the review

1. **Walk the feature / file / codebase.** List the non-trivial components.
2. **For each, name the stack and the actual task.**
3. **Flag mismatches.** Be specific: "This 150-line regex-based intent classifier is 1.0 code doing a 2.0/3.0 job. A prompted LLM with 5 few-shot examples would likely outperform it and be shorter."
4. **Prioritize.** Not every mismatch is worth fixing. Call out the ones where the payoff is high.
5. **Sketch, don't build.** The deliverable is a review. If the user wants the fix, they'll ask for it.

## Anti-patterns to flag

- **"LLM-ify everything":** replacing working 1.0 code with a slow, expensive, unreliable LLM call for no reason
- **"Rule the prompt into submission":** a 2000-line prompt trying to enforce determinism
- **Reinventing the model:** 1.0 code with 40 hand-tuned thresholds that's obviously a failing attempt at a 2.0 model
- **No eval:** a 3.0 replacement with no way to measure if it's better than what it replaced
- **No fallback:** a 3.0 call in a hot path with no 1.0 fallback for when the model fails

## Deliverable checklist

- [ ] Each component is placed on the 1.0 / 2.0 / 3.0 spectrum
- [ ] Mismatches are called out explicitly
- [ ] Recommendations are ranked by impact, not listed flatly
- [ ] Each recommendation has a concrete next step ("replace X with Y", not "consider AI")
- [ ] Any 3.0 recommendation includes how you'd evaluate it vs the status quo
- [ ] Any 1.0-from-3.0 recommendation is justified by cost, latency, or reliability, not taste
