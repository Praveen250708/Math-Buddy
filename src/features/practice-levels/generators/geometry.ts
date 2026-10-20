import { PracticeQuestion } from "../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Level 8: Differential Equations
 * Topics: First-order separable ODEs, Integrating Factors, 2nd-Order Characteristic Roots, Initial Value Problems
 */
export function generateLevel8Question(): PracticeQuestion {
  const templates = ["characteristic_roots_ode", "separable_growth_ivp", "integrating_factor", "first_order_ivp"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl8_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "characteristic_roots_ode") {
    // y'' - (r1 + r2)y' + r1*r2 y = 0
    const r1 = randomInt(1, 4);
    let r2 = randomInt(2, 6);
    if (r1 === r2) r2 += 1;
    const b = -(r1 + r2);
    const c = r1 * r2;
    const bSign = b >= 0 ? `+ ${b}y'` : `- ${Math.abs(b)}y'`;
    const cSign = c >= 0 ? `+ ${c}y` : `- ${Math.abs(c)}y`;
    const ans = `${Math.min(r1, r2)}, ${Math.max(r1, r2)}`;

    return {
      id,
      levelNumber: 8,
      topic: "Differential Equations",
      questionText: `Find the roots of the characteristic equation for the second-order ODE: y'' ${bSign} ${cSign} = 0 (Enter separated by comma, e.g. "2, 3"):`,
      mathExpression: `y'' ${bSign} ${cSign} = 0, \\quad r^2 ${bSign.replace("y'", "r")} ${cSign.replace("y", "")} = 0`,
      correctAnswer: ans,
      acceptedAnswers: [
        ans,
        `${Math.max(r1, r2)}, ${Math.min(r1, r2)}`,
        `r=${Math.min(r1, r2)}, ${Math.max(r1, r2)}`,
        `r = ${Math.min(r1, r2)}, r = ${Math.max(r1, r2)}`
      ],
      hints: [
        { level: 1, text: `Substitute y = e^{rx} to obtain the characteristic polynomial: r² - ${r1 + r2}r + ${c} = 0.` },
        { level: 2, text: `Factor into (r - ${r1})(r - ${r2}) = 0.` }
      ],
      solutionSteps: [
        `Assume a solution of the form y = e^{rx}. Then y' = re^{rx} and y'' = r²e^{rx}.`,
        `Substitute into the ODE: (r² - ${r1 + r2}r + ${c})e^{rx} = 0.`,
        `Since e^{rx} ≠ 0, solve the characteristic equation: r² - ${r1 + r2}r + ${c} = 0.`,
        `Factor: (r - ${r1})(r - ${r2}) = 0.`,
        `The characteristic roots are r = ${Math.min(r1, r2)} and r = ${Math.max(r1, r2)}.`
      ]
    };
  } else if (type === "separable_growth_ivp") {
    // dy/dx = a * x with y(0) = c. Find y(x0).
    // y = (a/2)x^2 + c
    const aHalf = randomInt(1, 3);
    const a = 2 * aHalf; // ensures a/2 is integer
    const c = randomInt(2, 6);
    const x0 = randomInt(2, 4);
    const ans = aHalf * (x0 ** 2) + c;

    return {
      id,
      levelNumber: 8,
      topic: "Differential Equations",
      questionText: `Solve the initial value problem (IVP): dy/dx = ${a}x with initial condition y(0) = ${c}. Find y(${x0}):`,
      mathExpression: `\\frac{dy}{dx} = ${a}x, \\quad y(0) = ${c}, \\quad y(${x0}) = ?`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `y(${x0})=${ans}`],
      hints: [
        { level: 1, text: `Separate variables or integrate both sides with respect to x: y(x) = ∫ ${a}x dx = (${a}/2)x² + C.` },
        { level: 2, text: `Use y(0) = ${c} to find C = ${c}. Then evaluate y(${x0}) = ${aHalf}(${x0})² + ${c}.` }
      ],
      solutionSteps: [
        `Separate variables: dy = ${a}x dx.`,
        `Integrate both sides: ∫ dy = ∫ ${a}x dx ⟹ y(x) = ${aHalf}x² + C.`,
        `Use initial condition y(0) = ${c}: y(0) = ${aHalf}(0)² + C = ${c} ⟹ C = ${c}.`,
        `Particular solution: y(x) = ${aHalf}x² + ${c}.`,
        `Evaluate at x = ${x0}: y(${x0}) = ${aHalf}(${x0}²) + ${c} = ${aHalf * (x0 ** 2)} + ${c} = ${ans}.`
      ]
    };
  } else if (type === "integrating_factor") {
    // dy/dx + P(x) y = Q(x). If P(x) = a (constant), integrating factor is e^(a*x)
    // Find the exponent coefficient of x in the integrating factor mu(x) = e^(k*x)
    const a = randomInt(2, 6);

    return {
      id,
      levelNumber: 8,
      topic: "Differential Equations",
      questionText: `For the linear first-order differential equation dy/dx + ${a}y = x, find the coefficient k in the integrating factor μ(x) = e^{kx}:`,
      mathExpression: `\\frac{dy}{dx} + ${a}y = x, \\quad \\mu(x) = e^{\\int P(x) dx} = e^{kx}`,
      correctAnswer: a.toString(),
      acceptedAnswers: [a.toString(), `k=${a}`],
      hints: [
        { level: 1, text: `The standard form is dy/dx + P(x)y = Q(x). Identify P(x).` },
        { level: 2, text: `Here P(x) = ${a}. The integrating factor is μ(x) = e^{∫ P(x) dx} = e^{∫ ${a} dx} = e^{${a}x}.` }
      ],
      solutionSteps: [
        `In standard form dy/dx + P(x)y = Q(x), we have P(x) = ${a} and Q(x) = x.`,
        `The integrating factor is defined by μ(x) = e^{∫ P(x) dx}.`,
        `Compute integral: ∫ ${a} dx = ${a}x (omitting constant of integration).`,
        `Thus μ(x) = e^{${a}x}. The coefficient k is ${a}.`
      ]
    };
  } else {
    // dy/dx = 3*x^2 - 2 with y(1) = c
    // y = x^3 - 2x + C
    // y(1) = 1 - 2 + C = C - 1 => C = y(1) + 1
    const y1 = randomInt(3, 7);
    const C = y1 + 1;
    // Find y(2) = 2^3 - 2(2) + C = 8 - 4 + C = 4 + C
    const ans = 4 + C;

    return {
      id,
      levelNumber: 8,
      topic: "Differential Equations",
      questionText: `Solve the initial value problem dy/dx = 3x² - 2 with condition y(1) = ${y1}. Evaluate y(2):`,
      mathExpression: `\\frac{dy}{dx} = 3x^2 - 2, \\quad y(1) = ${y1}, \\quad \\text{find } y(2)`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString(), `y(2)=${ans}`],
      hints: [
        { level: 1, text: `Integrate dy/dx: y(x) = ∫ (3x² - 2) dx = x³ - 2x + C.` },
        { level: 2, text: `Plug in x = 1: 1³ - 2(1) + C = ${y1} ⟹ C = ${C}. Then evaluate at x = 2.` }
      ],
      solutionSteps: [
        `Integrate: y(x) = ∫ (3x² - 2) dx = x³ - 2x + C.`,
        `Apply y(1) = ${y1}: 1³ - 2(1) + C = ${y1} ⟹ -1 + C = ${y1} ⟹ C = ${C}.`,
        `Particular solution: y(x) = x³ - 2x + ${C}.`,
        `Evaluate at x = 2: y(2) = 2³ - 2(2) + ${C} = 8 - 4 + ${C} = 4 + ${C} = ${ans}.`
      ]
    };
  }
}
