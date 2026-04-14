---
name: micrograd-style
description: Build ML concepts from absolute first principles with zero framework magic — just Python and (optionally) numpy. Inspired by Karpathy's micrograd. Use when the user wants to understand backprop, autograd, a specific layer, an optimizer, or any ML primitive by building it from scratch with nothing hidden.
user-invocable: true
argument-hint: "[concept to build from scratch]"
---

# micrograd-style

Channel [micrograd](https://github.com/karpathy/micrograd): **the entire concept, from scratch, in as little code as possible, with nothing hidden behind a framework call**. If the answer is `loss.backward()`, this skill is the wrong tool. If the answer is *"and here is what `.backward()` actually does, line by line"*, this is the right tool.

## The core idea

Frameworks hide things. That's their job. But hiding things is the enemy of understanding. micrograd-style code says: *"I'll write every line myself, and you will see exactly where every gradient comes from, exactly what every matmul costs, exactly why every sign is the way it is."*

The reader should walk away able to **re-derive the concept on a whiteboard**, not just able to call a different library.

## Rules of engagement

1. **No deep-learning frameworks.** No PyTorch, no TF, no JAX, no autograd libraries. Python + (optionally) numpy is the ceiling. If you use numpy, use it for arrays and elementwise ops — not for things the reader is supposed to learn (don't use `numpy.linalg` to hide the thing you're teaching).
2. **Every operation is visible.** If you compute a gradient, you write the gradient. No `.grad` that appears from nowhere.
3. **Prefer scalars first, then generalize.** micrograd operates on scalars. That's a feature. Start with the scalar case so the reader sees the math unobscured, *then* (if needed) generalize to vectors/matrices in a separate pass.
4. **The forward pass and the backward pass live next to each other.** For every op, show: (a) what it computes, (b) what its local derivative is, (c) how that derivative flows backward via the chain rule.
5. **Short functions, named after math.** `def tanh(x)`, `def sigmoid(x)`, `def mse(y, yhat)`. Not `ActivationFunctionBase`.
6. **Comments explain the calculus, not the Python.** `# d/dx (x*y) = y` is good. `# multiply a by b` is noise.
7. **Show a tiny working example.** A micrograd-style artifact without a runnable end-to-end demo (e.g. "here's a 2-neuron network learning XOR") is incomplete.

## Structure

```
# 1. The Value (or Tensor) class with:
#    - data
#    - grad
#    - _backward (a closure that knows how to propagate this op)
#    - _prev (the inputs that produced this node)
# 2. Operator overloads: __add__, __mul__, __pow__, tanh, relu, exp, log, ...
#    Each one:
#        - computes forward
#        - creates a new Value
#        - defines _backward: "given out.grad, update self.grad (and other.grad)"
# 3. backward(): topological sort, then call _backward in reverse order
# 4. A tiny neuron / layer / MLP built on top
# 5. A minimal training loop on a trivial dataset
# 6. Print loss each step. Show it go down. Done.
```

## What to write for each operation

For any op `z = f(x, y)`, include:

```python
# forward
out = Value(f(x.data, y.data), _prev=(x, y), _op='f')

# backward: dL/dx = dL/dout * dout/dx, dL/dy = dL/dout * dout/dy
def _backward():
    x.grad += (dout_dx) * out.grad
    y.grad += (dout_dy) * out.grad
out._backward = _backward
```

Every line of that should be defensible from first principles.

## Pedagogical moves

- **Derive before you code.** Write the math in a comment or docstring *above* the implementation. Reader sees derivation, then sees the code that matches it.
- **Number the steps.** "Step 1: forward pass. Step 2: zero grads. Step 3: compute loss. Step 4: backward. Step 5: update params." This is obvious — make it obvious in the code too.
- **Name things after the math.** `dL_dw` beats `weight_gradient_buffer`.
- **Break the wrong thing on purpose once.** If there's a subtle bug a beginner would hit (forgetting to zero grads, accumulating instead of replacing, wrong sign on the update), mention it in a comment: *"Note: we accumulate grads with += because a node can be used multiple times in a graph. If you use = you will silently wrong."*
- **End with a punchline.** A one-line result: *"This is PyTorch. Everything else is optimization, parallelism, and broadcasting."*

## Anti-patterns

- Using numpy ops that do the thing you're supposed to be teaching (`np.gradient`, autograd libs of any kind)
- Over-generalizing on the first pass (jumping straight to broadcasting + batching + GPUs)
- Abstract base classes — there is no `AutogradEngine` interface, there's just `Value`
- Skipping the numerical gradient check. Always include a tiny check: compute `(f(x+h) - f(x-h)) / (2h)` and compare against the analytic gradient for one op
- Dropping the runnable demo
- Being precious about performance. This is teaching code. Slow is fine. Clear is required

## Deliverable checklist

Before reporting done:
- [ ] Zero DL framework imports
- [ ] Every gradient is written out by hand with a comment explaining the derivative
- [ ] A numerical gradient check exists somewhere in the file
- [ ] A tiny working example (XOR, sine regression, 2-class classification) runs and converges
- [ ] The reader could, after reading this, re-derive the gradient for a new op you didn't cover
- [ ] The file is short enough that the reader can hold all of it in their head at once
