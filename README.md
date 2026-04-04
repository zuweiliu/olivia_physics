# Universal Gravitation — Interactive Lesson

An interactive, browser-based physics lesson covering Newton's Universal Law of Gravitation. Built for students learning gravity concepts with step-by-step guidance.

## Features

- **Concept Introduction** — Animated explanations of gravitational force, the gravitational constant *G*, and acceleration due to gravity
- **Understanding Check** — 4-question multiple-choice quiz on core concepts
- **Worked Example** — Step-by-step walkthrough of a real problem
- **Practice Problem** — Guided problem-solving with expression input (supports formulas like `G*ME*500/(6.57e6)^2`)
- **Quiz** — 6 questions mixing multiple-choice and calculation
- **Homework** — 9 problems with interactive step-by-step guidance
- **Gravity Simulator** — Adjustable sliders to explore how mass and distance affect gravitational force

## Usage

Open `gravitation_lesson.html` in any modern browser. No server required — everything runs client-side.

The lesson uses [MathJax 3](https://www.mathjax.org/) for rendering mathematical notation (loaded from CDN, requires internet).

## Expression Input

In practice problems and quizzes, you can type math expressions using built-in constants:

| Constant | Value |
|----------|-------|
| `G` | 6.674 × 10⁻¹¹ N·m²/kg² |
| `ME` | 5.98 × 10²⁴ kg |
| `RE` | 6.37 × 10⁶ m |
| `Mm` | 7.4 × 10²² kg |
| `Rm` | 1.74 × 10⁶ m |
| `g` | 9.80 m/s² |
| `pi` | π |

Supports `sqrt()`, `^` for exponents, and standard arithmetic.

## Files

- `gravitation_lesson.html` — The complete interactive lesson (single file)
- `docx_images/` — Diagrams extracted from the source textbook
