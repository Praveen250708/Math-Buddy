import { AnswerValidationResult } from "../types";

/**
 * Normalizes a user string by removing excessive spaces, standardizing minus signs and decimals.
 */
export function normalizeString(str: string): string {
  if (!str) return "";
  return str
    .trim()
    .toLowerCase()
    .replace(/[\u2212\u2013\u2014]/g, "-") // Unicode minuses to standard ASCII minus
    .replace(/\s+/g, " ")
    .replace(/\s*([=+\-*/^(),])\s*/g, "$1"); // remove spaces around operators
}

/**
 * Attempts to parse a fraction string like "3/4" or "-5/2" into a float.
 */
function parseFraction(str: string): number | null {
  const fractionMatch = str.match(/^(-?\d+)\/(\d+)$/);
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10);
    const den = parseInt(fractionMatch[2], 10);
    if (den !== 0) {
      return num / den;
    }
  }
  return null;
}

/**
 * Checks if two numbers are approximately equal (within float precision).
 */
function areFloatsClose(a: number, b: number, epsilon = 0.001): boolean {
  return Math.abs(a - b) < epsilon;
}

/**
 * Evaluates whether the user's submitted answer matches the correct answer or any accepted variants.
 */
export function evaluateAnswer(
  userAnswerRaw: string,
  canonicalAnswer: string,
  acceptedVariants: string[] = []
): AnswerValidationResult {
  const trimmed = (userAnswerRaw || "").trim();
  if (!trimmed) {
    return {
      isCorrect: false,
      userAnswer: "",
      correctAnswer: canonicalAnswer,
      feedback: "Please enter an answer before submitting.",
    };
  }

  const normalizedUser = normalizeString(trimmed);
  const normalizedCanonical = normalizeString(canonicalAnswer);
  const normalizedVariants = acceptedVariants.map(normalizeString);

  // 1. Direct exact or variant string match
  if (normalizedUser === normalizedCanonical || normalizedVariants.includes(normalizedUser)) {
    return {
      isCorrect: true,
      userAnswer: trimmed,
      correctAnswer: canonicalAnswer,
      feedback: "Correct! Outstanding work.",
    };
  }

  // 2. Strip leading variable assignment if user wrote e.g. "x=5" or "x = 5"
  const userStripped = normalizedUser.replace(/^[a-z]\s*=\s*/, "");
  const canonicalStripped = normalizedCanonical.replace(/^[a-z]\s*=\s*/, "");

  if (userStripped === canonicalStripped || normalizedVariants.map(v => v.replace(/^[a-z]\s*=\s*/, "")).includes(userStripped)) {
    return {
      isCorrect: true,
      userAnswer: trimmed,
      correctAnswer: canonicalAnswer,
      feedback: "Correct! Nice algebraic notation.",
    };
  }

  // 3. Numeric / Fraction equivalence
  const userNum = parseFraction(userStripped) ?? (Number.isNaN(Number(userStripped)) ? null : Number(userStripped));
  const canonNum = parseFraction(canonicalStripped) ?? (Number.isNaN(Number(canonicalStripped)) ? null : Number(canonicalStripped));

  if (userNum !== null && canonNum !== null && areFloatsClose(userNum, canonNum)) {
    return {
      isCorrect: true,
      userAnswer: trimmed,
      correctAnswer: canonicalAnswer,
      feedback: "Correct! Equivalent numerical value recognized.",
    };
  }

  // Check variants for numeric equivalence as well
  if (userNum !== null) {
    for (const variant of normalizedVariants) {
      const vStripped = variant.replace(/^[a-z]\s*=\s*/, "");
      const variantNum = parseFraction(vStripped) ?? (Number.isNaN(Number(vStripped)) ? null : Number(vStripped));
      if (variantNum !== null && areFloatsClose(userNum, variantNum)) {
        return {
          isCorrect: true,
          userAnswer: trimmed,
          correctAnswer: canonicalAnswer,
          feedback: "Correct! Equivalent value matched.",
        };
      }
    }
  }

  // 4. Multiple roots / list order equivalence (e.g. "2, -2" vs "-2, 2")
  if (userStripped.includes(",") && canonicalStripped.includes(",")) {
    const userParts = userStripped.split(",").map(s => s.trim()).sort();
    const canonParts = canonicalStripped.split(",").map(s => s.trim()).sort();
    if (userParts.length === canonParts.length && userParts.every((val, idx) => val === canonParts[idx])) {
      return {
        isCorrect: true,
        userAnswer: trimmed,
        correctAnswer: canonicalAnswer,
        feedback: "Correct! All solution roots identified.",
      };
    }
  }

  return {
    isCorrect: false,
    userAnswer: trimmed,
    correctAnswer: canonicalAnswer,
    feedback: "Not quite right. Review the hint or try again!",
  };
}
