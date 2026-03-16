
import React, { useState } from 'react';
import { RosterState, DayColumn, ShiftEntry, Officer } from '../types';

interface Props {
  officersList: Officer[];
  onImport: (updatedDays: DayColumn[]) => void;
  onClose: () => void;
}

const ImportModal: React.FC<Props> = ({ officersList, onImport, onClose }) => {
  const [textData, setTextData] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleProcessData = () => {
    try {
      if (!textData.trim()) return;

      // Supondo formato simples: Data;Turno;VTR;Policiais(separados por vírgula)
      const lines = textData.split('\n');
      const tempDays: Record<string, DayColumn> = {};

      lines.forEach((line, index) => {
        if (index === 0 && line.toLowerCase().includes('data')) return; // Pula cabeçalho
        
        const [date, shiftKey, vtr, officerNames] = line.split(';').map(s => s?.trim());
        
        if (!date || !shiftKey) return;

        if (!tempDays[date]) {
          tempDays[date] = {
            date,
            weekday: '', // Seria ideal calcular baseado na data
            shifts: {}
          };
        }

        const namesArray = officerNames ? officerNames.split(',').map(n => n.trim().toLowerCase()) : [];
        const foundOfficerIds = officersList
          .filter(o => namesArray.some(name => o.name.toLowerCase().includes(name)))
          .map(o => o.id);

        tempDays[date].shifts[shiftKey] = {
          id: Math.random().toString(),
          vtr: vtr || '',
          timeRange: '', // Padrão será preenchido depois
          officers: foundOfficerIds,
          type: 'SERVICO'
        };
      });

      const finalDays = Object.values(tempDays);
      if (finalDays.length === 0) throw new Error("Nenhum dado válido encontrado.");
      
      onImport(finalDays);
      onClose();
    } catch (err) {
      setError("Erro ao processar dados. Certifique-se de usar o formato: Data;Turno;VTR;Nomes");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold uppercase text-xs tracking-widest">Importar Dados da Planilha</h3>
          <button onClick={onClose} className="text-xl">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 text-[11px] text-blue-800">
            <p className="font-bold uppercase mb-2">Instruções:</p>
            <p>Copie os dados do seu Excel e cole abaixo. O formato esperado é:</p>
            <code className="block mt-2 bg-white p-2 rounded border font-mono">
              Data;Turno;VTR;Policiais (separados por vírgula)<br/>
              02/01/2026;T3T;VTR 14897;NICHETTI, GEHLEN
            </code>
          </div>

          <textarea 
            className="w-full h-48 p-3 border-2 border-slate-200 rounded-lg font-mono text-xs focus:border-blue-500 outline-none"
            placeholder="Cole aqui os dados da sua planilha..."
            value={textData}
            onChange={(e) => setTextData(e.target.value)}
          />

          {error && <p className="text-red-500 text-[10px] font-bold uppercase">{error}</p>}
        </div>
        <div className="p-4 bg-slate-50 flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 text-xs font-bold text-slate-500 uppercase">Cancelar</button>
          <button 
            onClick={handleProcessData}
            className="flex-1 py-3 text-xs font-bold bg-green-600 text-white rounded-lg uppercase shadow-lg hover:bg-green-700 transition-all"
          >
            Processar e Importar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
