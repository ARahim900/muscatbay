---
name: tokenizer-deep-dive
description: Explain, implement, or debug tokenization (BPE, byte-level, sentencepiece) with Karpathy's "Let's build the GPT tokenizer" rigor. Covers Unicode pitfalls, weird edge cases, why tokenization causes LLM bugs, and how to implement BPE from scratch. Use when the user asks about tokenizers, BPE, vocabulary, subwords, "why did the LLM fail on this string", or wants to implement tokenization from scratch.
user-invocable: true
argument-hint: "[tokenizer topic or bug]"
---

# tokenizer-deep-dive

Tokenization is the part of LLMs that quietly causes most of the weird bugs. This skill channels Karpathy's ["Let's build the GPT tokenizer"](https://www.youtube.com/watch?v=zduSFxRajkE) lecture: **treat tokenization as a first-class concept, not plumbing.**

## The thesis

> Many of the weird behaviors of LLMs — trailing whitespace sensitivity, number arithmetic failures, inability to reverse strings, SolidGoldMagikarp-style glitch tokens, case sensitivity, non-English underperformance, trailing-space prompt issues — trace back to tokenization, not the model.

When a user says "the LLM is bad at X", step 1 is often: **look at the tokens**.

## Core knowledge

### What tokenization is
- A deterministic, learned function from `str → list[int]`
- Typically BPE (Byte-Pair Encoding), sometimes Unigram (SentencePiece), sometimes WordPiece
- The vocab is learned once, then frozen. The model sees token IDs, never characters.

### Why it's not "just split on spaces"
- Languages without word boundaries (Chinese, Japanese, Thai)
- Inflection (running, runs, ran — should share something?)
- OOV words (can't just have a dictionary)
- Code (whitespace matters, symbols matter)
- Emoji, combining characters, ZWJ sequences
- Multilingual mixing

### BPE, briefly
1. Start with bytes (or chars) as the initial vocabulary
2. Count all adjacent pairs in the training corpus
3. Merge the most frequent pair into a new token
4. Repeat until you hit target vocab size
5. Encoding: apply the merges (in learned order) to new text
6. Decoding: look up each ID in the vocab, concat bytes, decode UTF-8

### Byte-level BPE (GPT-2 style)
- Start from **bytes**, not Unicode code points
- Every string, in any language, any emoji, any control character, is representable
- No `<UNK>` tokens
- Comes with a byte→printable-char mapping trick so the vocab is inspectable
- This is what GPT-2, GPT-3, GPT-4, LLaMA-ish models use (with variations)

## The weird stuff (why this skill exists)

When debugging or explaining LLM behavior, know that these are all **tokenizer artifacts**, not model artifacts:

- **Arithmetic failures**: `127 + 677` — the digits may not tokenize as individual digits. GPT-2 has tokens for `127` and `677` as multi-digit chunks. The model has to learn arithmetic on whatever the tokenizer hands it.
- **String reversal failures**: the model sees tokens, not chars. "Reverse 'strawberry'" is hard because it sees maybe 2-3 tokens, not 10 letters.
- **Counting characters**: "how many r's in strawberry" — same reason.
- **Trailing whitespace**: `"hello"` vs `"hello "` tokenize differently and the model has seen very different distributions after each. Trailing spaces in prompts can tank quality.
- **Case sensitivity surprises**: `Hello` and `hello` may be different tokens and behave differently.
- **Glitch tokens (SolidGoldMagikarp)**: rare tokens that appeared in the tokenizer training data but not the model training data — the model has no idea what to do with them, produces garbage.
- **Non-English underperformance**: non-English text often tokenizes into many more tokens per char, effectively shortening the context window and raising cost.
- **Code quality depends on tokenizer**: Python indentation is tokenized differently in GPT-2 vs GPT-4's tokenizer, which is part of why GPT-4 writes better Python.
- **JSON quirks**: `{"key":` vs `{ "key" :` may tokenize very differently.

Any time the user reports "the LLM is bad at X", ask: *what do the tokens look like?*

## Implementing BPE from scratch (the Karpathy way)

```
1. Read corpus as bytes.
2. Initial vocab: 256 bytes.
3. Count pairs.
4. Merge most common pair → new token (id 256, then 257, ...).
5. Record the merge in a merges list, in order.
6. Repeat until desired vocab size.

Encoding new text:
1. Encode to bytes.
2. Greedily apply merges in learned order until no more apply.
3. Return list of token ids.

Decoding:
1. Map each id back to its byte sequence.
2. Concat.
3. utf-8 decode (with errors='replace' for safety).
```

Write this as a `BasicTokenizer` class with `train`, `encode`, `decode`. ~100 lines. No dependencies.

Then (in a follow-up, if asked) extend to a `RegexTokenizer` that pre-splits on a regex (like GPT-2 / GPT-4's pre-tokenizer pattern) before running BPE within each chunk. This prevents cross-boundary merges you don't want (like merging across word boundaries, or merging digits with letters).

## When debugging a tokenization-related bug

1. **Tokenize the input.** Show the token IDs and the string each ID decodes to. Use a visualizer if you have one, or just print `[(id, tokenizer.decode([id])) for id in ids]`.
2. **Look at the boundaries.** Where does the tokenizer split? Often the bug is right at a boundary.
3. **Check for hidden whitespace.** Trailing spaces, non-breaking spaces, newlines. These all tokenize differently.
4. **Check for unusual characters.** Smart quotes, em-dashes, Unicode normalization (NFC vs NFD), RTL marks.
5. **Compare the "good" and "bad" inputs at the token level.** If one works and one doesn't, the diff is almost always in the tokens.

## When implementing / explaining

- Start with a corpus the user can see (a short paragraph, or a few lines of code)
- Show the initial vocab (bytes)
- Show the first merge and why it was picked
- Show the second merge
- Then jump to the end state
- Encode a new string and show the token IDs + their decoded pieces
- Decode them back and verify round-trip

## Anti-patterns

- Glossing over bytes vs code points (they are not the same thing and the difference matters)
- Writing BPE in terms of characters and then "handwaving" to bytes later
- Skipping the pre-tokenizer regex (it's not optional for real tokenizers)
- Treating tokenization as solved. It is not. It is the weakest link of modern LLMs and Karpathy says so explicitly.
- Ignoring the merge *order* — BPE is not "the set of merges", it's the *ordered list* of merges
- Forgetting `errors='replace'` on decode — breaks on mid-token UTF-8

## Deliverable checklist

- [ ] If implementing: bytes, not code points
- [ ] If implementing: merge order preserved
- [ ] If implementing: round-trip test (encode → decode → original)
- [ ] If implementing: runnable on a tiny corpus with visible output at each step
- [ ] If explaining: concrete example strings that demonstrate a named pitfall
- [ ] If debugging: the tokens have been *looked at*, not assumed
- [ ] The user walks away knowing tokenization is the first place to look when LLMs fail on "simple" string tasks
