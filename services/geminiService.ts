
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorSettings, QuestionPaper, Difficulty, SourceFile } from "../types";

export const generateQuestionPaper = async (
  sourceFiles: SourceFile[],
  settings: GeneratorSettings
): Promise<QuestionPaper> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const difficultyGuideline = {
    [Difficulty.EASY]: "Focus on Knowledge and Understanding levels of Bloom's Taxonomy.",
    [Difficulty.MEDIUM]: "Focus on Application and Analysis levels. Include scenario-based questions.",
    [Difficulty.HARD]: "Focus on Evaluation and Synthesis. Require high-level critical thinking."
  }[settings.difficulty];

  const prompt = `
    TASK: Generate a professional academic question paper and a detailed Teacher's Marking Scheme in ${settings.language} using the provided content.
    
    FOR TEACHERS: 
    1. Categorize each question into Bloom's Taxonomy levels (Knowledge, Understanding, Application, Analysis, Synthesis, Evaluation).
    2. Provide a 'markingRubric' for each question (how to award partial marks for steps or specific points).
    
    CRITICAL LANGUAGE REQUIREMENT: All content MUST be in ${settings.language}.
    
    LEVEL: ${settings.difficulty}
    GUIDELINE: ${difficultyGuideline}
    
    DISTRIBUTION:
    - Section A: ${settings.mcqCount} MCQs (1m each)
    - Section B: ${settings.trueFalseCount} True/False (1m each)
    - Section C: ${settings.fillBlanksCount} Fill in Blanks (1m each)
    - Section D: ${settings.shortCount} Short Answer (5m each)
    - Section E: ${settings.longCount} Long Answer (10m each)
    
    Return as structured JSON.
  `;

  try {
    const mediaParts = sourceFiles.map(file => ({
      inlineData: { mimeType: file.mimeType, data: file.data }
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [{
        parts: [...mediaParts, { text: prompt }]
      }],
      config: {
        thinkingConfig: { thinkingBudget: 16000 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            institutionName: { type: Type.STRING },
            totalMarks: { type: Type.NUMBER },
            duration: { type: Type.STRING },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            sections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  questions: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        type: { type: Type.STRING },
                        text: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctAnswer: { type: Type.STRING },
                        markingRubric: { type: Type.STRING, description: "Instructions for teacher to grade partial marks" },
                        cognitiveLevel: { type: Type.STRING, enum: ['Knowledge', 'Understanding', 'Application', 'Analysis', 'Synthesis', 'Evaluation'] },
                        marks: { type: Type.NUMBER }
                      },
                      required: ["id", "type", "text", "marks", "markingRubric", "cognitiveLevel"]
                    }
                  }
                },
                required: ["title", "questions"]
              }
            }
          },
          required: ["title", "subject", "totalMarks", "sections"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    return { 
      ...parsed, 
      id: crypto.randomUUID(), 
      createdAt: Date.now(),
      watermark: settings.watermarkText 
    };
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error(error.message || "Paper generation failed.");
  }
};
