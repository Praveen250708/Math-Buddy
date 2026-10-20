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

  const universalSimplicityPrompt = `CRITICAL DIRECTIVE — ULTRA-SIMPLE ANSWERS & CLEAR MATHEMATICAL FORMULAS:
1. EXTREME SIMPLICITY: Always explain answers and steps as SIMPLY and DIRECTLY as humanly possible. Never make explanations complicated, verbose, or dense with heavy academic jargon. Explain in straightforward, plain words that any student can immediately understand.
2. CLEAR MATHEMATICAL FORMULA: The governing mathematical formula must ALWAYS be stated clearly and explicitly on its own line as a standard display mathematical expression in LaTeX ($$ ... $$) before substituting numerical values.
3. CLEAN MATHEMATICAL EXPRESSIONS: Every equation, variable, fraction, and step must use clean, standard LaTeX ($$ ... $$ for display equations, $ ... $ for inline expressions). Use \\frac{a}{b}, \\sqrt{...}, ^{}, _{}, \\int, \\sum, \\lim, etc. NEVER use crude ASCII math like a/b or x^2.
4. PROMINENT FINAL ANSWER: Make the final answer crystal clear on its own line so the user can spot the result immediately.`;

  const body: any = {
    contents: [
      {
        role: "user",
        parts: []
      }
    ],
    systemInstruction: {
      parts: [{ text: `${universalSimplicityPrompt}\n\n${systemPrompt}` }]
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
    z
      .object({
        topic: z.string().trim().min(1).max(200),
        difficulty: z.enum(["all", "easy", "medium", "hard"]).optional().default("all"),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const diff = data.difficulty || "all";
    
    let difficultyInstruction = "";
    if (diff === "easy") {
      difficultyInstruction = `Focus STRICTLY on FOUNDATION / EASY level formulas: core elementary definitions, standard rules, fundamental identities, and basic prerequisite properties.
Mark every formula explicitly with the badge [🟢 Foundation / Easy]. Include prerequisites and intuitive meaning.`;
    } else if (diff === "medium") {
      difficultyInstruction = `Focus STRICTLY on INTERMEDIATE / MEDIUM level formulas: core college-level operational formulas, techniques (e.g. transformations, multi-step identities, applied standard formulas).
Mark every formula explicitly with the badge [🟡 Intermediate]. Include key variable conditions and standard exam applications.`;
    } else if (diff === "hard") {
      difficultyInstruction = `Focus STRICTLY on ADVANCED / EXAM LEVEL (HARD) formulas: complex multivariable/higher-order theorems, specialized reduction formulas, boundary conditions, and olympiad/competitive exam identities.
Mark every formula explicitly with the badge [🔴 Advanced / Exam Level]. Include rigorous conditions, caveats, and master-level exam tips.`;
    } else {
      difficultyInstruction = `Organize the formulas systematically into 3 CLEAR DIFFICULTY TIERS:
### 🟢 Foundation / Easy Level
(Core fundamental rules, standard definitions, and essential identities that every student must know first)

### 🟡 Intermediate / Standard Level
(Applied operational formulas, transformations, and standard semester exam equations)

### 🔴 Advanced / Exam Mastery Level
(Complex theorems, higher-order results, specialized reduction formulas, and tricky edge-case identities)

For EACH formula, include its difficulty badge: [🟢 Foundation], [🟡 Intermediate], or [🔴 Advanced].`;
    }

    const content = await callAI(
      `You are an expert ${LEVEL} tutor. When given a topic, you MUST provide an exhaustive, authoritative formula sheet for that topic categorized with CLEAR DIFFICULTY LEVELS.
${difficultyInstruction}

Format strictly as Markdown:
## Topic Overview
A concise, high-yield overview of "${data.topic}" and what this formula sheet covers.

## Formulas
Follow the specified difficulty grouping or numbered structure. For EACH formula:
- **Formula Name** \`[Difficulty Badge]\`
- Display LaTeX equation on its own line wrapped in $$ ... $$ (strictly use valid LaTeX: \\frac{}{}, \\sqrt{}, ^{}, _{}, \\int, \\sum, \\lim, \\vec{}, \\cdot, \\partial, etc.)
- **Usage & Conditions:** A clear explanation of variables, constraints, and when/why to apply this formula (inline math in single $ ... $)
- **Difficulty Rating:** State either 🟢 Foundation (Easy), 🟡 Intermediate (Medium), or 🔴 Advanced (Hard), along with recommended prerequisites.

Always use real LaTeX, never plain ASCII. Be comprehensive, precise, and practical for college exam preparation. No fluff, no greetings.`,
      `Topic: ${data.topic}${diff !== "all" ? `\nTarget Difficulty: ${diff}` : ""}`,
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
    const systemPrompt = `You are an exceptionally clear and friendly ${LEVEL} tutor. Solve the math problem and explain it in active, very simple, plain, and conversational words as if explaining it to a friend. Never make it complicated or use dense academic jargon.
Since the student will listen to your explanation read aloud, keep your tone very engaging, active, and easy to understand when spoken. Explain mathematical actions clearly and simply.
IMPORTANT: You MUST write all explanations, headings, idea, and final answer in ${lang} (for example, if ${lang} is Spanish, write explanations in Spanish; if it is Hindi, write in Hindi).

${data.image ? `IMPORTANT: An image of the math problem has been provided. First, transcribe/describe the math problem from the image carefully in ${lang}, and then solve it.` : ""}

MANDATORY RULES:
1. FORMULA FIRST: State the governing mathematical formula clearly on its own line using display LaTeX ($$ ... $$) before plugging in any values. State what each variable means in 1 simple sentence.
2. VERY SIMPLE EXPLANATION: Explain every step in plain, uncomplicated words. Avoid complicated technical jargon.
3. REAL LATEX: Inline math in $ ... $, display equations on their own line in $$ ... $$. Use \\\\frac{}{}, \\\\sqrt{}, ^{}, _{}, \\\\int, \\\\sum, \\\\lim, \\\\vec{}, \\\\cdot, \\\\Rightarrow, etc. Never write plain ASCII math like x^2 or sqrt(x).

Format strictly as Markdown:
## Problem
Restate the problem in one line (with LaTeX).

## Formula Used
State the exact mathematical formula needed for this problem as a clear display mathematical expression:
$$ \\text{formula here} $$
State what each symbol in the formula means in one very simple, plain sentence.

## Idea
1–2 sentences in very simple, plain words: what kind of problem this is and the simple trick we'll use to solve it.

## Steps
Numbered steps (1., 2., 3., etc.). For each step:
1. **Short step heading in plain words**
$$ \\text{display math} $$
One short, active, friendly spoken sentence in simple words explaining what we did ("Now, we subtract 5 from both sides because we want x alone"). Keep each step small, simple, and easy to understand.

## Final Answer
**Final Answer:**
$$ \\text{result as display math} $$
One short sentence in plain language confirming what it means.

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

export const clarifyStep = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        problem: z.string().trim().max(2000),
        stepContent: z.string().trim().max(3000),
        conversationHistory: z
          .array(
            z.object({
              role: z.enum(["student", "tutor"]),
              message: z.string().trim().max(2000),
            }),
          )
          .max(20),
        language: z.string().trim().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const lang = data.language || "English";

    // Build a readable conversation string for the AI
    const historyText = data.conversationHistory
      .map((m) => `${m.role === "student" ? "Student" : "Tutor"}: ${m.message}`)
      .join("\n");

    const systemPrompt = `You are an encouraging, patient AI math mentor tutoring a student one-on-one.
The student is solving this problem: """${data.problem}"""

The specific step they are confused about:
"""${data.stepContent}"""

Conversation so far:
${historyText || "(no prior conversation)"}

Your role as a tutor:
1. EXPLAIN VERY SIMPLY: Always give the explanation VERY SIMPLY. Never use complicated academic jargon or dense wording. Explain like you are talking to a beginner using plain, friendly words and clear short sub-steps.
2. CLEAR FORMULA & MATHEMATICAL EXPRESSIONS: If a formula is involved, write the exact formula clearly on its own line in display LaTeX ($$ ... $$) before substituting numbers. Use proper LaTeX for all inline ($...$) and display ($$...$$) expressions.
3. In your FIRST response: Acknowledge their confusion warmly (1 sentence), then re-explain ONLY this step simply with concrete numbers.
4. In follow-up responses: Respond to what the student just said — affirm correct thinking, gently correct mistakes.
5. ALWAYS end every response with a short tutor question directed at the student to check understanding. Examples:
   - "Does that make sense now — can you tell me in your own words what we did?"
   - "What do you think the next step would be after this?"
   - "Try applying this: if x was 3 instead, what would the result be?"
   - "Which part still feels unclear to you?"
6. Keep the whole response under 130 words.
7. Write entirely in ${lang}.
8. Never say "Great question!" or "Certainly!". Be warm, simple, and direct.`;

    const lastStudentMsg = data.conversationHistory
      .filter((m) => m.role === "student")
      .at(-1)?.message ?? "Please help me understand this step.";

    const content = await callAI(systemPrompt, `Student: ${lastStudentMsg}`);
    return { content };
  });

export const getImportantQuestions = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        topic: z.string().trim().min(1).max(200),
        difficulty: z.enum(["easy", "medium", "hard", "mixed"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const difficultyStr = data.difficulty || "mixed";
    const difficultyInstruction = 
      difficultyStr === "easy" 
        ? `All 10 questions must be EASY / BASIC level:
- Simple definition-based questions (e.g. "What is the derivative of $\\sin(x)$?")
- Direct formula application with small, clean numbers
- Fill-in-the-blank or one-step calculation questions
- "State the formula for..." type questions
- NO proofs, NO multi-step problems, NO tricky edge cases
- Think of these as the very first questions a beginner would practice after learning the topic.`
        : difficultyStr === "medium"
        ? "All questions must be MEDIUM (typical homework/exam questions requiring 2-3 step application of formulas, but nothing too tricky)."
        : difficultyStr === "hard"
        ? "All questions must be HARD (challenging conceptual questions, multi-step problems, proofs, or tricky edge cases)."
        : `Mix of difficulties:
- Questions 1-4: EASY (basic definitions, direct formula plug-in, one-step calculations)
- Questions 5-7: MEDIUM (2-3 step problems, formula application)
- Questions 8-10: HARD (proofs, multi-step, conceptual)`;

    const content = await callAI(
      `You are an expert ${LEVEL} tutor and exam-question curator.
Given a topic, generate the 10 most important / most-frequently-asked exam questions on that topic.
ALL math must be real LaTeX wrapped in $ ... $ for inline and $$ ... $$ for display. Use \\frac, \\sqrt, \\int, ^{}, _{} — never plain ASCII like x^2 or sqrt(x).
Format as Markdown:
## Important Questions on <topic> (Difficulty: ${difficultyStr.toUpperCase()})
Numbered list 1–10. For each:
- The question (clear, exam-style, with LaTeX math)
- Italic: difficulty (Easy / Medium / Hard) and a 1-line hint of the technique to use
- ${difficultyInstruction} No answers, only questions + hints.`,
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
    z
      .object({
        topic: z.string().trim().min(1).max(200),
        difficulty: z.enum(["easy", "medium", "hard", "mixed"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const difficultyStr = data.difficulty || "mixed";
    const difficultyInstruction = 
      difficultyStr === "easy" 
        ? `All questions must be at an EASY / BASIC level:
- Simple definition or concept-check questions
- Direct formula application with small, clean numbers (e.g. "What is the value of $\\sin(30°)$?")
- One-step calculations only
- Distractors should be clearly wrong but plausible (common mistakes like sign errors)
- NO multi-step problems, NO proofs, NO tricky edge cases
- A student who just learned the topic basics should be able to answer these.`
        : difficultyStr === "medium"
        ? "All questions must be at a MEDIUM level (typical homework/exam questions requiring 2-3 steps of formula application)."
        : difficultyStr === "hard"
        ? "All questions must be at a HARD level (challenging conceptual questions, multi-step problems, or proofs)."
        : `Mix difficulties:
- Questions 1-4: EASY (basic definitions, direct plug-in, one-step)
- Questions 5-7: MEDIUM (2-3 step problems)
- Questions 8-10: HARD (multi-step, proofs, conceptual).`;

    const raw = await callAI(
      `You are a ${LEVEL} quiz generator. Generate exactly 10 multiple-choice questions on the given topic.
Output STRICT JSON only, matching this schema:
{ "questions": [ { "q": string, "options": [string, string, string, string], "answer": 0|1|2|3, "explanation": string } ] }
- Use real LaTeX inside strings: inline $...$ and display $$...$$. Use \\\\frac, \\\\sqrt, \\\\int, ^{}, _{} — escape backslashes properly for JSON.
- ${difficultyInstruction} Make distractors plausible. Explanation is 1–2 sentences.
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
      `You are a ${LEVEL} tutor. Output a single fun, EASY-to-MEDIUM difficulty math problem suitable as a "problem of the day". The problem should be approachable — a student with basic knowledge of the topic should be able to attempt it. Use simple numbers and straightforward applications. Use real LaTeX ($...$ inline, $$...$$ display). Format as Markdown:
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
Always give answers and explanations VERY SIMPLY, in plain everyday words without complicated jargon.
For each question:
- Transcribe the question clearly.
- Clearly state the governing mathematical formula on its own line using display LaTeX ($$ ... $$) before substituting numbers.
- Provide a simple, clear, bite-sized walkthrough of the steps.
- Use real LaTeX ($...$ inline, $$...$$ display) for all mathematical expressions.
- Highlight and bold the final answer clearly.`;
    } else if (data.mode === "extract") {
      systemPrompt = `You are a helpful teaching assistant. Transcribe and extract all mathematical questions/problems found in the uploaded question paper.
- Present them as a clean, numbered list.
- Use proper LaTeX formatting ($...$ and $$...$$) for all mathematical expressions.
- Do not solve the questions. Only transcribe them exactly as they are.`;
    } else {
      systemPrompt = `You are an expert college math tutor. Analyze this question paper and extract the key math concepts, theorems, and formulas that are required to solve it.
- Summarize the main topics tested in simple, uncomplicated language.
- Provide a list of the core formulas and theorems tested, displayed clearly in LaTeX ($$ ... $$).
- Give brief, simple tips on how students should study for these topics.`;
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
1. **Visual Extraction**: Identify the geometry shapes, vertices, lines, angles, coordinate axes, function curves, intercept points, or plotted values simply and clearly.
2. **Governing Formula**: State the governing mathematical formula(s) clearly on its own line as a display mathematical expression ($$ ... $$) before substituting numbers.
3. **Walkthrough & Solution**: Solve the problem step-by-step in very simple, plain language. Never make it complicated. Use DISPLAY LaTeX equations wrapped in $$ ... $$ on their own lines for all final values and key equations.
4. **Final Answer**: State the final answer boldly and clearly on its own line.
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

export const getSpeechAudio = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        text: z.string().trim().min(1),
        langCode: z.string().trim().min(2),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${data.langCode}&client=tw-ob&q=${encodeURIComponent(data.text)}`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36"
      }
    });
    if (!res.ok) {
      throw new Error(`Failed to fetch TTS: ${res.status}`);
    }
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return { audio: `data:audio/mpeg;base64,${base64}` };
  });

export const generateProjectZip = createServerFn({ method: "POST" })
  .handler(async () => {
    const tempZipPath = "project-temp.zip";
    const cmd = process.platform === "win32"
      ? `powershell -Command "Compress-Archive -Path 'Math Buddy.exe', readme.txt -DestinationPath ${tempZipPath} -Force"`
      : `zip -r ${tempZipPath} "Math Buddy.exe" readme.txt`;
    try {
      const { exec } = await import("child_process");
      const { promisify } = await import("util");
      const fs = await import("fs/promises");
      const execAsync = promisify(exec);
      await execAsync(cmd, { cwd: process.cwd() });
      
      const buffer = await fs.readFile(tempZipPath);
      const base64 = buffer.toString("base64");
      
      // Clean up the temp zip file on the server
      await fs.unlink(tempZipPath);
      
      return { success: true, base64 };
    } catch (err) {
      console.error("Error zipping project:", err);
      throw new Error(`Failed to generate zip file: ${err instanceof Error ? err.message : String(err)}`);
    }
  });

export const performMathOcr = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        image: z.object({
          mimeType: z.string(),
          data: z.string(),
        }),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const MATHPIX_APP_ID = process.env.MATHPIX_APP_ID || import.meta.env.VITE_MATHPIX_APP_ID;
    const MATHPIX_APP_KEY = process.env.MATHPIX_APP_KEY || import.meta.env.VITE_MATHPIX_APP_KEY;

    if (MATHPIX_APP_ID && MATHPIX_APP_KEY) {
      try {
        const res = await fetch("https://api.mathpix.com/v3/text", {
          method: "POST",
          headers: {
            "app_id": MATHPIX_APP_ID.trim(),
            "app_key": MATHPIX_APP_KEY.trim(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            src: `data:${data.image.mimeType};base64,${data.image.data}`,
            formats: ["text"],
            data_options: {
              include_latex: true
            }
          })
        });
        if (res.ok) {
          const result = await res.json();
          return { text: result.text || "" };
        } else {
          console.warn("Mathpix API failed, falling back to Gemini OCR. Status:", res.status);
        }
      } catch (err) {
        console.warn("Mathpix request error, falling back to Gemini OCR:", err);
      }
    }

    const ocrSystemPrompt = `You are a professional mathematics OCR reader.
Analyze the image containing a mathematical problem (which could be handwritten or printed).
Your task is to transcribe the math problem text and math symbols exactly as they are in the image.
Translate all equations, functions, symbols, and graphs to proper LaTeX notation:
- Wrap inline math in $...$
- Wrap display equations on their own line in $$...$$
- Use LaTeX tags such as \\frac, \\sqrt, \\int, \\sum, \\lim, ^{}, _{}, etc.
Return ONLY the transcribed mathematical text and formulas.
Do not provide any explanations, solutions, greeting, or extra text.
If the image doesn't contain any clear mathematical problem or text, return: "We couldn't read that clearly — try retaking the photo with better lighting, or type the problem manually."`;

    const ocrUserPrompt = "Please transcribe the math problem in this image.";
    const text = await callAI(
      ocrSystemPrompt,
      ocrUserPrompt,
      false,
      data.image
    );
    return { text };
  });

export const solveMathProblemWithAi = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        problem: z.string().trim().min(1),
        language: z.string().trim().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const lang = data.language || "English";
    const systemPrompt = `You are an expert math tutor. Solve the math problem and return the result in strict JSON format.
Always explain very simply in plain, everyday words without complicated jargon. State the primary governing formula clearly as a mathematical expression before substituting values.

You must return the response as a JSON object matching this schema:
{
  "recognizedProblem": "string — the problem restated with inline LaTeX math wrapped in $...$ delimiters",
  "formulaUsed": "string — the primary governing mathematical formula displayed clearly in LaTeX ($$ ... $$) before substituting numbers. Example: '$$x = \\\\frac{-b \\\\pm \\\\sqrt{b^{2}-4ac}}{2a}$$'",
  "finalAnswer": "string — ONLY the raw LaTeX expression of the final answer WITHOUT any dollar-sign delimiters (no $ or $$). Example: x = \\\\frac{3}{2}",
  "steps": [
    {
      "title": "string — a short, plain-text descriptive step title WITHOUT any LaTeX or math symbols (e.g., 'Identify the coefficients', 'Apply the quadratic formula', 'Simplify the terms')",
      "explanation": "string — an ULTRA-SIMPLE, friendly explanation in plain words without complicated jargon. Any math references MUST use inline LaTeX wrapped in single dollar signs $...$. Example: 'We divide both sides by $2$ to get $x$ by itself.'",
      "latex": "string — the key mathematical equation(s) for this step as display LaTeX. MUST be wrapped in double dollar signs $$...$$. Use proper LaTeX commands: \\\\frac{}{}, \\\\sqrt{}, \\\\int, \\\\sum, \\\\lim, ^{}, _{}, \\\\Rightarrow, \\\\cdot, etc. NEVER use plain ASCII like x^2, sqrt(x), or a/b."
    }
  ]
}

CRITICAL RULES FOR SIMPLICITY AND FORMULAS:
- SIMPLICITY FIRST: Always keep explanations very simple, direct, and easy to understand. Never use complicated academic words.
- FORMULA USED: State the clean mathematical formula clearly in the "formulaUsed" field in display LaTeX ($$ ... $$) before numbers are plugged in.
- "recognizedProblem": Wrap ALL math expressions in single dollar signs $...$. Example: "Solve $x^{2} - 5x + 6 = 0$"
- "finalAnswer": Write ONLY raw LaTeX with NO dollar signs. Example: "x = 3 \\\\text{ or } x = 2" (NOT "$$x=3$$" and NOT "$x=3$")
- "title": Plain text ONLY. No LaTeX, no dollar signs, no math symbols. Keep it short and descriptive.
- "explanation": Use simple words with inline math $...$.
- "latex": Always wrap in $$...$$. Use proper LaTeX commands. Example: "$$x = \\\\frac{-b \\\\pm \\\\sqrt{b^{2} - 4ac}}{2a}$$"
- NEVER write plain ASCII math anywhere. Always use LaTeX: \\\\frac{a}{b} not a/b, x^{2} not x^2, \\\\sqrt{x} not sqrt(x).
- Write recognizedProblem, formulaUsed, finalAnswer, explanation, and title text in the requested language: ${lang}.
- Do not skip any steps. Provide a complete, logical path to the solution.
- Return ONLY raw JSON text. Do not include markdown code block backticks like \`\`\`json or \`\`\`.`;

    const content = await callAI(
      systemPrompt,
      `Solve this problem in ${lang}: ${data.problem}`,
      true
    );

    const tryParse = (raw: string) => {
      try {
        return JSON.parse(raw);
      } catch {
        const sanitized = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
        return JSON.parse(sanitized);
      }
    };

    try {
      const parsed = tryParse(content);
      return parsed;
    } catch (err) {
      console.error("Failed to parse JSON response from Gemini:", content);
      throw new Error("Failed to generate a valid step-by-step solution. Please try again.");
    }
  });


export const evaluateDailyChallengeAnswer = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        problem: z.string().trim().min(1),
        userAnswer: z.string().trim().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const systemPrompt = `You are an expert college math tutor. You are evaluating a student's answer to the daily math challenge.
Determine if the student's answer is mathematically correct for the given problem.
Be lenient with formats (e.g. 1/2, 0.5, or 2/4 are all correct for a half; x^2 + x, x(x+1) are both correct for the same expression).
However, be mathematically strict on correctness.
Return ONLY a raw JSON object matching this schema:
{
  "isCorrect": boolean,
  "feedback": "A short (1-2 sentences), friendly, encouraging explanation in Markdown. If correct, congratulate them enthusiastically. If incorrect, explain why, point out possible common mistakes, but DO NOT reveal the final step-by-step solution yet."
}
Do not wrap your output in markdown fences (like \`\`\`json).`;

    const userPrompt = `Problem: ${data.problem}\nStudent's Answer: ${data.userAnswer}`;
    const response = await callAI(systemPrompt, userPrompt, true);
    try {
      return JSON.parse(response) as { isCorrect: boolean; feedback: string };
    } catch (err) {
      console.error("Failed to parse evaluation response:", response);
      const isCorrectFallback = response.toLowerCase().includes("true") || response.toLowerCase().includes('"iscorrect": true') || response.toLowerCase().includes("correct");
      return {
        isCorrect: isCorrectFallback,
        feedback: "We reviewed your answer. " + (isCorrectFallback ? "Great job, that's correct!" : "That's not quite right. Check your steps and try again!")
      };
    }
  });

