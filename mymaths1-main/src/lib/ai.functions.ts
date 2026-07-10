import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function callAI(
  systemPrompt: string,
  userPrompt: string,
  json = false,
  image?: { mimeType: string; data: string }
): Promise<string> {
  let apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GEMINI_API_KEY. Please add it to your .env file.");
  }
  apiKey = apiKey.replace(/^["']|["']$/g, "").trim();

  const model = "gemini-flash-lite-latest";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    contents: [
      {
        role: "user",
        parts: []
      }
    ],
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    }
  };

  if (image) {
    body.contents[0].parts.push({
      inlineData: {
        mimeType: image.mimeType,
        data: image.data
      }
    });
  }

  body.contents[0].parts.push({ text: userPrompt });

  if (json) {
    body.generationConfig = {
      responseMimeType: "application/json"
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (res.status === 429) {
    throw new Error("Rate limit reached. Please wait a moment and try again.");
  }

  if (!res.ok) {
    const text = await res.text();
    console.error("Gemini API Error:", res.status, text);
    throw new Error(`Gemini API Request failed: ${res.status}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  return text;
}

const LEVEL = "college-level mathematics";

export const getFormulas = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ topic: z.string().trim().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const content = await callAI(
      `You are an expert ${LEVEL} tutor. When given a topic, you MUST list every single important formula, identity, rule, and theorem associated with that topic. Do not omit any equations; be exhaustively thorough so that a student has a complete guide for their exams.
Format strictly as Markdown with sections:
## Topic
A one-sentence overview.
## Formulas
A numbered list. For each formula:
- Bold name
- The formula on its own line as a DISPLAY LaTeX equation wrapped in $$ ... $$ (use proper LaTeX: \\frac{}{}, \\sqrt{}, ^{}, _{}, \\int, \\sum, \\lim, \\vec{}, \\cdot, etc.)
- A one-line description of variables and when to use it (inline math wrapped in single $ ... $)
Always use real LaTeX, never plain ASCII. Be comprehensive and thorough. No fluff, no greetings.`,
      `Topic: ${data.topic}`,
    );
    return { content };
  });

export const solveStepByStep = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        problem: z.string().trim().max(2000).optional().nullable(),
        image: z
          .object({
            mimeType: z.string(),
            data: z.string(),
          })
          .optional()
          .nullable(),
        language: z.string().trim().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    if (!data.problem?.trim() && !data.image) {
      throw new Error("Please provide a problem description or upload an image.");
    }

    const lang = data.language || "English";
    const systemPrompt = `You are an exceptionally clear and friendly ${LEVEL} tutor. Solve the math problem and explain it in active, simple, and conversational words as if explaining it to a friend. 
Since the student will listen to your explanation read aloud, keep your tone very engaging, active, and easy to understand when spoken. Explain mathematical actions clearly (for instance, explain "why" in a friendly, conversational manner).
IMPORTANT: You MUST write all explanations, headings, idea, and final answer in ${lang} (for example, if ${lang} is Spanish, write explanations in Spanish; if it is Hindi, write in Hindi).

${data.image ? `IMPORTANT: An image of the math problem has been provided. First, transcribe/describe the math problem from the image carefully in ${lang}, and then solve it.` : ""}

ALL math must be real LaTeX: inline math wrapped in $ ... $, display equations on their own line wrapped in $$ ... $$.
Use \\\\frac{}{}, \\\\sqrt{}, ^{}, _{}, \\\\int, \\\\sum, \\\\lim, \\\\vec{}, \\\\cdot, \\\\Rightarrow, etc. Never write plain ASCII math like x^2, sqrt(x), or integral.

Format as Markdown:
## Problem
Restate the problem in one line (with LaTeX).
## Idea
1–2 sentences in simple words: what kind of problem this is and the trick we'll use to crack it. Use very simple terms.
## Steps
Numbered steps. For each step:
- A short bold heading in simple language (e.g. **Move the x terms to one side**)
- The math as $$ display math $$
- One short, active, friendly spoken sentence explaining why we did it or what we did ("Now, we cancel out 2 from both sides because we want x alone"). Keep it highly conversational and voice-friendly.
Keep each step small. If a step has algebra inside algebra, split it into two steps.
## Final Answer
Bold "Final Answer:" with the result as $$ display math $$, then one line in plain language confirming what it means.

No greetings, no filler, no "let's", no "certainly".`;

    const userPrompt = data.problem?.trim()
      ? `Problem: ${data.problem.trim()}`
      : "Please transcribe the math problem in this image and solve it.";

    const content = await callAI(
      systemPrompt,
      userPrompt,
      false,
      data.image || undefined
    );
    return { content };
  });

export const getImportantQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ topic: z.string().trim().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const content = await callAI(
      `You are an expert ${LEVEL} tutor and exam-question curator.
Given a topic, generate the 10 most important / most-frequently-asked exam questions on that topic.
ALL math must be real LaTeX wrapped in $ ... $ for inline and $$ ... $$ for display. Use \\frac, \\sqrt, \\int, ^{}, _{} — never plain ASCII like x^2 or sqrt(x).
Format as Markdown:
## Important Questions on <topic>
Numbered list 1–10. For each:
- The question (clear, exam-style, with LaTeX math)
- Italic: difficulty (Easy / Medium / Hard) and a 1-line hint of the technique to use
Mix conceptual, computational, and proof-style questions. No answers, only questions + hints.`,
      `Topic: ${data.topic}`,
    );
    return { content };
  });

export type QuizQuestion = {
  q: string;
  options: string[]; // 4 options
  answer: number; // 0..3
  explanation: string;
};

export const generateQuiz = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ topic: z.string().trim().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const raw = await callAI(
      `You are a ${LEVEL} quiz generator. Generate exactly 10 multiple-choice questions on the given topic.
Output STRICT JSON only, matching this schema:
{ "questions": [ { "q": string, "options": [string, string, string, string], "answer": 0|1|2|3, "explanation": string } ] }
- Use real LaTeX inside strings: inline $...$ and display $$...$$. Use \\\\frac, \\\\sqrt, \\\\int, ^{}, _{} — escape backslashes properly for JSON.
- Mix Easy/Medium/Hard. Make distractors plausible. Explanation is 1–2 sentences.
- No greetings, no extra keys, no markdown fences.`,
      `Topic: ${data.topic}`,
      true,
    );
    let parsed: { questions: QuizQuestion[] };
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error("Quiz generation returned invalid format. Try again.");
    }
    if (!parsed?.questions?.length) throw new Error("No questions generated.");
    return { questions: parsed.questions.slice(0, 10) };
  });

let cachedChallenge: { date: string; content: string } | null = null;

export const getDailyChallenge = createServerFn({ method: "POST" })
  .handler(async () => {
    // Stable seed per day so it's the same problem all day
    const today = new Date().toISOString().slice(0, 10);
    if (cachedChallenge && cachedChallenge.date === today) {
      return cachedChallenge;
    }
    
    const content = await callAI(
      `You are a ${LEVEL} tutor. Output a single fun, medium-difficulty math problem suitable as a "problem of the day". Use real LaTeX ($...$ inline, $$...$$ display). Format as Markdown:
**Problem:** the problem statement
**Hint:** one short hint
Do not give the solution. Keep total under 80 words.`,
      `Seed date: ${today}. Topic should be varied across days.`,
    );
    cachedChallenge = { date: today, content };
    return cachedChallenge;
  });

export const solveQuestionPaper = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        file: z.object({
          mimeType: z.string(),
          data: z.string(),
        }),
        mode: z.enum(["solve", "extract", "concepts"]),
        notes: z.string().trim().max(1000).optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    let systemPrompt = "";
    if (data.mode === "solve") {
      systemPrompt = `You are a friendly college-level mathematics tutor. You are presented with a mathematics question paper or list of questions. Solve every question found in this document step-by-step.
For each question:
- Transcribe the question clearly.
- Provide a detailed walkthrough of the steps using complete and clear college-level math.
- Use real LaTeX ($...$ inline, $$...$$ display).
- Keep formatting clean and readable. Make sure the final answers are bolded.`;
    } else if (data.mode === "extract") {
      systemPrompt = `You are a helpful teaching assistant. Transcribe and extract all mathematical questions/problems found in the uploaded question paper.
- Present them as a clean, numbered list.
- Use proper LaTeX formatting ($...$ and $$...$$) for all mathematical expressions.
- Do not solve the questions. Only transcribe them exactly as they are.`;
    } else {
      systemPrompt = `You are an expert college math tutor. Analyze this question paper and extract the key math concepts, theorems, and formulas that are required to solve it.
- Summarize the main topics tested in the paper.
- Provide a list of the core formulas and theorems tested (using LaTeX).
- Give brief tips/guidelines on how students should study for these topics.`;
    }

    if (data.notes) {
      systemPrompt += `\nAdditional user instructions: ${data.notes}`;
    }

    const userPrompt = `Please analyze the uploaded document (${data.file.mimeType}) according to the instructions and provide the output.`;

    const content = await callAI(
      systemPrompt,
      userPrompt,
      false,
      data.file
    );

    return { content };
  });

export const solveGraphOrDiagram = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        instruction: z.string().trim().max(2000).optional().nullable(),
        image: z
          .object({
            mimeType: z.string(),
            data: z.string(),
          })
          .required(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const systemPrompt = `You are an expert ${LEVEL} tutor specializing in geometry diagrams, coordinate graphs, calculus plots, and mathematical charts.
Analyze the provided image of the diagram/graph. If the user provided additional instruction, focus on solving that specific query.
Perform the following analysis:
1. **Visual Extraction**: Identify the geometry shapes, vertices, lines, angles, coordinate axes, function curves, intercept points, or plotted values in the image.
2. **Mathematical Formulation**: State the mathematical formulas, rules (e.g., trigonometric identities, triangle theorems, derivative slopes, equation of circles/lines) relevant to this diagram.
3. **Walkthrough & Solution**: Solve the problem step-by-step with clear logical deduction. Use DISPLAY LaTeX equations wrapped in $$ ... $$ on their own lines for all final values and key equations.
Ensure the layout is highly structured and beautiful.`;

    const userPrompt = data.instruction 
      ? `User instructions: ${data.instruction}` 
      : "Solve the diagram/graph problem shown in the image.";

    const content = await callAI(
      systemPrompt,
      userPrompt,
      false,
      data.image
    );

    return { content };
  });
