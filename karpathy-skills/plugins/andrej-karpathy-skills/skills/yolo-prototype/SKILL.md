---
name: yolo-prototype
description: Build the end-to-end MVP fast, ugly, and working before worrying about architecture, tests, or polish. Channels Karpathy's "get a dumb baseline running end-to-end first, then iterate" philosophy. Use when the user wants to prototype an idea, validate a feasibility question, or get unstuck from analysis paralysis.
user-invocable: true
argument-hint: "[idea to prototype]"
---

# yolo-prototype

When you're trying to figure out whether an idea works, **the worst thing you can do is design it carefully first**. You will design the wrong thing, because you don't yet know what the idea becomes when it touches reality.

Karpathy on training neural nets: *"Get a dumb baseline end-to-end first, then iterate."* Same applies to prototypes generally.

## The philosophy

1. **End-to-end before perfect-in-parts.** A working hack that covers the whole pipeline is worth more than a beautiful, rigorous implementation of step 2 of 5.
2. **Cheat aggressively.** Hardcode things. Use fake data. Skip auth. Skip persistence. Skip error handling. Skip tests. Skip types. The goal is learning, not shipping.
3. **Short feedback loop is the only thing that matters.** Measure every minute of the prototype session. Anything that lengthens the loop (setup, build, auth flow, deploy, infra) is your enemy right now.
4. **Run it constantly.** Every few minutes. Not "I'll run it when I'm done." Running it *is* how you debug your mental model.
5. **Print everything.** No logging framework. `print(x)`, `console.log(x)`, raw HTTP responses pasted in. You are looking at reality, not a nice dashboard.
6. **Lock the scope.** The prototype answers *one* question. If you find yourself answering a second question, stop and write it down for later.
7. **Die early if it's broken.** If the answer to the question turns out to be no, the prototype was a success and should be deleted. Don't emotionally attach.

## What to cheat

| Real version | Prototype version |
|---|---|
| Database | A dict, or a JSON file, or hardcoded constants |
| Auth | Skip. Or `user_id=1`. |
| Config | Hardcoded globals at the top |
| Deployment | `python main.py` |
| API versioning | One endpoint, no version |
| Error handling | Let it crash |
| Tests | One script that runs the happy path |
| Types | Add later if at all |
| Frontend | `curl`, or a `print`, or a Jupyter cell |
| Retry logic | Rerun manually |
| Streaming | Block and buffer |
| Schema validation | `data["key"]` and pray |
| Monitoring | `print` |
| CI | Run locally |
| Docs | A comment |
| Code review | You review it, once, before deleting it |

## What NOT to cheat (ever)

- **Correctness on the core question.** If you're prototyping a retrieval system, the retrieval logic needs to actually work. Cheat on everything around it.
- **Security when touching real user data.** If the prototype uses real PII, real secrets, real production access — don't skip auth, don't hardcode keys in the repo, don't publish to a public URL.
- **Destructive operations on real systems.** Prototypes should not write to prod DBs, send real emails, charge real cards, or delete real files.

## The loop

```
1. Ask: what is the ONE question this prototype answers?
   Write it down. One sentence.

2. Ask: what's the shortest path from "nothing" to "the answer"?
   Name the cheats you'll use to shorten that path.

3. Build the end-to-end skeleton FIRST, with fake everything.
   Run it. Confirm data flows from input to output.

4. Replace fakes one at a time, from most load-bearing to least.
   After each replacement, run the whole thing again.

5. When the one question is answered, STOP.
   Write down the answer. Decide: throw away, rewrite properly, or keep as-is for a bit.
```

## Red flags (you've left prototype mode without meaning to)

- You're adding tests — are you prototyping or productionizing?
- You're adding a config system — are you prototyping or productionizing?
- You're refactoring — the prototype isn't done yet
- You're choosing between two ORMs — stop, use neither, use a dict
- You're naming things carefully — stop, call it `thing` and `thing2`
- You haven't run the code in 30 minutes — **run it now, something is wrong with your process**
- You're adding features before the baseline is end-to-end working — don't
- You're worried about "how it will scale" — wrong question for this phase

## Talking to the user during a prototype session

- **Lead with the question.** "What's the one thing you want to learn from this prototype?"
- **Negotiate cheats up front.** "I'm going to hardcode the user, skip auth, use a JSON file instead of a DB. Good?" Get permission once, then use it.
- **Report the loop, not the architecture.** "The end-to-end runs. Input → model → output. It took 4.2 seconds and the output is [x]. Is that what you expected?"
- **Flag the moment the prototype becomes real.** If the user wants to keep the prototype and build on it, say: *"Now's the point to rewrite the cheats. Here's what to fix first."* Don't silently stretch a prototype into production.

## Anti-patterns

- Designing the architecture before writing a line of code
- Setting up a monorepo, linter, formatter, test runner, and CI before doing anything
- Picking a framework by reading comparison blog posts for an hour
- Building step 1 beautifully and never getting to step 2
- Refusing to hardcode things because "we'll need it configurable eventually"
- Getting precious about code quality in a script that will be deleted in an hour
- Letting a prototype graduate to production without anyone deciding that's what happened

## Deliverable checklist

- [ ] The one question is written down at the top of the prototype
- [ ] The prototype runs end-to-end in one command
- [ ] The output of that command visibly answers the question (or visibly fails to)
- [ ] The cheats are listed in a comment — so they're easy to find and replace later
- [ ] Nothing that was outside the scope of the question got built
- [ ] A one-line verdict exists at the end: "The answer is yes / no / unclear, because [data]"
- [ ] A recommendation: throw away, rewrite, or keep iterating
