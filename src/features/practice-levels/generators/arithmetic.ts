import { PracticeQuestion } from "../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Level 1: College Algebra & Functions
 * Topics: Quadratic Roots & Factoring, Function Composition, Vertex of Parabola, Discriminants
 */
export function generateLevel1Question(): PracticeQuestion {
  const templates = ["quadratic_roots", "function_composition", "discriminant", "parabola_vertex"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl1_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "quadratic_roots") {
    // (x - r1)(x - r2) = x^2 - (r1+r2)x + r1*r2 = 0
    const r1 = randomInt(1, 6);
    let r2 = randomInt(2, 8);
    if (r1 === r2) r2 += 1;
    const b = -(r1 + r2);
    const c = r1 * r2;

    const bSign = b >= 0 ? `+ ${b}x` : `- ${Math.abs(b)}x`;
    const cSign = c >= 0 ? `+ ${c}` : `- ${Math.abs(c)}`;
    const rootsStr = `${Math.min(r1, r2)}, ${Math.max(r1, r2)}`;

    return {
      id,
      levelNumber: 1,
      topic: "College Algebra",
      questionText: `Find the real roots of the quadratic equation: x² ${bSign} ${cSign} = 0 (Enter the roots separated by a comma, e.g. "2, 3"):`,
      mathExpression: `x^2 ${bSign} ${cSign} = 0`,
      correctAnswer: rootsStr,
      acceptedAnswers: [
        rootsStr,
        `${Math.max(r1, r2)}, ${Math.min(r1, r2)}`,
        `x=${Math.min(r1, r2)}, x=${Math.max(r1, r2)}`,
        `x = ${Math.min(r1, r2)}, ${Math.max(r1, r2)}`
      ],
      hints: [
        { level: 1, text: `Look for two numbers that multiply to ${c} and add up to ${Math.abs(b)}.` },
        { level: 2, text: `Factor as (x - ${r1})(x - ${r2}) = 0. Set each factor to zero to solve for x.` }
      ],
      solutionSteps: [
        `Identify quadratic coefficients: a = 1, b = ${b}, c = ${c}.`,
        `Factor the trinomial into two linear binomials: (x - ${r1})(x - ${r2}) = 0.`,
        `By the zero-product property: x - ${r1} = 0 or x - ${r2} = 0.`,
        `The roots are x = ${Math.min(r1, r2)} and x = ${Math.max(r1, r2)}.`
      ]
    };
  } else if (type === "function_composition") {
    // f(x) = a*x + b, g(x) = c*x^2 - d, find (f o g)(x0)
    const a = randomInt(2, 4);
    const b = randomInt(1, 5);
    const c = randomInt(1, 3);
    const d = randomInt(1, 4);
    const x0 = randomInt(1, 3);

    const gx0 = c * (x0 ** 2) - d;
    const ans = a * gx0 + b;

    return {
      id,
      levelNumber: 1,
      topic: "College Algebra",
      questionText: `Given functions f(x) = ${a}x + ${b} and g(x) = ${c}x² - ${d}, evaluate the composite function (f ∘ g)(${x0}):`,
      mathExpression: `f(x) = ${a}x + ${b}, \\quad g(x) = ${c}x^2 - ${d}, \\quad \\text{evaluate } (f \\circ g)(${x0})`,
      correctAnswer: ans.toString(),
      acceptedAnswers: [ans.toString()],
      hints: [
        { level: 1, text: `By definition, (f ∘ g)(${x0}) = f(g(${x0})). First calculate the inner value g(${x0}).` },
        { level: 2, text: `Calculate g(${x0}) = ${c}(${x0})² - ${d} = ${gx0}. Then plug this value into f(x).` }
      ],
      solutionSteps: [
        `First evaluate the inner function g(${x0}): g(${x0}) = ${c}(${x0})² - ${d} = ${c * (x0 ** 2)} - ${d} = ${gx0}.`,
        `Now substitute ${gx0} into f(x): f(${gx0}) = ${a}(${gx0}) + ${b}.`,
        `f(${gx0}) = ${a * gx0} + ${b} = ${ans}.`,
        `Therefore, (f ∘ g)(${x0}) = ${ans}.`
      ]
    };
  } else if (type === "discriminant") {
    // D = b^2 - 4ac
    const a = randomInt(2, 5);
    const b = randomInt(4, 9);
    const c = randomInt(1, 4);
    const D = (b ** 2) - 4 * a * c;

    return {
      id,
      levelNumber: 1,
      topic: "College Algebra",
      questionText: `Compute the discriminant (Δ = b² - 4ac) of the quadratic equation: ${a}x² + ${b}x + ${c} = 0:`,
      mathExpression: `\\Delta = b^2 - 4ac \\quad \\text{for } ${a}x^2 + ${b}x + ${c} = 0`,
      correctAnswer: D.toString(),
      acceptedAnswers: [D.toString(), `D=${D}`, `\\Delta=${D}`],
      hints: [
        { level: 1, text: `Identify the coefficients: a = ${a}, b = ${b}, and c = ${c}.` },
        { level: 2, text: `Substitute into the discriminant formula: (${b})² - 4(${a})(${c}).` }
      ],
      solutionSteps: [
        `From ${a}x² + ${b}x + ${c} = 0, identify: a = ${a}, b = ${b}, c = ${c}.`,
        `Apply the formula: Δ = b² - 4ac.`,
        `Δ = (${b})² - 4 · (${a}) · (${c}) = ${b ** 2} - ${4 * a * c} = ${D}.`,
        `The discriminant is ${D} (${D > 0 ? "two distinct real roots" : D === 0 ? "one repeated root" : "two complex conjugate roots"}).`
      ]
    };
  } else {
    // Parabola vertex x-coordinate: x = -b / (2a)
    const a = randomInt(1, 4);
    const k = randomInt(1, 5);
    const b = -2 * a * k; // ensures x = k is an integer
    const c = randomInt(1, 10);

    return {
      id,
      levelNumber: 1,
      topic: "College Algebra",
      questionText: `Find the x-coordinate of the vertex of the parabola f(x) = ${a}x² - ${Math.abs(b)}x + ${c}:`,
      mathExpression: `f(x) = ${a}x^2 - ${Math.abs(b)}x + ${c}`,
      correctAnswer: k.toString(),
      acceptedAnswers: [k.toString(), `x=${k}`],
      hints: [
        { level: 1, text: `The x-coordinate of the vertex of f(x) = ax² + bx + c is given by x = -b / (2a).` },
        { level: 2, text: `Substitute a = ${a} and b = ${b} into x = -(${b}) / (2 · ${a}).` }
      ],
      solutionSteps: [
        `For a parabola in standard form y = ax² + bx + c, the vertex x-coordinate is x = -b / (2a).`,
        `Here a = ${a} and b = ${b}.`,
        `x = -(${b}) / (2 · ${a}) = ${-b} / ${2 * a} = ${k}.`,
        `The vertex is located at x = ${k}.`
      ]
    };
  }
}

