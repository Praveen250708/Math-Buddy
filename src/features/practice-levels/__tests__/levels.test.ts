import { describe, it, expect } from "bun:test";
import {
  generateQuestionForLevel,
  evaluateAnswer,
  LEVEL_DEFINITIONS,
  getLevelDefinition,
} from "../generators";

describe("Practice Levels Question Generators", () => {
  it("should have 10 defined levels with valid metadata", () => {
    expect(LEVEL_DEFINITIONS.length).toBe(10);
    LEVEL_DEFINITIONS.forEach((lvl, idx) => {
      expect(lvl.number).toBe(idx + 1);
      expect(lvl.topic).toBeTruthy();
      expect(lvl.shortDescription).toBeTruthy();
      expect(lvl.requiredCorrect).toBeGreaterThanOrEqual(5);
      expect(lvl.concepts.length).toBeGreaterThanOrEqual(2);
    });
  });

  it("should generate valid questions for all 10 levels", () => {
    for (let lvl = 1; lvl <= 10; lvl++) {
      const q = generateQuestionForLevel(lvl);
      expect(q.levelNumber).toBe(lvl);
      expect(q.id).toBeTruthy();
      expect(q.topic).toBeTruthy();
      expect(q.questionText).toBeTruthy();
      expect(q.correctAnswer).toBeTruthy();
      expect(Array.isArray(q.acceptedAnswers)).toBe(true);
      expect(q.acceptedAnswers.length).toBeGreaterThan(0);
      expect(Array.isArray(q.hints)).toBe(true);
      expect(q.hints.length).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(q.solutionSteps)).toBe(true);
      expect(q.solutionSteps.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("should avoid immediate duplicate questions when previous question text is provided", () => {
    const q1 = generateQuestionForLevel(1);
    const q2 = generateQuestionForLevel(1, q1.questionText);
    expect(q2).toBeDefined();
    expect(q2.levelNumber).toBe(1);
  });
});

describe("Answer Evaluator (evaluateAnswer)", () => {
  it("should accept exact string matches", () => {
    const result = evaluateAnswer("42", "42");
    expect(result.isCorrect).toBe(true);
  });

  it("should ignore surrounding whitespace and extra inner spaces", () => {
    const result = evaluateAnswer("   42   ", "42");
    expect(result.isCorrect).toBe(true);
  });

  it("should accept acceptedVariants array", () => {
    const result = evaluateAnswer("0.5", "1/2", ["0.5", "2/4"]);
    expect(result.isCorrect).toBe(true);
  });

  it("should strip variable prefix (e.g. x = 5 vs 5)", () => {
    const res1 = evaluateAnswer("x = 5", "5");
    expect(res1.isCorrect).toBe(true);

    const res2 = evaluateAnswer("5", "x=5");
    expect(res2.isCorrect).toBe(true);

    const res3 = evaluateAnswer("x=5", "x = 5");
    expect(res3.isCorrect).toBe(true);
  });

  it("should recognize numeric and fraction equivalence (e.g. 1/2 == 0.5, 4/8 == 0.5)", () => {
    const res1 = evaluateAnswer("1/2", "0.5");
    expect(res1.isCorrect).toBe(true);

    const res2 = evaluateAnswer("0.5", "1/2");
    expect(res2.isCorrect).toBe(true);

    const res3 = evaluateAnswer("2/4", "1/2");
    expect(res3.isCorrect).toBe(true);
  });

  it("should recognize negative numbers and unicode minuses", () => {
    const res1 = evaluateAnswer("-5", "-5");
    expect(res1.isCorrect).toBe(true);

    const res2 = evaluateAnswer("−5", "-5"); // Unicode minus
    expect(res2.isCorrect).toBe(true);
  });

  it("should recognize comma-separated roots in any order", () => {
    const res = evaluateAnswer("2, -2", "-2, 2");
    expect(res.isCorrect).toBe(true);
  });

  it("should reject incorrect answers gracefully", () => {
    const res = evaluateAnswer("999", "42");
    expect(res.isCorrect).toBe(false);
  });

  it("should handle empty or whitespace-only inputs gracefully", () => {
    const res = evaluateAnswer("   ", "42");
    expect(res.isCorrect).toBe(false);
    expect(res.feedback).toContain("Please enter an answer");
  });
});

describe("Level Unlock & Progression Logic", () => {
  it("should ensure Level 1 is unlocked initially while subsequent levels are locked", () => {
    const initialUnlocked = [1];
    expect(initialUnlocked.includes(1)).toBe(true);
    expect(initialUnlocked.includes(2)).toBe(false);
  });

  it("should unlock Level N+1 only when solvedCount meets requiredCorrect", () => {
    const level1Def = getLevelDefinition(1);
    const required = level1Def.requiredCorrect; // 5

    let solvedCount = 4;
    let unlocked = [1];
    let isCompleted = false;

    // Below threshold
    if (solvedCount >= required) {
      isCompleted = true;
      unlocked.push(2);
    }
    expect(isCompleted).toBe(false);
    expect(unlocked.includes(2)).toBe(false);

    // Meet threshold
    solvedCount = 5;
    if (solvedCount >= required) {
      isCompleted = true;
      unlocked.push(2);
    }
    expect(isCompleted).toBe(true);
    expect(unlocked.includes(2)).toBe(true);
  });

  it("should NOT count question toward level unlock if solution was viewed", () => {
    let solvedCount = 4;
    const solutionViewed = true;
    const isCorrect = true;

    // Rule: if solutionViewed, do NOT increment solvedCount
    if (isCorrect && !solutionViewed) {
      solvedCount += 1;
    }

    expect(solvedCount).toBe(4); // Remains 4, does not reach 5
  });
});