export const askChallengeDoubt = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        problem: z.string().trim().min(1),
        solution: z.string().trim().optional().nullable(),
        doubt: z.string().trim().min(1),
        chatHistory: z
          .array(
            z.object({
              role: z.enum(["user", "model"]),
              text: z.string(),
            }),
          )
          .optional()
          .nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const historyText = data.chatHistory
      ?.map((msg) => `${msg.role === "user" ? "Student" : "Tutor"}: ${msg.text}`)
      .join("\n") || "";

    const systemPrompt = `You are a friendly, encouraging, and clear college-level math tutor.
The student has a doubt about the daily challenge problem or its step-by-step solution.
Analyze the problem, the solution (if revealed), and the conversation history. Answer their doubt clearly, keeping the tone active, friendly, and tutoring-oriented.
Help them understand the mathematical logic behind the steps. Use LaTeX ($...$ for inline, $$...$$ for display) for all mathematical expressions. Keep the response concise (under 150 words).`;

    const userPrompt = `Problem: ${data.problem}
${data.solution ? `Solution:\n${data.solution}` : ""}
${historyText ? `Conversation History:\n${historyText}` : ""}
Student's current doubt: ${data.doubt}`;

    const content = await callAI(systemPrompt, userPrompt, false);
    return { content };
  });

