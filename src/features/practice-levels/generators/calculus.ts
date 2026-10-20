import { PracticeQuestion } from "../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Level 10: Complex Analysis & Transforms
 * Topics: Complex Modulus, Multiplication & Real Part, Euler's Formula, Laplace Transforms
 */
export function generateLevel10Question(): PracticeQuestion {
  const templates = ["complex_modulus_squared", "complex_product_real", "euler_formula_eval", "laplace_transform_eval"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl10_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "complex_modulus_squared") {
    // |z|^2 = a^2 + b^2
    const a = randomInt(3, 7);
    const b = randomInt(2, 6);
    const modSq = (a ** 2) + (b ** 2);

    return {
      id,
      levelNumber: 10,
      topic: "Complex Analysis & Transforms",
      questionText: `Find the squared modulus |z|² of the complex number z = ${a} + ${b}i (where i² = -1):`,
      mathExpression: `z = ${a} + ${b}i, \\quad |z|^2 = z \\bar{z} = ?`,
      correctAnswer: modSq.toString(),
      acceptedAnswers: [modSq.toString(), `|z|^2=${modSq}`],
      hints: [
        { level: 1, text: `The squared modulus of z = a + bi is given by |z|² = a² + b².` },
        { level: 2, text: `Compute (${a})² + (${b})² = ${a ** 2} + ${b ** 2}.` }
      ],
      solutionSteps: [
        `For a complex number z = a + bi, the modulus is |z| = √(a² + b²).`,
        `The squared modulus is |z|² = a² + b².`,
        `Substitute: (${a})² + (${b})² = ${a ** 2} + ${b ** 2} = ${modSq}.`
      ]
    };
  } else if (type === "complex_product_real") {
    // (a + bi)(c + di) = (ac - bd) + (ad + bc)i. Find Re
    const a = randomInt(2, 5);
    const b = randomInt(2, 4);
    const c = randomInt(3, 6);
    const d = randomInt(1, 4);
    const realPart = a * c - b * d;

    return {
      id,
      levelNumber: 10,
      topic: "Complex Analysis & Transforms",
      questionText: `Evaluate the real part, Re(z), of the product z = (${a} + ${b}i)(${c} + ${d}i):`,
      mathExpression: `z = (${a} + ${b}i)(${c} + ${d}i), \\quad \\text{Re}(z) = ?`,
      correctAnswer: realPart.toString(),
      acceptedAnswers: [realPart.toString(), `Re(z)=${realPart}`],
      hints: [
        { level: 1, text: `Expand using FOIL: (${a})(${c}) + (${a})(${d}i) + (${b}i)(${c}) + (${b}i)(${d}i).` },
        { level: 2, text: `Since i² = -1, the real part is ac - bd = (${a})(${c}) - (${b})(${d}).` }
      ],
      solutionSteps: [
        `Expand the product: (${a} + ${b}i)(${c} + ${d}i) = ${a * c} + ${a * d}i + ${b * c}i + ${b * d}i².`,
        `Replace i² with -1: ${a * c} + ${a * d}i + ${b * c}i - ${b * d}.`,
        `Combine real terms: ${a * c} - ${b * d} = ${realPart}.`,
        `Re(z) = ${realPart}.`
      ]
    };
  } else if (type === "euler_formula_eval") {
    // e^(i * pi) = -1 or e^(i * 2*pi) = 1
    const isPi = Math.random() > 0.5;
    const thetaStr = isPi ? "\\pi" : "2\\pi";
    const ans = isPi ? "-1" : "1";

    return {
      id,
      levelNumber: 10,
      topic: "Complex Analysis & Transforms",
      questionText: `Evaluate Euler's formula identity e^{i ${isPi ? "π" : "2π"}}:`,
      mathExpression: `e^{i ${thetaStr}} = \\cos(${thetaStr}) + i \\sin(${thetaStr})`,
      correctAnswer: ans,
      acceptedAnswers: [ans],
      hints: [
        { level: 1, text: `Apply Euler's formula: e^{iθ} = cos(θ) + i sin(θ).` },
        { level: 2, text: `Substitute θ = ${isPi ? "π" : "2π"}. Recall cos(${isPi ? "π" : "2π"}) = ${ans} and sin(${isPi ? "π" : "2π"}) = 0.` }
      ],
      solutionSteps: [
        `Euler's formula states: e^{iθ} = cos(θ) + i sin(θ).`,
        `For θ = ${isPi ? "π" : "2π"}: cos(${isPi ? "π" : "2π"}) = ${ans} and sin(${isPi ? "π" : "2π"}) = 0.`,
        `e^{i ${isPi ? "π" : "2π"}} = ${ans} + 0i = ${ans}.`
      ]
    };
  } else {
    // Laplace transform of e^(at): L{e^(at)} = 1 / (s - a)
    // Find the value of L{e^(at)} at s = a + k => 1 / k => denominator is k
    const a = randomInt(2, 5);
    const k = randomInt(2, 6);
    const sVal = a + k;

    return {
      id,
      levelNumber: 10,
      topic: "Complex Analysis & Transforms",
      questionText: `The Laplace transform of f(t) = e^{${a}t} is F(s) = 1/(s - ${a}). What is the reciprocal 1/F(${sVal})? (i.e. find s - ${a} when s = ${sVal}):`,
      mathExpression: `\\mathcal{L}\\{e^{${a}t}\\} = \\frac{1}{s - ${a}}, \\quad \\text{evaluate } s - ${a} \\text{ at } s = ${sVal}`,
      correctAnswer: k.toString(),
      acceptedAnswers: [k.toString()],
      hints: [
        { level: 1, text: `F(s) = 1 / (s - ${a}). Its reciprocal is 1/F(s) = s - ${a}.` },
        { level: 2, text: `Substitute s = ${sVal}: ${sVal} - ${a} = ${k}.` }
      ],
      solutionSteps: [
        `The standard Laplace transform is L{e^{at}} = 1 / (s - a) for s > a.`,
        `Here a = ${a}, so F(s) = 1 / (s - ${a}).`,
        `The reciprocal is 1/F(s) = s - ${a}.`,
        `Evaluating at s = ${sVal} yields: ${sVal} - ${a} = ${k}.`
      ]
    };
  }
}
