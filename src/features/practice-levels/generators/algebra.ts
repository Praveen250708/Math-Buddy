import { PracticeQuestion } from "../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Level 5: Sequences & Infinite Series
 * Topics: Infinite geometric series sum, Maclaurin / Taylor polynomial evaluation, Limit of rational sequence
 */
export function generateLevel5Question(): PracticeQuestion {
  const templates = ["infinite_geometric_series", "taylor_coefficient", "sequence_limit_inf", "arithmetic_partial_sum"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl5_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "infinite_geometric_series") {
    // S = a / (1 - r). Let r = 1/2, a = 2*k => S = 2k / (1 - 0.5) = 4k
    // Or r = 1/3, a = 2*k => S = 2k / (2/3) = 3k
    const k = randomInt(2, 6);
    const rType = randomInt(2, 3);
    const a = rType === 2 ? 2 * k : 2 * k;
    const rStr = rType === 2 ? "1/2" : "1/3";
    const sum = rType === 2 ? 4 * k : 3 * k;

    return {
      id,
      levelNumber: 5,
      topic: "Sequences & Series",
      questionText: `Find the exact sum of the infinite convergent geometric series: ∑_{n=0}^{∞} ${a}(${rStr})ⁿ:`,
      mathExpression: `S = \\sum_{n=0}^{\\infty} ${a}\\left(${rStr}\\right)^n`,
      correctAnswer: sum.toString(),
      acceptedAnswers: [sum.toString(), `S=${sum}`],
      hints: [
        { level: 1, text: `The sum of an infinite geometric series with |r| < 1 is given by S = a / (1 - r).` },
        { level: 2, text: `Here initial term a = ${a} and common ratio r = ${rStr}. Compute ${a} / (1 - ${rStr}).` }
      ],
      solutionSteps: [
        `Identify the first term a = ${a} and the common ratio r = ${rStr}.`,
        `Since |${rStr}| < 1, the series converges.`,
        `Apply formula: S = a / (1 - r) = ${a} / (1 - ${rStr}) = ${a} / (${rType === 2 ? "1/2" : "2/3"}).`,
        `S = ${sum}.`
      ]
    };
  } else if (type === "taylor_coefficient") {
    // Maclaurin series of e^(ax) = sum (a^n / n!) x^n. Coefficient of x^2 is a^2 / 2
    // If a is even, a^2 / 2 is an integer
    const a = 2 * randomInt(1, 4); // 2, 4, 6, 8
    const coeff = (a ** 2) / 2;

    return {
      id,
      levelNumber: 5,
      topic: "Sequences & Series",
      questionText: `Find the coefficient of x² in the Maclaurin series expansion of f(x) = e^{${a}x}:`,
      mathExpression: `f(x) = e^{${a}x} = \\sum_{n=0}^{\\infty} \\frac{(${a}x)^n}{n!}`,
      correctAnswer: coeff.toString(),
      acceptedAnswers: [coeff.toString()],
      hints: [
        { level: 1, text: `The Maclaurin series for eᵘ is ∑ uⁿ / n!. Substitute u = ${a}x.` },
        { level: 2, text: `The term with x² is (${a}x)² / 2! = (${a ** 2} / 2)x². Compute ${a ** 2} / 2.` }
      ],
      solutionSteps: [
        `Recall the standard Maclaurin series: eᵘ = 1 + u + u²/2! + u³/3! + ...`,
        `Substitute u = ${a}x: e^{${a}x} = 1 + (${a}x) + (${a}x)²/2 + ...`,
        `The x² term is (${a}² / 2) x² = (${a ** 2} / 2) x² = ${coeff} x².`,
        `The coefficient of x² is ${coeff}.`
      ]
    };
  } else if (type === "sequence_limit_inf") {
    // lim_{n -> inf} (a*n^2 + b*n) / (c*n^2 + d) = a / c
    const c = randomInt(1, 3);
    const k = randomInt(2, 6);
    const a = c * k; // ensures a/c = k is an integer
    const b = randomInt(3, 9);
    const d = randomInt(2, 8);

    return {
      id,
      levelNumber: 5,
      topic: "Sequences & Series",
      questionText: `Evaluate the limit of the rational sequence as n approaches infinity:`,
      mathExpression: `\\lim_{n \\to \\infty} \\frac{${a}n^2 + ${b}n}{${c}n^2 + ${d}}`,
      correctAnswer: k.toString(),
      acceptedAnswers: [k.toString()],
      hints: [
        { level: 1, text: `Divide numerator and denominator by the highest power of n, which is n².` },
        { level: 2, text: `As n → ∞, terms with 1/n or 1/n² approach 0. The limit is determined by the ratio of leading coefficients: ${a} / ${c}.` }
      ],
      solutionSteps: [
        `Divide both numerator and denominator by n²:`,
        `(${a} + ${b}/n) / (${c} + ${d}/n²).`,
        `As n → ∞, ${b}/n → 0 and ${d}/n² → 0.`,
        `The limit simplifies to ${a} / ${c} = ${k}.`
      ]
    };
  } else {
    // Arithmetic series: S_n = n/2 * (2*a1 + (n-1)*d)
    const a1 = randomInt(2, 5);
    const d = randomInt(2, 4);
    const n = 10;
    const ans = (n / 2) * (2 * a1 + (n - 1) * d);

    return {
      id,
      levelNumber: 5,
      topic: "Sequences & Series",
      questionText: `Calculate the sum of the first ${n} terms of the arithmetic progression with first term a₁ = ${a1} and common difference d = ${d}:`,
      mathExpression: `a_1 = ${a1}, \\quad d = ${d}, \\quad S_{${n}} = \\sum_{i=1}^{${n}} a_i`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `S_${n}=${ans}`, `S=${ans}`],
      hints: [
        { level: 1, text: `Use the arithmetic sum formula: Sₙ = (n / 2) · [2a₁ + (n - 1)d].` },
        { level: 2, text: `Substitute n = ${n}, a₁ = ${a1}, d = ${d}: (${n}/2) · [2(${a1}) + (${n - 1})(${d})].` }
      ],
      solutionSteps: [
        `Formula for the sum of an arithmetic sequence: Sₙ = (n / 2) · [2a₁ + (n - 1)d].`,
        `Substitute: n = ${n}, a₁ = ${a1}, d = ${d}.`,
        `S_{${n}} = (${n} / 2) · [2(${a1}) + (${n - 1})(${d})] = 5 · [${2 * a1} + ${9 * d}] = 5 · [${2 * a1 + 9 * d}] = ${ans}.`
      ]
    };
  }
}