/**
 * Level 2: Matrices & Linear Systems
 * Topics: 2x2 and 3x3 Determinants, Matrix Traces, Matrix Inverses, System of Equations
 */
export function generateLevel2Question(): PracticeQuestion {
  const templates = ["2x2_determinant", "matrix_trace", "triangular_3x3_det", "system_substitution"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl2_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "2x2_determinant") {
    // det([[a, b], [c, d]]) = ad - bc
    const a = randomInt(2, 6);
    const b = randomInt(1, 5);
    const c = randomInt(2, 6);
    const d = randomInt(3, 8);
    const det = a * d - b * c;

    return {
      id,
      levelNumber: 2,
      topic: "Matrices & Linear Systems",
      questionText: `Calculate the determinant of the 2×2 matrix A:`,
      mathExpression: `A = \\begin{pmatrix} ${a} & ${b} \\\\ ${c} & ${d} \\end{pmatrix}, \\quad \\det(A) = ?`,
      correctAnswer: det.toString(),
      acceptedAnswers: [det.toString(), `det(A)=${det}`, `|A|=${det}`],
      hints: [
        { level: 1, text: `The determinant of a 2×2 matrix [[a, b], [c, d]] is ad - bc.` },
        { level: 2, text: `Multiply main diagonal: (${a}) · (${d}) = ${a * d}. Subtract off-diagonal: (${b}) · (${c}) = ${b * c}.` }
      ],
      solutionSteps: [
        `Formula: det(A) = a₁₁ a₂₂ - a₁₂ a₂₁.`,
        `Main diagonal product: ${a} × ${d} = ${a * d}.`,
        `Off diagonal product: ${b} × ${c} = ${b * c}.`,
        `det(A) = ${a * d} - ${b * c} = ${det}.`
      ]
    };
  } else if (type === "matrix_trace") {
    // Tr(A) = sum of diagonal entries
    const d1 = randomInt(-5, 9);
    const d2 = randomInt(-4, 8);
    const d3 = randomInt(1, 7);
    const trace = d1 + d2 + d3;

    return {
      id,
      levelNumber: 2,
      topic: "Matrices & Linear Systems",
      questionText: `Compute the trace, Tr(A), of the 3×3 square matrix:`,
      mathExpression: `A = \\begin{pmatrix} ${d1} & 4 & -2 \\\\ 3 & ${d2} & 5 \\\\ 0 & 1 & ${d3} \\end{pmatrix}`,
      correctAnswer: trace.toString(),
      acceptedAnswers: [trace.toString(), `Tr(A)=${trace}`],
      hints: [
        { level: 1, text: `The trace of a square matrix is the sum of its main diagonal elements.` },
        { level: 2, text: `Identify the main diagonal elements: ${d1}, ${d2}, and ${d3}, then add them.` }
      ],
      solutionSteps: [
        `The trace Tr(A) is defined as the sum of elements along the principal diagonal: a₁₁ + a₂₂ + a₃₃.`,
        `Diagonal entries: ${d1}, ${d2}, ${d3}.`,
        `Tr(A) = (${d1}) + (${d2}) + (${d3}) = ${trace}.`
      ]
    };
  } else if (type === "triangular_3x3_det") {
    // Triangular matrix determinant = product of diagonal entries
    const d1 = randomInt(2, 4);
    const d2 = randomInt(2, 5);
    const d3 = randomInt(2, 5);
    const det = d1 * d2 * d3;

    return {
      id,
      levelNumber: 2,
      topic: "Matrices & Linear Systems",
      questionText: `Find the determinant of the upper-triangular matrix:`,
      mathExpression: `M = \\begin{pmatrix} ${d1} & 7 & -3 \\\\ 0 & ${d2} & 6 \\\\ 0 & 0 & ${d3} \\end{pmatrix}`,
      correctAnswer: det.toString(),
      acceptedAnswers: [det.toString(), `det(M)=${det}`],
      hints: [
        { level: 1, text: `For any triangular matrix (upper or lower), the determinant equals the product of its diagonal entries.` },
        { level: 2, text: `Multiply ${d1} × ${d2} × ${d3}.` }
      ],
      solutionSteps: [
        `Notice that M is upper triangular because all entries below the main diagonal are 0.`,
        `For triangular matrices, det(M) = m₁₁ × m₂₂ × m₃₃.`,
        `det(M) = ${d1} × ${d2} × ${d3} = ${det}.`
      ]
    };
  } else {
    // 2x2 linear system with unique solution
    // x + y = s1
    // 2x - y = s2 => 3x = s1 + s2
    const x = randomInt(2, 7);
    const y = randomInt(1, 6);
    const eq1 = x + y;
    const eq2 = 2 * x - y;

    return {
      id,
      levelNumber: 2,
      topic: "Matrices & Linear Systems",
      questionText: `Solve the system of linear equations for x: \n(1) x + y = ${eq1} \n(2) 2x - y = ${eq2}`,
      mathExpression: `\\begin{cases} x + y = ${eq1} \\\\ 2x - y = ${eq2} \\end{cases}`,
      correctAnswer: x.toString(),
      acceptedAnswers: [x.toString(), `x=${x}`],
      hints: [
        { level: 1, text: `Use elimination: add equation (1) and equation (2) together to eliminate y.` },
        { level: 2, text: `(x + y) + (2x - y) = 3x = ${eq1} + ${eq2} = ${eq1 + eq2}. Then divide by 3.` }
      ],
      solutionSteps: [
        `Write equations: x + y = ${eq1} (Eq 1) and 2x - y = ${eq2} (Eq 2).`,
        `Add Eq 1 + Eq 2: (x + 2x) + (y - y) = ${eq1} + ${eq2}.`,
        `3x = ${eq1 + eq2}.`,
        `x = ${eq1 + eq2} / 3 = ${x}.`
      ]
    };
  }
}
