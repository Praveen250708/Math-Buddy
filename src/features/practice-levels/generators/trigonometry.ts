import { PracticeQuestion } from "../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function nCr(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  return factorial(n) / (factorial(r) * factorial(n - r));
}

function nPr(n: number, r: number): number {
  if (r < 0 || r > n) return 0;
  return factorial(n) / factorial(n - r);
}

/**
 * Level 9: College Probability & Combinatorics
 * Topics: Combinations, Permutations, Expected Value of Random Variable, Conditional Probability
 */
export function generateLevel9Question(): PracticeQuestion {
  const templates = ["combinations_ncr", "permutations_npr", "expected_value", "independent_probability"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl9_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "combinations_ncr") {
    // C(n, r)
    const n = randomInt(6, 9);
    const r = randomInt(2, 3);
    const ans = nCr(n, r);

    return {
      id,
      levelNumber: 9,
      topic: "Probability & Combinatorics",
      questionText: `In how many different ways can a committee of ${r} members be chosen from a group of ${n} candidates, i.e., calculate C(${n}, ${r}) = (${n} choose ${r})?`,
      mathExpression: `\\binom{${n}}{${r}} = \\frac{${n}!}{${r}!(${n}-${r})!}`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `C(${n},${r})=${ans}`],
      hints: [
        { level: 1, text: `Use the combination formula: nCr = n! / [r! · (n - r)!]. Order does not matter.` },
        { level: 2, text: `Numerator is ${Array.from({ length: r }, (_, i) => n - i).join(" × ")}, and denominator is ${Array.from({ length: r }, (_, i) => r - i).join(" × ")}.` }
      ],
      solutionSteps: [
        `Formula: C(n, r) = n! / [r! · (n - r)!].`,
        `Substitute n = ${n}, r = ${r}: C(${n}, ${r}) = ${n}! / [${r}! · ${n - r}!].`,
        `Cancel (${n - r})!: (${Array.from({ length: r }, (_, i) => n - i).join(" × ")}) / (${Array.from({ length: r }, (_, i) => r - i).join(" × ")}).`,
        `C(${n}, ${r}) = ${ans}.`
      ]
    };
  } else if (type === "permutations_npr") {
    // P(n, r)
    const n = randomInt(5, 7);
    const r = randomInt(2, 3);
    const ans = nPr(n, r);

    return {
      id,
      levelNumber: 9,
      topic: "Probability & Combinatorics",
      questionText: `Calculate the number of ordered permutations P(${n}, ${r}) of selecting ${r} distinct items from ${n} total items:`,
      mathExpression: `P(${n}, ${r}) = \\frac{${n}!}{(${n}-${r})!}`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `P(${n},${r})=${ans}`],
      hints: [
        { level: 1, text: `For permutations, order matters: P(n, r) = n! / (n - r)! = n × (n - 1) × ... for r factors.` },
        { level: 2, text: `Multiply ${Array.from({ length: r }, (_, i) => n - i).join(" × ")}.` }
      ],
      solutionSteps: [
        `Formula: P(n, r) = n! / (n - r)!.`,
        `Substitute: P(${n}, ${r}) = ${n}! / (${n} - ${r})! = ${n}! / ${n - r}!.`,
        `Product of ${r} terms: ${Array.from({ length: r }, (_, i) => n - i).join(" × ")}.`,
        `P(${n}, ${r}) = ${ans}.`
      ]
    };
  } else if (type === "expected_value") {
    // Discrete random variable X:
    // P(X = x1) = 0.5, P(X = x2) = 0.3, P(X = x3) = 0.2
    // E[X] = 0.5*x1 + 0.3*x2 + 0.2*x3
    // Choose values to make E[X] an integer:
    // 0.5*(2) + 0.3*(10) + 0.2*(15) = 1 + 3 + 3 = 7
    const factor = randomInt(1, 3);
    const x1 = 2 * factor;
    const x2 = 10 * factor;
    const x3 = 15 * factor;
    const expVal = 0.5 * x1 + 0.3 * x2 + 0.2 * x3;

    return {
      id,
      levelNumber: 9,
      topic: "Probability & Combinatorics",
      questionText: `A discrete random variable X has probability distribution P(X = ${x1}) = 0.5, P(X = ${x2}) = 0.3, and P(X = ${x3}) = 0.2. Calculate the expected value E[X]:`,
      mathExpression: `E[X] = \\sum_{i} x_i \\cdot P(X = x_i)`,
      correctAnswer: expVal.toString(),
      acceptedAnswers: [expVal.toString(), `E[X]=${expVal}`],
      hints: [
        { level: 1, text: `The expected value is the weighted sum: E[X] = x₁P(x₁) + x₂P(x₂) + x₃P(x₃).` },
        { level: 2, text: `Compute (${x1})(0.5) + (${x2})(0.3) + (${x3})(0.2).` }
      ],
      solutionSteps: [
        `Formula: E[X] = ∑ xᵢ P(X = xᵢ).`,
        `Term 1: ${x1} × 0.5 = ${x1 * 0.5}.`,
        `Term 2: ${x2} × 0.3 = ${x2 * 0.3}.`,
        `Term 3: ${x3} × 0.2 = ${x3 * 0.2}.`,
        `Sum: ${x1 * 0.5} + ${x2 * 0.3} + ${x3 * 0.2} = ${expVal}.`
      ]
    };
  } else {
    // Two independent events A and B. P(A) = 1/2, P(B) = 1/k. Find 1 / P(A and B) = 2k
    const k = randomInt(3, 8);
    const ans = 2 * k;

    return {
      id,
      levelNumber: 9,
      topic: "Probability & Combinatorics",
      questionText: `Events A and B are independent with P(A) = 1/2 and P(B) = 1/${k}. What is the denominator of P(A ∩ B) in simplest fractional form 1/D? (i.e. find D):`,
      mathExpression: `P(A) = \\frac{1}{2}, \\quad P(B) = \\frac{1}{${k}}, \\quad P(A \\cap B) = \\frac{1}{D}`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `D=${ans}`],
      hints: [
        { level: 1, text: `For independent events: P(A ∩ B) = P(A) × P(B).` },
        { level: 2, text: `Multiply (1/2) × (1/${k}) = 1/${2 * k}. The denominator D is ${2 * k}.` }
      ],
      solutionSteps: [
        `Since A and B are independent, P(A ∩ B) = P(A) · P(B).`,
        `P(A ∩ B) = (1/2) · (1/${k}) = 1 / (${2 * k}).`,
        `The denominator D is ${ans}.`
      ]
    };
  }
}
