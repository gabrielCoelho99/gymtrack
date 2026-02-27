import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the API using the key from environment variables
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `
Você é um Personal Trainer especialista em hipertrofia, emagrecimento e condicionamento físico.
O seu objetivo é criar uma rotina de treinos baseada estritamente nas informações fornecidas pelo usuário.

REGRAS OBRIGATÓRIAS:
1. Responda APENAS com um objeto JSON válido. Não inclua Markdown, não inclua crases (\`\`\`), apenas o JSON puro.
2. Siga EXATAMENTE a estrutura de propriedades abaixo.
3. Crie no máximo o número de dias de treino de musculação especificados pelo usuário. Se sobrar dias, insira sessões de Cardio.
4. Escolha exercícios reais, séries (ex: 3), repetições (ex: "10-12") e tempo de descanso (ex: "60s").
5. Preencha a propriedade "workout_type" com letras maiúsculas (ex: "A", "B", "C").
6. Seja realista em relação ao nível de experiência do usuário.

ESTRUTURA JSON ESPERADA:
{
  "workouts": [
    {
      "workout_type": "A",
      "name": "Peito + Tríceps + Ombro",
      "exercises": [
        { "name": "Supino reto", "sets": 4, "reps": "10-12", "rest": "90s" }
      ]
    },
    {
      "workout_type": "B",
      "name": "Costas + Bíceps",
      "exercises": [
        { "name": "Puxada frontal", "sets": 4, "reps": "10-12", "rest": "90s" }
      ]
    }
  ],
  "cardio_recommendation": "Recomendação de cardio baseada no objetivo e dias..."
}
`;

export async function generateWorkoutRoutine(profileData) {
  const prompt = `
Crie um treino para este usuário:
- Peso: ${profileData.weight}kg
- Altura: ${profileData.height}m
- Idade: ${profileData.age} anos
- Gênero: ${profileData.gender}
- Objetivo: ${profileData.goal}
- Experiência: ${profileData.experience_level}
- Dias para treinar (musculação): ${profileData.training_days_per_week} dias por semana

Lembre-se: Retorne APENAS um JSON válido seguindo a estrutura fornecida.
`;

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
      generationConfig: {
        temperature: 0.2, // Low temp for more deterministic JSON
      }
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown code blocks returned by mistake
    const jsonStr = text.replace(/^```json\s*/, '').replace(/\s*```$/, '').trim();
    
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Error generating workout routine:", error);
    throw new Error('Falha ao gerar treino com Inteligência Artificial.');
  }
}
