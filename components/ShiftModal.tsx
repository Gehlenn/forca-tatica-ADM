
import React, { useState } from 'react';
import { ShiftEntry, Officer } from '../types';
import OfficerBadge from './OfficerBadge';

interface Props {
  entry: ShiftEntry;
  officersList: Officer[];
  onSave: (entry: ShiftEntry) => void;
  onClose: () => void;
}

const ShiftModal: React.FC<Props> = ({ entry, officersList, onSave, onClose }) => {
  const [edited, setEdited] = useState<ShiftEntry>({ ...entry });

  const toggleOfficer = (id: string) => {
    setEdited(prev => ({
      ...prev,
      officers: prev.officers.includes(id) 
        ? prev.officers.filter(oid => oid !== id)
        : [...prev.officers, id]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold">Editar Turno</h3>
          <button onClick={onClose} className="text-white hover:text-slate-300">×</button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Entrada</label>
            <select 
              className="w-full border p-2 rounded text-sm bg-slate-50"
              value={edited.type}
              onChange={e => setEdited({ ...edited, type: e.target.value as any })}
            >
              <option value="SERVICO">Serviço VTR</option>
              <option value="FOLGA">Folga</option>
              <option value="TREINAMENTO">Treinamento</option>
              <option value="EXPEDIENTE">Expediente</option>
            </select>
          </div>

          {edited.type !== 'FOLGA' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">VTR / Identificador</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded text-sm"
                    value={edited.vtr || ''}
                    onChange={e => setEdited({ ...edited, vtr: e.target.value })}
                    placeholder="Ex: VTR 14897"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Horário</label>
                  <input 
                    type="text" 
                    className="w-full border p-2 rounded text-sm"
                    value={edited.timeRange || ''}
                    onChange={e => setEdited({ ...edited, timeRange: e.target.value })}
                    placeholder="Ex: 17h às 23h"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Guarnição (Selecionar Policiais)</label>
                <div className="max-h-40 overflow-y-auto border rounded p-2 bg-slate-50">
                  <div className="grid grid-cols-2 gap-1">
                    {officersList.map(off => (
                      <label key={off.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={edited.officers.includes(off.id)}
                          onChange={() => toggleOfficer(off.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="text-xs">{off.rank} {off.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 bg-slate-50 flex justify-end space-x-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded">Cancelar</button>
          <button 
            onClick={() => onSave(edited)} 
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-bold"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;
