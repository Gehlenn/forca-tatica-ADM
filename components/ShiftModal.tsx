
import React, { useState } from 'react';
import { ShiftEntry, Officer } from '../types';
import OfficerBadge from './OfficerBadge';

interface Props {
  entries: ShiftEntry[];
  officersList: Officer[];
  onSave: (entries: ShiftEntry[]) => void;
  onUpdateEntry: (entry: ShiftEntry, originalId?: string) => void;
  onDuplicate?: (entry: ShiftEntry) => void;
  onClose: () => void;
}

const ShiftModal: React.FC<Props> = ({ entries, officersList, onSave, onUpdateEntry, onDuplicate, onClose }) => {
  const [editingEntry, setEditingEntry] = useState<ShiftEntry | null>(null);

  const qapOfficers = officersList.filter(o => o.status === 'DISPONIVEL');

  const handleAddEntry = () => {
    setEditingEntry({
      id: Math.random().toString(),
      officers: [],
      type: 'SERVICO',
      timeRange: ' às ',
      vtr: ''
    });
  };

  const toggleOfficer = (id: string) => {
    if (!editingEntry) return;
    setEditingEntry(prev => {
      if (!prev) return null;
      return {
        ...prev,
        officers: prev.officers.includes(id) 
          ? prev.officers.filter(oid => oid !== id)
          : [...prev.officers, id]
      };
    });
  };

  const handleSaveEntry = () => {
    if (!editingEntry) return;
    onUpdateEntry(editingEntry, editingEntry.id);
    setEditingEntry(null);
  };

  const handleDeleteEntry = (id: string) => {
    onSave(entries.filter(e => e.id !== id));
  };

  if (editingEntry) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 font-mono">
        <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full overflow-hidden">
          <div className="bg-black text-white p-4 flex justify-between items-center">
            <h3 className="font-black uppercase text-sm italic">Configurar Equipe</h3>
            <button onClick={() => setEditingEntry(null)} className="text-white hover:text-slate-300 font-black">×</button>
          </div>
          
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Tipo de Serviço</label>
              <input 
                type="text" 
                className="w-full border-2 border-black p-2 text-sm font-black uppercase text-red-600 outline-none focus:bg-red-50"
                value={editingEntry.type}
                onChange={e => setEditingEntry({ ...editingEntry, type: e.target.value.toUpperCase() })}
                placeholder="Ex: SERVIÇO, TREINAMENTO, OPERAÇÃO"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">VTR / Prefixo</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-black p-2 text-sm font-black uppercase text-red-600 outline-none focus:bg-red-50"
                  value={editingEntry.vtr || ''}
                  onChange={e => setEditingEntry({ ...editingEntry, vtr: e.target.value.toUpperCase() })}
                  placeholder="Ex: VTR 14897"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Horário</label>
                <div className="flex items-center gap-1 border-2 border-black p-1 bg-white">
                  <input 
                    type="number" 
                    min="0" 
                    max="23"
                    className="w-12 text-center text-sm font-black text-red-600 outline-none"
                    value={editingEntry.timeRange?.split('h às ')[0] || ''}
                    onChange={e => {
                      const start = e.target.value;
                      const end = editingEntry.timeRange?.split('h às ')[1]?.replace('h', '') || '';
                      setEditingEntry({ ...editingEntry, timeRange: `${start}h às ${end}h` });
                    }}
                  />
                  <span className="text-[10px] font-black uppercase">h às</span>
                  <input 
                    type="number" 
                    min="0" 
                    max="23"
                    className="w-12 text-center text-sm font-black text-red-600 outline-none"
                    value={editingEntry.timeRange?.split('h às ')[1]?.replace('h', '') || ''}
                    onChange={e => {
                      const start = editingEntry.timeRange?.split('h às ')[0] || '';
                      const end = e.target.value;
                      setEditingEntry({ ...editingEntry, timeRange: `${start}h às ${end}h` });
                    }}
                  />
                  <span className="text-[10px] font-black uppercase">h</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1">Guarnição (QAP)</label>
              <div className="max-h-48 overflow-y-auto border-2 border-black p-2 bg-slate-50">
                <div className="grid grid-cols-2 gap-1">
                  {qapOfficers.map(off => (
                    <label key={off.id} className="flex items-center space-x-2 p-1 hover:bg-white rounded cursor-pointer transition-colors">
                      <input 
                        type="checkbox"
                        checked={editingEntry.officers.includes(off.id)}
                        onChange={() => toggleOfficer(off.id)}
                        className="w-4 h-4 border-2 border-black rounded-none checked:bg-black"
                      />
                      <span className="text-[10px] font-bold uppercase">{off.rank} {off.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-100 border-t-2 border-black flex justify-end space-x-3">
            <button onClick={() => setEditingEntry(null)} className="px-4 py-2 text-xs font-black uppercase border-2 border-black hover:bg-slate-200">Voltar</button>
            <button 
              onClick={handleSaveEntry} 
              className="px-6 py-2 text-xs bg-black text-white font-black uppercase hover:bg-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 font-mono">
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] max-w-lg w-full overflow-hidden">
        <div className="bg-black text-white p-4 flex justify-between items-center">
          <h3 className="font-black uppercase italic">Gerenciar Equipes do Dia</h3>
          <button onClick={onClose} className="text-white hover:text-slate-300 font-black text-xl">×</button>
        </div>
        
        <div className="p-6 space-y-4">
          {entries.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-slate-300 text-slate-400 uppercase font-black text-xs">
              Nenhuma equipe escalada para este turno.
            </div>
          ) : (
            <div className="space-y-3">
              {entries.map((e, idx) => (
                <div key={e.id || idx} className="border-2 border-black p-3 flex justify-between items-center bg-slate-50 hover:bg-white transition-all">
                  <div>
                    <div className="text-red-600 font-black uppercase text-[10px]">{e.type}</div>
                    <div className="text-red-600 font-black uppercase text-[10px]">{e.vtr} {e.timeRange}</div>
                    <div className="text-[9px] font-bold text-slate-600 uppercase mt-1">
                      {e.officers.map(oid => officersList.find(o => o.id === oid)?.name).join(', ')}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setEditingEntry(e)}
                      className="p-2 border-2 border-black hover:bg-black hover:text-white transition-all"
                      title="Editar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteEntry(e.id)}
                      className="p-2 border-2 border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                      title="Excluir"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button 
            onClick={handleAddEntry}
            className="w-full border-2 border-black border-dashed p-3 text-xs font-black uppercase hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <span className="text-lg">+</span> Adicionar Nova Equipe
          </button>
        </div>

        <div className="p-4 bg-slate-100 border-t-2 border-black flex justify-end">
          <button onClick={onClose} className="px-6 py-2 text-xs font-black uppercase bg-black text-white hover:bg-slate-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;
