import { PracticeQuestion } from "../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Level 3: Single-Variable Differential Calculus
 * Topics: Power rule, Product rule, Chain rule, Equation of tangent line
 */
export function generateLevel3Question(): PracticeQuestion {
  const templates = ["polynomial_derivative_eval", "product_rule_zero", "chain_rule_power", "tangent_slope"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl3_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "polynomial_derivative_eval") {
    // f(x) = a*x^3 - b*x^2 + c*x - d, find f'(xVal)
    const a = randomInt(2, 4);
    const b = randomInt(2, 5);
    const c = randomInt(1, 8);
    const d = randomInt(1, 10);
    const xVal = randomInt(1, 3);

    // f'(x) = 3ax^2 - 2bx + c
    const ans = 3 * a * (xVal ** 2) - 2 * b * xVal + c;

    return {
      id,
      levelNumber: 3,
      topic: "Differential Calculus",
      questionText: `For f(x) = ${a}x³ - ${b}x² + ${c}x - ${d}, evaluate the derivative at x = ${xVal}, i.e., f'(${xVal}):`,
      mathExpression: `f(x) = ${a}x^3 - ${b}x^2 + ${c}x - ${d}, \\quad \\text{find } f'(${xVal})`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `f'(${xVal})=${ans}`],
      hints: [
        { level: 1, text: `Apply the power rule d/dx[xⁿ] = n·xⁿ⁻¹ term by term.` },
        { level: 2, text: `f'(x) = ${3 * a}x² - ${2 * b}x + ${c}. Substitute x = ${xVal}.` }
      ],
      solutionSteps: [
        `Differentiate term-by-term using the power rule:`,
        `d/dx[${a}x³] = ${3 * a}x².`,
        `d/dx[-${b}x²] = -${2 * b}x.`,
        `d/dx[${c}x] = ${c}, and d/dx[-${d}] = 0.`,
        `f'(x) = ${3 * a}x² - ${2 * b}x + ${c}.`,
        `Substitute x = ${xVal}: f'(${xVal}) = ${3 * a}(${xVal})² - ${2 * b}(${xVal}) + ${c} = ${3 * a * (xVal ** 2)} - ${2 * b * xVal} + ${c} = ${ans}.`
      ]
    };
  } else if (type === "product_rule_zero") {
    // f(x) = (ax + b) * e^(kx), evaluate f'(0)
    // f'(x) = a*e^(kx) + (ax + b)*k*e^(kx)
    // f'(0) = a*1 + b*k*1 = a + b*k
    const a = randomInt(2, 6);
    const b = randomInt(2, 5);
    const k = randomInt(1, 4);
    const ans = a + b * k;

    return {
      id,
      levelNumber: 3,
      topic: "Differential Calculus",
      questionText: `Use the product rule to evaluate f'(0) for the function f(x) = (${a}x + ${b})e^{${k}x}:`,
      mathExpression: `f(x) = (${a}x + ${b})e^{${k}x}, \\quad \\text{evaluate } f'(0)`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `f'(0)=${ans}`],
      hints: [
        { level: 1, text: `Product rule: (u·v)' = u'·v + u·v'. Let u = ${a}x + ${b} and v = e^{${k}x}.` },
        { level: 2, text: `u' = ${a}, v' = ${k}e^{${k}x}. At x = 0, e⁰ = 1.` }
      ],
      solutionSteps: [
        `Let u(x) = ${a}x + ${b} and v(x) = e^{${k}x}.`,
        `Compute derivatives: u'(x) = ${a}, and v'(x) = ${k}e^{${k}x}.`,
        `Apply product rule: f'(x) = ${a}e^{${k}x} + (${a}x + ${b})(${k}e^{${k}x}).`,
        `Evaluate at x = 0 (since e⁰ = 1): f'(0) = ${a}(1) + (${b})(${k})(1) = ${a} + ${b * k} = ${ans}.`
      ]
    };
  } else if (type === "chain_rule_power") {
    // f(x) = (ax + b)^3, find f'(1)
    const a = randomInt(2, 4);
    const b = randomInt(1, 3);
    const ans = 3 * a * ((a * 1 + b) ** 2);

    return {
      id,
      levelNumber: 3,
      topic: "Differential Calculus",
      questionText: `Using the chain rule, find the value of f'(1) for f(x) = (${a}x + ${b})³:`,
      mathExpression: `f(x) = (${a}x + ${b})^3, \\quad \\text{find } f'(1)`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `f'(1)=${ans}`],
      hints: [
        { level: 1, text: `Chain rule: d/dx[g(x)³] = 3[g(x)]² · g'(x).` },
        { level: 2, text: `g(x) = ${a}x + ${b} with g'(x) = ${a}. So f'(x) = 3(${a}x + ${b})² · (${a}). Substitute x = 1.` }
      ],
      solutionSteps: [
        `Identify inner function u = ${a}x + ${b} and outer function y = u³.`,
        `By the chain rule: dy/dx = 3u² · (du/dx) = 3(${a}x + ${b})² · (${a}) = ${3 * a}(${a}x + ${b})².`,
        `Evaluate at x = 1: f'(1) = ${3 * a}(${a}(1) + ${b})² = ${3 * a}(${a + b})² = ${ans}.`
      ]
    };
  } else {
    // Slope of tangent line: f(x) = a*x^2 + b*x at x = x0
    const a = randomInt(2, 5);
    const b = randomInt(1, 7);
    const x0 = randomInt(2, 4);
    const slope = 2 * a * x0 + b;

    return {
      id,
      levelNumber: 3,
      topic: "Differential Calculus",
      questionText: `Find the slope (m) of the tangent line to the curve y = ${a}x² + ${b}x at the point where x = ${x0}:`,
      mathExpression: `y = ${a}x^2 + ${b}x, \\quad \\text{slope } m \\text{ at } x = ${x0}`,
      correctAnswer: slope.toString(),
      acceptedAnswers: [slope.toString(), `m=${slope}`],
      hints: [
        { level: 1, text: `The slope of the tangent line is given by the derivative m = dy/dx evaluated at x = ${x0}.` },
        { level: 2, text: `dy/dx = ${2 * a}x + ${b}. Substitute x = ${x0}.` }
      ],
      solutionSteps: [
        `Compute the first derivative: dy/dx = d/dx[${a}x² + ${b}x] = ${2 * a}x + ${b}.`,
        `Substitute x = ${x0}: m = ${2 * a}(${x0}) + ${b} = ${2 * a * x0} + ${b} = ${slope}.`,
        `The slope of the tangent line is m = ${slope}.`
      ]
    };
  }
}

