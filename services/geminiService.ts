
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorSettings, QuestionPaper, Difficulty, SourceFile } from "../types";

export const generateQuestionPaper = async (
  sourceFiles: SourceFile[],
  settings: GeneratorSettings
): Promise<QuestionPaper> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const difficultyGuideline = {
    [Difficulty.EASY]: "Focus on Knowledge and Understanding levels of Bloom's Taxonomy. Simple recall.",
    [Difficulty.MEDIUM]: "Focus on Application and Analysis levels. Include scenario-based questions.",
    [Difficulty.HARD]: "Focus on Evaluation and Synthesis. Require high-level critical thinking."
  }[settings.difficulty];

  const prompt = `
    TASK: Generate a professional academic question paper and Teacher Master Guide in ${settings.language} using the provided multimodal content.
    
    TEACHER FEATURES: 
    1. Categorize each question into Bloom's Taxonomy levels.
    2. Provide a 'markingRubric' for partial marks.
    3. Provide 'estimatedTime' (integer minutes) for a student to solve each question.
    4. Provide 'topicTag' for each question (e.g., "Organic Chemistry").
    5. List 'topicsCovered' as a summary array of main concepts found in the source files.
    
    LANGUAGE: All academic content MUST be in ${settings.language}.
    LEVEL: ${settings.difficulty} (${difficultyGuideline})
    
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
      model: 'gemini-3.1-pro-preview',
      contents: [{
        parts: [...mediaParts, { text: prompt }]
      }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            subject: { type: Type.STRING },
            institutionName: { type: Type.STRING },
            totalMarks: { type: Type.NUMBER },
            duration: { type: Type.STRING },
            topicsCovered: { type: Type.ARRAY, items: { type: Type.STRING } },
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
                        markingRubric: { type: Type.STRING },
                        cognitiveLevel: { type: Type.STRING, enum: ['Knowledge', 'Understanding', 'Application', 'Analysis', 'Synthesis', 'Evaluation'] },
                        estimatedTime: { type: Type.NUMBER },
                        topicTag: { type: Type.STRING },
                        marks: { type: Type.NUMBER }
                      },
                      required: ["id", "type", "text", "marks", "estimatedTime"]
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
    
    // Calculate estimated total time
    let totalEst = 0;
    parsed.sections?.forEach((s: any) => s.questions?.forEach((q: any) => totalEst += (q.estimatedTime || 0)));

    return { 
      ...parsed, 
      id: crypto.randomUUID(), 
      createdAt: Date.now(),
      estimatedTotalTime: totalEst,
      watermark: settings.watermarkText 
    };
  } catch (error: any) {
    console.error("AI Error:", error);
    throw new Error(error.message || "Paper generation failed.");
  }
};
