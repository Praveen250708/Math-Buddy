import { PracticeQuestion } from "../types";

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Level 6: Vector Spaces & Linear Algebra
 * Topics: Vector Dot Products, Squared Vector Norms, Matrix Eigenvalues, Orthogonality
 */
export function generateLevel6Question(): PracticeQuestion {
  const templates = ["dot_product_3d", "vector_norm_squared", "eigenvalues_2x2", "orthogonal_constant"];
  const type = templates[randomInt(0, templates.length - 1)];
  const id = `lvl6_${Date.now()}_${randomInt(100, 999)}`;

  if (type === "dot_product_3d") {
    // u . v = u1*v1 + u2*v2 + u3*v3
    const u1 = randomInt(-3, 5);
    const u2 = randomInt(2, 6);
    const u3 = randomInt(-4, 4);

    const v1 = randomInt(2, 5);
    const v2 = randomInt(-3, 4);
    const v3 = randomInt(1, 4);

    const dot = u1 * v1 + u2 * v2 + u3 * v3;

    return {
      id,
      levelNumber: 6,
      topic: "Vector Spaces & Linear Algebra",
      questionText: `Calculate the dot product (scalar product) of the 3D vectors u = (${u1}, ${u2}, ${u3}) and v = (${v1}, ${v2}, ${v3}):`,
      mathExpression: `\\mathbf{u} = \\begin{pmatrix} ${u1} \\\\ ${u2} \\\\ ${u3} \\end{pmatrix}, \\quad \\mathbf{v} = \\begin{pmatrix} ${v1} \\\\ ${v2} \\\\ ${v3} \\end{pmatrix}, \\quad \\mathbf{u} \\cdot \\mathbf{v} = ?`,
      correctAnswer: dot.toString(),
      acceptedAnswers: [dot.toString(), `u.v=${dot}`],
      hints: [
        { level: 1, text: `The dot product is the sum of component products: u₁v₁ + u₂v₂ + u₃v₃.` },
        { level: 2, text: `Multiply corresponding entries: (${u1})(${v1}) + (${u2})(${v2}) + (${u3})(${v3}).` }
      ],
      solutionSteps: [
        `Formula for 3D dot product: u · v = u₁v₁ + u₂v₂ + u₃v₃.`,
        `Compute terms:`,
        `u₁v₁ = (${u1}) × (${v1}) = ${u1 * v1}.`,
        `u₂v₂ = (${u2}) × (${v2}) = ${u2 * v2}.`,
        `u₃v₃ = (${u3}) × (${v3}) = ${u3 * v3}.`,
        `Sum: ${u1 * v1} + ${u2 * v2} + ${u3 * v3} = ${dot}.`
      ]
    };
  } else if (type === "vector_norm_squared") {
    // ||v||^2 = v1^2 + v2^2 + v3^2
    const v1 = randomInt(2, 6);
    const v2 = randomInt(2, 5);
    const v3 = randomInt(1, 4);
    const normSq = (v1 ** 2) + (v2 ** 2) + (v3 ** 2);

    return {
      id,
      levelNumber: 6,
      topic: "Vector Spaces & Linear Algebra",
      questionText: `Find the squared Euclidean norm (‖v‖²) of the vector v = (${v1}, ${v2}, ${v3}):`,
      mathExpression: `\\mathbf{v} = (${v1}, ${v2}, ${v3}) \\in \\mathbb{R}^3, \\quad \\|\\mathbf{v}\\|^2 = ?`,
      correctAnswer: normSq.toString(),
      acceptedAnswers: [normSq.toString(), `||v||^2=${normSq}`],
      hints: [
        { level: 1, text: `The squared Euclidean norm is the sum of squares of each coordinate: v₁² + v₂² + v₃².` },
        { level: 2, text: `Compute (${v1})² + (${v2})² + (${v3})² = ${v1 ** 2} + ${v2 ** 2} + ${v3 ** 2}.` }
      ],
      solutionSteps: [
        `Definition of squared norm: ‖v‖² = v · v = v₁² + v₂² + v₃².`,
        `Square components: (${v1})² = ${v1 ** 2}, (${v2})² = ${v2 ** 2}, (${v3})² = ${v3 ** 2}.`,
        `Sum: ${v1 ** 2} + ${v2 ** 2} + ${v3 ** 2} = ${normSq}.`
      ]
    };
  } else if (type === "eigenvalues_2x2") {
    // Triangular matrix A = [[l1, k], [0, l2]] => eigenvalues are l1, l2
    const l1 = randomInt(2, 5);
    let l2 = randomInt(3, 8);
    if (l1 === l2) l2 += 2;
    const k = randomInt(1, 6);
    const ans = `${Math.min(l1, l2)}, ${Math.max(l1, l2)}`;

    return {
      id,
      levelNumber: 6,
      topic: "Vector Spaces & Linear Algebra",
      questionText: `Find the eigenvalues of the matrix A (enter them separated by a comma, e.g. "2, 5"):`,
      mathExpression: `A = \\begin{pmatrix} ${l1} & ${k} \\\\ 0 & ${l2} \\end{pmatrix}, \\quad \\lambda = ?`,
      correctAnswer: ans,
      acceptedAnswers: [
        ans,
        `${Math.max(l1, l2)}, ${Math.min(l1, l2)}`,
        `\\lambda=${Math.min(l1, l2)}, ${Math.max(l1, l2)}`,
        `lambda=${Math.min(l1, l2)}, ${Math.max(l1, l2)}`
      ],
      hints: [
        { level: 1, text: `Eigenvalues satisfy det(A - λI) = 0. Notice A is an upper-triangular matrix.` },
        { level: 2, text: `For any triangular matrix, the eigenvalues are simply the entries along the main diagonal.` }
      ],
      solutionSteps: [
        `Write characteristic equation: det(A - λI) = 0.`,
        `det \\begin{pmatrix} ${l1} - \\lambda & ${k} \\\\ 0 & ${l2} - \\lambda \\end{pmatrix} = (${l1} - \\lambda)(${l2} - \\lambda) - 0 = 0.`,
        `Solving for λ yields λ₁ = ${Math.min(l1, l2)} and λ₂ = ${Math.max(l1, l2)}.`,
        `The eigenvalues are ${ans}.`
      ]
    };
  } else {
    // Orthogonal vectors in R^2: u = (a, k), v = (c, d). u . v = 0 => ac + kd = 0 => k = -ac / d
    const d = randomInt(2, 4);
    const mult = randomInt(1, 4);
    const ac = d * mult; // ensures integer k = -mult
    const a = mult;
    const c = d;
    const k = -a; // ac + kd = a*d + (-a)*d = 0

    return {
      id,
      levelNumber: 6,
      topic: "Vector Spaces & Linear Algebra",
      questionText: `Find the scalar k such that the vectors u = (${a}, k) and v = (${c}, ${d}) are orthogonal (u ⊥ v):`,
      mathExpression: `\\mathbf{u} = (${a}, k), \\quad \\mathbf{v} = (${c}, ${d}), \\quad \\mathbf{u} \\cdot \\mathbf{v} = 0`,
      correctAnswer: k.toString(),
      acceptedAnswers: [k.toString(), `k=${k}`],
      hints: [
        { level: 1, text: `Two non-zero vectors are orthogonal if and only if their dot product equals 0: u · v = 0.` },
        { level: 2, text: `u · v = (${a})(${c}) + (k)(${d}) = ${a * c} + ${d}k = 0. Solve for k.` }
      ],
      solutionSteps: [
        `Two vectors are orthogonal if u · v = 0.`,
        `Compute dot product: u · v = (${a})(${c}) + (k)(${d}) = ${a * c} + ${d}k.`,
        `Set to 0: ${a * c} + ${d}k = 0.`,
        `${d}k = -${a * c}.`,
        `k = -${a * c} / ${d} = ${k}.`
      ]
    };
  }
}
