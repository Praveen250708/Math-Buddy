import { LevelDefinition, PracticeQuestion } from "../types";
import { generateLevel1Question, generateLevel2Question } from "./arithmetic";
import { generateLevel3Question, generateLevel4Question } from "./fractions";
import { generateLevel5Question, generateLevel7Question } from "./algebra";
import { generateLevel6Question } from "./exponents";
import { generateLevel8Question } from "./geometry";
import { generateLevel9Question } from "./trigonometry";
import { generateLevel10Question } from "./calculus";

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    number: 1,
    topic: "College Algebra & Functions",
    shortDescription: "Solve quadratic roots, polynomial discriminants, composite functions (f ∘ g)(x), and parabola vertices.",
    difficulty: "Easy",
    requiredCorrect: 5,
    iconName: "Variable",
    concepts: ["Quadratic Factoring", "Function Composition", "Discriminants", "Parabola Vertices"]
  },
  {
    number: 2,
    topic: "Matrices & Linear Systems",
    shortDescription: "Evaluate 2×2 and 3×3 matrix determinants, matrix trace, matrix-vector products, and 2D linear systems.",
    difficulty: "Easy",
    requiredCorrect: 5,
    iconName: "Binary",
    concepts: ["2×2 Determinants", "Matrix Trace", "Triangular Determinants", "System Elimination"]
  },
  {
    number: 3,
    topic: "Differential Calculus",
    shortDescription: "Master power, product, and chain rules, polynomial derivatives, and tangent line slopes.",
    difficulty: "Medium",
    requiredCorrect: 5,
    iconName: "Divide",
    concepts: ["Power Rule", "Product Rule", "Chain Rule", "Tangent Slopes"]
  },
  {
    number: 4,
    topic: "Integral Calculus",
    shortDescription: "Evaluate definite polynomial integrals, substitution (u-sub), exponential integrals, and integration by parts.",
    difficulty: "Medium",
    requiredCorrect: 5,
    iconName: "Sigma",
    concepts: ["Fundamental Theorem", "u-Substitution", "Exponential Integrals", "Integration by Parts"]
  },
  {
    number: 5,
    topic: "Sequences & Infinite Series",
    shortDescription: "Compute sums of infinite geometric series, arithmetic progressions, Maclaurin expansion terms, and limits.",
    difficulty: "Medium",
    requiredCorrect: 5,
    iconName: "Percent",
    concepts: ["Geometric Series", "Maclaurin Series", "Rational Sequence Limits", "Arithmetic Series"]
  },
  {
    number: 6,
    topic: "Vector Spaces & Linear Algebra",
    shortDescription: "Compute 3D dot products, squared Euclidean norms, 2×2 triangular eigenvalues, and orthogonal vectors.",
    difficulty: "Medium",
    requiredCorrect: 5,
    iconName: "Compass",
    concepts: ["Dot Product", "Vector Norm", "Eigenvalues", "Orthogonality"]
  },
  {
    number: 7,
    topic: "Multivariable Calculus",
    shortDescription: "Compute partial derivatives ∂f/∂x and ∂f/∂y, squared gradient magnitudes ‖∇f‖², and mixed partials.",
    difficulty: "Hard",
    requiredCorrect: 5,
    iconName: "Triangle",
    concepts: ["Partial Derivatives", "Gradient Vector", "Clairaut's Theorem", "Directional Change"]
  },
  {
    number: 8,
    topic: "Differential Equations",
    shortDescription: "Solve first-order separable ODEs, characteristic roots of 2nd-order ODEs, integrating factors, and IVPs.",
    difficulty: "Hard",
    requiredCorrect: 5,
    iconName: "Zap",
    concepts: ["Characteristic Roots", "Separable Equations", "Integrating Factors", "Initial Value Problems"]
  },
  {
    number: 9,
    topic: "Probability & Combinatorics",
    shortDescription: "Calculate combinations nCr, permutations nPr, discrete random variable expected values, and joint events.",
    difficulty: "Hard",
    requiredCorrect: 5,
    iconName: "PieChart",
    concepts: ["Combinations (nCr)", "Permutations (nPr)", "Expected Value E[X]", "Independent Events"]
  },
  {
    number: 10,
    topic: "Complex Analysis & Transforms",
    shortDescription: "Evaluate complex modulus squared |z|², products and real parts, Euler's formula e^{iθ}, and Laplace transforms.",
    difficulty: "Expert",
    requiredCorrect: 5,
    iconName: "Sparkles",
    concepts: ["Complex Modulus", "Real & Imaginary Parts", "Euler's Formula", "Laplace Transforms"]
  }
];

export function getLevelDefinition(levelNumber: number): LevelDefinition {
  const found = LEVEL_DEFINITIONS.find(l => l.number === levelNumber);
  if (!found) {
    return LEVEL_DEFINITIONS[0];
  }
  return found;
}

/**
 * Dispatches to the appropriate generator for a given level and avoids repeating the previous question.
 * Also supports custom questions configured by the Admin.
 */
export function generateQuestionForLevel(
  levelNumber: number,
  previousQuestionText?: string,
  customQuestions: PracticeQuestion[] = []
): PracticeQuestion {
  // If there are custom admin questions for this level, prioritize or mix them in
  const levelCustomQuestions = customQuestions.filter(q => q.levelNumber === levelNumber);
  if (levelCustomQuestions.length > 0 && Math.random() > 0.4) {
    const candidate = levelCustomQuestions[Math.floor(Math.random() * levelCustomQuestions.length)];
    if (!previousQuestionText || candidate.questionText !== previousQuestionText || levelCustomQuestions.length === 1) {
      return candidate;
    }
  }

  const maxAttempts = 5;
  let attempt = 0;
  let q: PracticeQuestion;

  do {
    attempt++;
    switch (levelNumber) {
      case 1:
        q = generateLevel1Question();
        break;
      case 2:
        q = generateLevel2Question();
        break;
      case 3:
        q = generateLevel3Question();
        break;
      case 4:
        q = generateLevel4Question();
        break;
      case 5:
        q = generateLevel5Question();
        break;
      case 6:
        q = generateLevel6Question();
        break;
      case 7:
        q = generateLevel7Question();
        break;
      case 8:
        q = generateLevel8Question();
        break;
      case 9:
        q = generateLevel9Question();
        break;
      case 10:
        q = generateLevel10Question();
        break;
      default:
        q = generateLevel1Question();
    }
  } while (previousQuestionText && q.questionText === previousQuestionText && attempt < maxAttempts);

  return q;
}

export { evaluateAnswer } from "./evaluator";
