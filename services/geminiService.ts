
import { GoogleGenAI } from "@google/genai";
import { Officer, RosterState, GseEntry, GseJustifyEntry } from "../types";

export async function suggestRosterFixes(roster: RosterState, officers: Officer[]) {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-3-pro-preview';
  
  const prompt = `
    Analise a escala da Força Tática (PM). 
    Regras:
    1. VTR e Horário devem estar na primeira linha da célula (ex: VTR 14897 21h às 23h).
    2. Policiais em LTS ou Férias NÃO podem ser escalados.
    3. Respeite o descanso.
    
    Escala Atual: ${JSON.stringify(roster)}
    Tropa: ${JSON.stringify(officers)}

    Retorne JSON: { "suggestedUpdates": [{ "dayIndex": number, "shiftRowId": string, "updates": { "vtr": string, "timeRange": string, "officers": string[], "type": string } }] }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Erro IA:", error);
    return null;
  }
}

export async function analyzeScaleImage(base64Image: string, officers: Officer[], type: 'ROSTER' | 'LOGBOOK' | 'GSE_SCALE' | 'GSE_JUSTIFY' = 'ROSTER', mimeType: string = 'image/png') {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const modelName = 'gemini-2.5-flash-image';

  let specificInstruction = "";
  if (type === 'GSE_SCALE') {
    specificInstruction = "Extraia os dados da ESCALA GSE (Data, Horário, Horas, Militares, Missão). Identifique também o MÊS e ANO do documento. Compare com a tropa: " + officers.map(o => o.name).join(', ') + ". Retorne um objeto JSON { \"month\": \"...\", \"year\": \"...\", \"entries\": [{\"date\":\"...\", \"time\":\"...\", \"extra\":\"...\", \"meIds\":[\"id1\",\"id2\"], \"mission\":\"...\"}] } onde meIds são os IDs dos policiais da lista.";
  } else if (type === 'GSE_JUSTIFY') {
    specificInstruction = "Extraia os dados da JUSTIFICATIVA GSE (Grad, Nome, Id Func, Data, HE, Turno, Função). Identifique o MÊS e ANO. Retorne um objeto JSON { \"month\": \"...\", \"year\": \"...\", \"entries\": [{\"officerId\":\"...\", \"date\":\"...\", \"he\":\"...\", \"turno\":\"...\", \"funcao\":\"...\"}] }.";
  } else if (type === 'LOGBOOK') {
    specificInstruction = "Digitalize o LIVRO GERAL MENSAL. Mapeie as entradas diárias. Identifique o MÊS e ANO. Retorne um objeto JSON { \"month\": \"...\", \"year\": \"...\", \"overrides\": { \"offId-day-type\": \"val\" } }.";
  } else {
    specificInstruction = "Extraia os dados da escala semanal (Turnos de 1T a BH). Identifique a SEMANA, MÊS e ANO. Retorne um objeto JSON { \"week\": \"...\", \"month\": \"...\", \"year\": \"...\", \"updates\": [...] }.";
  }

  const prompt = `
    Instrução: ${specificInstruction}
    Lista de Policiais conhecidos (ID | NOME): ${officers.map(o => `${o.id}|${o.name}`).join(', ')}.
    O Mês deve ser retornado em maiúsculo (ex: JANEIRO, FEVEREIRO).
    Retorne APENAS o JSON puro. Não use markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: mimeType } },
          { text: prompt }
        ]
      }
    });
    
    const text = response.text?.trim() || "";
    // Remove possíveis blocos de código markdown caso a IA ignore o sistema de instrução
    const cleanJson = text.replace(/^```json\s*/, "").replace(/```$/, "").trim();
    return cleanJson ? JSON.parse(cleanJson) : null;
  } catch (error) {
    console.error("Erro Visão IA:", error);
    throw error;
  }
}