/**
 * Level 7: Multivariable Calculus
 * Topics: Partial Derivatives (fx, fy), Gradient Vector magnitude, Mixed Partial Derivatives
 */
export function generateLevel7Question(): PracticeQuestion {
  const templates = ["partial_fx", "partial_fy", "gradient_squared_norm", "mixed_partials"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl7_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "partial_fx") {
    // f(x, y) = a*x^2*y + b*x*y^2 - c*x
    // fx = 2*a*x*y + b*y^2 - c
    const a = randomInt(2, 4);
    const b = randomInt(2, 3);
    const c = randomInt(1, 5);
    const x0 = 2;
    const y0 = 1;
    const fx = 2 * a * x0 * y0 + b * (y0 ** 2) - c;

    return {
      id,
      levelNumber: 7,
      topic: "Multivariable Calculus",
      questionText: `For the multivariable function f(x, y) = ${a}x²y + ${b}xy² - ${c}x, evaluate the partial derivative ∂f/∂x at the point (2, 1):`,
      mathExpression: `f(x, y) = ${a}x^2 y + ${b}x y^2 - ${c}x, \\quad \\text{evaluate } \\frac{\\partial f}{\\partial x}(2, 1)`,
      correctAnswer: fx.toString(),
      acceptedAnswers: [fx.toString(), `fx=${fx}`],
      hints: [
        { level: 1, text: `To find ∂f/∂x, treat y as a constant and differentiate with respect to x.` },
        { level: 2, text: `∂f/∂x = ${2 * a}xy + ${b}y² - ${c}. Substitute x = 2 and y = 1.` }
      ],
      solutionSteps: [
        `Treat y as a constant and take the derivative with respect to x:`,
        `∂/∂x [${a}x²y] = ${2 * a}xy.`,
        `∂/∂x [${b}xy²] = ${b}y².`,
        `∂/∂x [-${c}x] = -${c}.`,
        `∂f/∂x = ${2 * a}xy + ${b}y² - ${c}.`,
        `Substitute x = 2, y = 1: ${2 * a}(2)(1) + ${b}(1²) - ${c} = ${4 * a} + ${b} - ${c} = ${fx}.`
      ]
    };
  } else if (type === "partial_fy") {
    // f(x, y) = a*x^3*y^2 - b*y
    // fy = 2*a*x^3*y - b
    const a = randomInt(1, 3);
    const b = randomInt(2, 6);
    const x0 = 1;
    const y0 = 2;
    const fy = 2 * a * (x0 ** 3) * y0 - b;

    return {
      id,
      levelNumber: 7,
      topic: "Multivariable Calculus",
      questionText: `Given f(x, y) = ${a}x³y² - ${b}y, evaluate the partial derivative ∂f/∂y at the point (1, 2):`,
      mathExpression: `f(x, y) = ${a}x^3 y^2 - ${b}y, \\quad \\text{evaluate } \\frac{\\partial f}{\\partial y}(1, 2)`,
      correctAnswer: fy.toString(),
      acceptedAnswers: [fy.toString(), `fy=${fy}`],
      hints: [
        { level: 1, text: `Treat x as a constant and differentiate with respect to y.` },
        { level: 2, text: `∂f/∂y = 2·${a}x³y - ${b} = ${2 * a}x³y - ${b}. Substitute x = 1 and y = 2.` }
      ],
      solutionSteps: [
        `Treat x as a constant and differentiate with respect to y:`,
        `∂/∂y [${a}x³y²] = ${2 * a}x³y.`,
        `∂/∂y [-${b}y] = -${b}.`,
        `∂f/∂y = ${2 * a}x³y - ${b}.`,
        `Substitute (1, 2): ${2 * a}(1³)(2) - ${b} = ${4 * a} - ${b} = ${fy}.`
      ]
    };
  } else if (type === "gradient_squared_norm") {
    // f(x, y) = a*x^2 + b*y^2
    // grad f = (2ax, 2by)
    // At (1, 1): grad f = (2a, 2b)
    // ||grad f||^2 = (2a)^2 + (2b)^2 = 4(a^2 + b^2)
    const a = randomInt(2, 4);
    const b = randomInt(1, 3);
    const normSq = ((2 * a) ** 2) + ((2 * b) ** 2);

    return {
      id,
      levelNumber: 7,
      topic: "Multivariable Calculus",
      questionText: `For f(x, y) = ${a}x² + ${b}y², find the squared Euclidean norm of the gradient vector, ‖∇f(1, 1)‖²:`,
      mathExpression: `f(x, y) = ${a}x^2 + ${b}y^2, \\quad \\text{find } \\|\\nabla f(1, 1)\\|^2`,
      correctAnswer: normSq.toString(),
      acceptedAnswers: [normSq.toString()],
      hints: [
        { level: 1, text: `The gradient vector is ∇f = (∂f/∂x, ∂f/∂y). Compute each component at (1, 1).` },
        { level: 2, text: `∂f/∂x = ${2 * a}x (which is ${2 * a} at x=1), and ∂f/∂y = ${2 * b}y (which is ${2 * b} at y=1). Then compute (${2 * a})² + (${2 * b})².` }
      ],
      solutionSteps: [
        `Compute the components of the gradient:`,
        `∂f/∂x = 2·${a}x = ${2 * a}x. At (1, 1), ∂f/∂x = ${2 * a}.`,
        `∂f/∂y = 2·${b}y = ${2 * b}y. At (1, 1), ∂f/∂y = ${2 * b}.`,
        `∇f(1, 1) = (${2 * a}, ${2 * b}).`,
        `The squared magnitude is ‖∇f‖² = (${2 * a})² + (${2 * b})² = ${(2 * a) ** 2} + ${(2 * b) ** 2} = ${normSq}.`
      ]
    };
  } else {
    // Clairaut's theorem: f_xy
    // f(x, y) = a*x^2*y^3
    // fx = 2ax y^3 => fxy = 6ax y^2
    const a = randomInt(2, 4);
    const x0 = 1;
    const y0 = 2;
    const fxy = 6 * a * x0 * (y0 ** 2);

    return {
      id,
      levelNumber: 7,
      topic: "Multivariable Calculus",
      questionText: `Compute the second-order mixed partial derivative f_xy(1, 2) = ∂²f/(∂y ∂x) for f(x, y) = ${a}x²y³:`,
      mathExpression: `f(x, y) = ${a}x^2 y^3, \\quad \\text{evaluate } \\frac{\\partial^2 f}{\\partial y \\partial x}(1, 2)`,
      correctAnswer: fxy.toString(),
      acceptedAnswers: [fxy.toString()],
      hints: [
        { level: 1, text: `First differentiate with respect to x: ∂f/∂x = ${2 * a}xy³. Then differentiate that result with respect to y.` },
        { level: 2, text: `∂/∂y [${2 * a}xy³] = 3 · (${2 * a})xy² = ${6 * a}xy². Substitute x = 1, y = 2.` }
      ],
      solutionSteps: [
        `First compute ∂f/∂x: ∂/∂x [${a}x²y³] = ${2 * a}xy³.`,
        `Next differentiate the result with respect to y: ∂²f/(∂y ∂x) = ∂/∂y [${2 * a}xy³] = ${6 * a}xy².`,
        `Substitute (1, 2): ${6 * a}(1)(2²) = ${6 * a} · 4 = ${fxy}.`
      ]
    };
  }
}
