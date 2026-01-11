# Repair Guide (Verbatim)

This document is the internal repair guide for the existing p5.js raster-first stipple tool. It is not a redesign or new feature plan. Output 2 (single-stroke path) correctness is non-negotiable.

## 1) How to analyze the system correctly

### 1.1 Core invariants (must always be true)
- Output 2 is exactly one polyline.
- Visits every stipple point exactly once.
- No crossings.
- No touching (no kissing, no tangency).
- No collinear overlap between non-adjacent segments.
- No repeated vertices.
- No point degree > 2.
- Must never emit or display an invalid path.
- There is no failure / give-up state exposed to the user.
- The solver must keep evolving deterministically until a valid path is produced.

### 1.2 What must be instrumented before fixing anything
- Path validation must log or visualize which segment pair causes a failure.
- Merge must report how many clusters were formed, max cluster size, and whether any pairs remain within min distance after the final merge.
- Density acceptance must report acceptance ratio and spacing stats (min/mean/max).

### 1.3 How to make failures reproducible
- Always record: seedStipple, seedPath, seedFlow, minDistance, gamma, densityScale, edgeWeight, edgeBlurRadius, edgeExponent.
- Never change more than one parameter at a time when reproducing a failure.

### 1.4 How to distinguish bug types
- **Stipple bugs**: Poisson sampling + acceptance creates clumps or voids; merge doesn’t stabilize.
- **Analysis-field bugs**: tone/edge fields look wrong or inconsistent across modules.
- **Path-solver bugs**: valid path exists but solver fails to construct it.
- **Validator bugs**: path is invalid but validator passes it (or vice versa).

## 2) How to triage issues by layer

### 2.1 Path crossings/touches
Decision rule:
- If a visual crossing exists and validation passes, the validator is wrong.
- If validation fails and a path is still emitted, the solver is wrong.

### 2.2 Density anomalies
Decision rule:
- If Poisson base distribution is good but accepted points cluster, the density acceptance is wrong.
- If edge influence is noisy or inconsistent, analysis fields are wrong.

### 2.3 Edge artifacts
Decision rule:
- If edge mask is wrong but gradients are fine, thresholding is wrong.
- If gradients are wrong, analysis (smoothing or scaling) is wrong.

### 2.4 Flow-field misbehavior
Decision rule:
- If flow lines run uphill, gradient sign is wrong.
- If flow lines terminate prematurely, step/threshold parameters are wrong.

## 3) How to fix Output 2 correctly

### 3.1 Why finite candidate modes are insufficient
A solver that tries a finite set of modes and falls back to an invalid path violates the non-negotiable constraints. Output 2 must never be invalid.

### 3.2 Required solver structure
- **Stage 1**: deterministic guaranteed-valid construction backbone.
- **Stage 2**: optional bounded improvements that never invalidate the path.

### 3.3 Correctness before optimization
- Scoring and optimization only apply after a valid path exists.
- Any invalid candidate must be discarded, not patched.

## 4) How to fix geometry validation

### 4.1 What “no cross, no touch, no overlap” means
- Any intersection other than a shared endpoint is a failure.
- Any tangency or collinear overlap is a failure.
- Epsilon must be centralized and applied consistently.

### 4.2 Why standard intersection tests are insufficient
Standard segment intersection only detects crossings. This tool must also reject touching and collinear overlap. Epsilon must be used consistently to avoid floating-point ambiguity.

### 4.3 Required instrumentation
- Log or visualize the exact segment pair that fails validation.
- Record the epsilon used during validation.

## 5) How to fix stipple merge & density so they don’t sabotage the path

### 5.1 Merge must be iterative until stable
- A single pass can create new near-collisions.
- Merge must repeat until no pairs remain within min distance.

### 5.2 Density acceptance can create pathological geometry
- Log acceptance ratio and spacing statistics.
- Detect if acceptance produces dense clusters that violate the path constraints.

## 6) Debugging overlays and diagnostics required

- Path failure overlay (highlight offending segments).
- Merge diagnostics (cluster size distribution).
- Field visualization (tone, smoothed tone, edge magnitude, edge mask, edge influence).

## 7) Fix order / sprint plan

1) **Path correctness first**: guarantee a valid Output 2 path with no crossings/touches.
2) **Merge stability**: iterative merge, spacing verification.
3) **Field sanity**: verify analysis outputs visually.
4) **Heuristic refinement**: only after correctness is locked.