export const queryVoiceTutor = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        question: z.string().trim().min(1),
        chatHistory: z
          .array(
            z.object({
              role: z.enum(["user", "model"]),
              text: z.string(),
            }),
          )
          .optional()
          .nullable(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const historyText = data.chatHistory
      ?.map((msg) => `${msg.role === "user" ? "Student" : "Tutor"}: ${msg.text}`)
      .join("\n") || "";

    const systemPrompt = `You are a friendly, encouraging, and clear college-level math tutor helping a student via a voice interface.
Always explain things VERY SIMPLY, directly, and without complicated academic jargon.
The student will ask you questions by speaking. You must return a JSON response with two properties:
1. "spokenText": This text will be read aloud to the student using text-to-speech. It must be highly conversational, very simple, friendly, and easy to speak and listen to.
   - Explain in the simplest possible terms. Avoid complicated words.
   - Speak math naturally in plain words. Do NOT include raw LaTeX code or symbols in this field (e.g. say "integral of x squared", "square root of x", "x equals negative b plus or minus square root of b squared minus 4 a c, all divided by 2 a").
   - Keep it concise, clear, and direct. Break down explanations into simple spoken steps. Limit this to under 80 words.
2. "displayText": This text will be shown on the screen.
   - State the governing mathematical formula clearly on its own line in display LaTeX ($$ ... $$) before steps.
   - Present simple, bite-sized steps using Markdown and proper LaTeX ($...$ for inline, $$...$$ for display).
   - Clearly state the final answer.

Ensure the returned format is a valid JSON object matching the schema:
{
  "spokenText": "...",
  "displayText": "..."
}`;

    const userPrompt = `${historyText ? `Conversation History:\n${historyText}\n` : ""}Student's spoken question: ${data.question}`;

    const content = await callAI(systemPrompt, userPrompt, true);
    
    // Try parsing directly first, then fall back to sanitizing LaTeX backslashes
    const tryParse = (raw: string) => {
      try {
        return JSON.parse(raw);
      } catch {
        // LaTeX backslashes like \sum, \infty, \to are invalid JSON escapes.
        // Escape lone backslashes that aren't already valid JSON escape sequences.
        const sanitized = raw.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
        return JSON.parse(sanitized);
      }
    };

    try {
      const parsed = tryParse(content);
      return {
        spokenText: parsed.spokenText || "",
        displayText: parsed.displayText || "",
      };
    } catch (err) {
      console.error("Failed to parse Voice Tutor response:", content);
      return {
        spokenText: "I'm sorry, I encountered an issue preparing the spoken response. Please read the mathematical explanation on screen.",
        displayText: content,
      };
    }
  });

export const checkIsDeveloperWorkspace = createServerFn({ method: "GET" })
  .handler(async () => {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const markerPath = path.join(process.cwd(), "developer.marker");
      await fs.access(markerPath);
      return { isDeveloper: true };
    } catch {
      return { isDeveloper: false };
    }
  });