/**
 * Level 4: Integral Calculus & Techniques
 * Topics: Definite Integrals of Polynomials, Substitution (u-sub), Exponential Integrals, Integration by Parts
 */
export function generateLevel4Question(): PracticeQuestion {
  const templates = ["definite_integral_poly", "u_sub_definite", "exponential_integral", "by_parts_eval"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl4_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "definite_integral_poly") {
    // int_0^b (3*a*x^2 + 2*c*x) dx = [a*x^3 + c*x^2]_0^b = a*b^3 + c*b^2
    const a = randomInt(1, 3);
    const c = randomInt(1, 4);
    const upper = randomInt(2, 3);

    const coeff1 = 3 * a;
    const coeff2 = 2 * c;
    const ans = a * (upper ** 3) + c * (upper ** 2);

    return {
      id,
      levelNumber: 4,
      topic: "Integral Calculus",
      questionText: `Evaluate the definite integral: ∫₀^{${upper}} (${coeff1}x² + ${coeff2}x) dx:`,
      mathExpression: `\\int_{0}^{${upper}} (${coeff1}x^2 + ${coeff2}x) \\, dx`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString()],
      hints: [
        { level: 1, text: `Find the antiderivative using power rule for integration: ∫ xⁿ dx = xⁿ⁺¹ / (n + 1).` },
        { level: 2, text: `The antiderivative is ${a}x³ + ${c}x². Evaluate between 0 and ${upper}: [${a}(${upper})³ + ${c}(${upper})²] - 0.` }
      ],
      solutionSteps: [
        `Find the antiderivative F(x): ∫ (${coeff1}x² + ${coeff2}x) dx = (${coeff1}/3)x³ + (${coeff2}/2)x² = ${a}x³ + ${c}x².`,
        `Apply the Fundamental Theorem of Calculus: F(${upper}) - F(0).`,
        `F(${upper}) = ${a}(${upper}³) + ${c}(${upper}²) = ${a * (upper ** 3)} + ${c * (upper ** 2)} = ${ans}.`,
        `F(0) = 0. Result = ${ans}.`
      ]
    };
  } else if (type === "u_sub_definite") {
    // int_0^1 2x * (x^2 + 1)^2 dx
    // Let u = x^2 + 1, du = 2x dx. When x=0 => u=1; x=1 => u=2.
    // int_1^2 u^2 du = [u^3 / 3]_1^2 = (8 - 1)/3 = 7/3 (or power 1 for clean int)
    // Let's use 2x(x^2 + k) dx => [ (x^2 + k)^2 / 2 ]_0^1
    const k = randomInt(1, 4);
    // int_0^1 (2x)(x^2 + k) dx = [ (x^2 + k)^2 / 2 ]_0^1
    // At x=1: (1 + k)^2 / 2. At x=0: k^2 / 2.
    // Difference: ((1+k)^2 - k^2) / 2 = (1 + 2k + k^2 - k^2) / 2 = (2k + 1)/2. To make integer, use 4x:
    // int_0^1 4x(x^2 + k) dx = 2 * (2k + 1) = 4k + 2!
    const ans = 4 * k + 2;

    return {
      id,
      levelNumber: 4,
      topic: "Integral Calculus",
      questionText: `Using u-substitution, evaluate the definite integral: ∫₀¹ 4x(x² + ${k}) dx:`,
      mathExpression: `\\int_{0}^{1} 4x(x^2 + ${k}) \\, dx`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString()],
      hints: [
        { level: 1, text: `Substitute u = x² + ${k}. Then du = 2x dx, so 4x dx = 2 du.` },
        { level: 2, text: `Change the bounds: when x = 0, u = ${k}; when x = 1, u = ${1 + k}. Evaluate ∫_{${k}}^{${1 + k}} 2u du.` }
      ],
      solutionSteps: [
        `Let u = x² + ${k}. Taking differentials: du = 2x dx, which means 4x dx = 2 du.`,
        `Update limits of integration:`,
        `Lower limit (x = 0): u = 0² + ${k} = ${k}.`,
        `Upper limit (x = 1): u = 1² + ${k} = ${1 + k}.`,
        `Integral becomes: ∫_{${k}}^{${1 + k}} 2u du = [u²]_{${k}}^{${1 + k}}.`,
        `Evaluate: (${1 + k})² - (${k})² = ${((1 + k) ** 2) - (k ** 2)} = ${ans}.`
      ]
    };
  } else if (type === "exponential_integral") {
    // int_0^ln(k) e^(x) dx = e^(ln k) - e^0 = k - 1
    const k = randomInt(3, 9);
    const ans = k - 1;

    return {
      id,
      levelNumber: 4,
      topic: "Integral Calculus",
      questionText: `Evaluate the definite integral: ∫₀^{ln(${k})} e^{x} dx:`,
      mathExpression: `\\int_{0}^{\\ln(${k})} e^{x} \\, dx`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString()],
      hints: [
        { level: 1, text: `The antiderivative of eˣ is eˣ.` },
        { level: 2, text: `Evaluate e^{ln(${k})} - e⁰. Recall that e^{ln(a)} = a and e⁰ = 1.` }
      ],
      solutionSteps: [
        `Find the antiderivative: ∫ eˣ dx = eˣ.`,
        `Apply limits: [eˣ]_{0}^{\\ln(${k})} = e^{\\ln(${k})} - e⁰.`,
        `Since e^{\\ln(${k})} = ${k} and e⁰ = 1, we get: ${k} - 1 = ${ans}.`
      ]
    };
  } else {
    // By parts: int_0^1 x * e^x dx = [x*e^x - e^x]_0^1 = (e - e) - (0 - 1) = 1!
    // Or for c * x * e^x: c * 1 = c
    const c = randomInt(2, 6);
    const ans = c;

    return {
      id,
      levelNumber: 4,
      topic: "Integral Calculus",
      questionText: `Using integration by parts (∫ u dv = uv - ∫ v du), evaluate: ∫₀¹ ${c}x e^{x} dx:`,
      mathExpression: `\\int_{0}^{1} ${c}x e^x \\, dx`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString()],
      hints: [
        { level: 1, text: `Set u = ${c}x and dv = eˣ dx. Then du = ${c} dx and v = eˣ.` },
        { level: 2, text: `∫ ${c}x eˣ dx = ${c}x eˣ - ∫ ${c}eˣ dx = ${c}(x - 1)eˣ. Evaluate at 1 and 0.` }
      ],
      solutionSteps: [
        `Let u = ${c}x and dv = eˣ dx.`,
        `Then du = ${c} dx and v = eˣ.`,
        `Using integration by parts: ∫ ${c}x eˣ dx = ${c}x eˣ - ∫ ${c}eˣ dx = ${c}x eˣ - ${c}eˣ = ${c}(x - 1)eˣ.`,
        `Evaluate limits: at x = 1: ${c}(1 - 1)e¹ = 0.`,
        `At x = 0: ${c}(0 - 1)e⁰ = -${c}(1) = -${c}.`,
        `Result = 0 - (-${c}) = ${ans}.`
      ]
    };
  }
}
