
import React, { useState } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Officer, RosterState, ShiftEntry } from '../types';

interface Props {
  officers: Officer[];
  roster: RosterState;
  onUpdateRoster: (roster: RosterState) => void;
}

const AiAssistant: React.FC<Props> = ({ officers, roster, onUpdateRoster }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Você é um assistente administrativo militar. Sua tarefa é processar comandos de texto para preencher uma escala de serviço.
          Escala Atual: ${JSON.stringify(roster)}
          Policiais Disponíveis: ${JSON.stringify(officers.map(o => ({ id: o.id, name: o.rank + ' ' + o.name })))}
          
          Comando do Usuário: "${input}"
          
          Retorne APENAS o objeto RosterState atualizado em formato JSON.
          Não mude IDs de policiais ou de turnos, apenas preencha os campos 'officers', 'vtr', 'timeRange', 'type', 'mission' nos turnos correspondentes.
          Se o comando for para preencher um turno específico (ex: 1T), procure o ID correspondente nas shiftDefinitions.
          IMPORTANTE: O JSON deve ser válido e seguir EXATAMENTE a estrutura do objeto RosterState fornecido.
        `,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) throw new Error("Resposta vazia da IA");
      
      // Handle potential markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : text;
      
      const updatedRoster = JSON.parse(cleanJson);
      onUpdateRoster(updatedRoster);
      setInput('');
      alert("Escala atualizada pelo Assistente!");
    } catch (error) {
      console.error("AI Assistant Error:", error);
      alert("Erro ao processar comando da IA.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMonthly = async () => {
    const extraHours = window.prompt("Quantas horas extras em média cada militar irá fazer? (Padrão: 36-40)", "40");
    if (extraHours === null) return;

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          Você é um especialista em escalas militares da Força Tática.
          Sua tarefa é preencher AUTOMATICAMENTE a escala mensal seguindo estas REGRAS RÍGIDAS:

          1. FOCO MENSAL: Preencha todos os dias da escala.
          2. FOLGAS: Nenhum militar deve ter mais que 2 dias de folga seguidos.
          3. SERVIÇO: No máximo 3 dias seguidos de serviço por militar.
          4. PATENTE: Sargentos (2ºSGT, 1ºSGT) NÃO podem trabalhar na mesma viatura.
          5. DOMINGOS: São FOLGA GERAL para todos (salvo exceção se necessário para completar horas).
          6. SEGUNDAS: São dias de TREINAMENTO (Tipo: TREINAMENTO).
          7. CARGA HORÁRIA: Tente manter ~40 horas semanais. 
          8. MENSAL: 171h (30 dias) ou 177h (31 dias). Média 5.7h/dia.
          9. HORAS EXTRAS: Adicione aproximadamente ${extraHours} horas extras por militar no mês.
          10. EQUIPE: Cada viatura deve ter 3 ou 4 militares (preferência 4).
          11. APENAS QAP: Use apenas militares com status 'DISPONIVEL'.

          Escala Atual (Estrutura): ${JSON.stringify(roster)}
          Policiais Disponíveis (QAP): ${JSON.stringify(officers.filter(o => o.status === 'DISPONIVEL').map(o => ({ id: o.id, name: o.rank + ' ' + o.name, rank: o.rank })))}
          
          Retorne o objeto RosterState completo em JSON.
          IMPORTANTE: O JSON deve ser válido e seguir EXATAMENTE a estrutura do objeto RosterState fornecido.
        `,
        config: {
          responseMimeType: "application/json",
        }
      });

      const text = response.text;
      if (!text) throw new Error("Resposta vazia da IA");
      
      // Handle potential markdown code blocks
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      const cleanJson = jsonMatch ? jsonMatch[1] : text;
      
      const updatedRoster = JSON.parse(cleanJson);
      onUpdateRoster(updatedRoster);
      alert("Escala Mensal gerada com sucesso!");
    } catch (error) {
      console.error("AI Assistant Error:", error);
      alert("Erro ao gerar escala automática.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-2xl hover:bg-blue-700 transition-all z-50 flex items-center gap-2 font-black uppercase text-xs border-2 border-white"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
        Assistente IA
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] z-50 flex flex-col overflow-hidden">
      <div className="bg-black text-white p-3 flex justify-between items-center">
        <span className="text-xs font-black uppercase italic">Assistente de Escala</span>
        <button onClick={() => setIsOpen(false)} className="text-white hover:text-red-500 font-black">×</button>
      </div>
      <div className="p-4 space-y-4">
        <p className="text-[10px] font-bold text-slate-500 uppercase leading-tight">
          Diga o que deseja fazer (ex: "Coloque Richer e Gehlen no 1T de amanhã na VTR 14897")
        </p>
        <textarea 
          className="w-full border-2 border-black p-2 text-[10px] font-bold uppercase h-24 outline-none focus:bg-slate-50"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="DIGITE SEU COMANDO..."
          disabled={isLoading}
        />
        <button 
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={`w-full p-3 font-black uppercase text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'}`}
        >
          {isLoading ? 'PROCESSANDO...' : 'EXECUTAR COMANDO'}
        </button>

        <div className="relative py-2">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/10"></div></div>
          <div className="relative flex justify-center text-[8px] font-black uppercase"><span className="bg-white px-2 text-slate-400">Ou use a Fórmula</span></div>
        </div>

        <button 
          onClick={handleGenerateMonthly}
          disabled={isLoading}
          className={`w-full p-3 font-black uppercase text-xs border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all ${isLoading ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 active:shadow-none active:translate-x-[2px] active:translate-y-[2px]'}`}
        >
          {isLoading ? 'GERANDO...' : 'GERAR ESCALA MENSAL'}
        </button>
      </div>
    </div>
  );
};

export default AiAssistant;
