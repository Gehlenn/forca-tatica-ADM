
import React, { useState } from 'react';
import { ShiftRowDefinition, ConfigState } from '../types';

interface Props {
  definitions: ShiftRowDefinition[];
  config: ConfigState;
  onSave: (defs: ShiftRowDefinition[], config: ConfigState) => void;
  onClose: () => void;
}

const ConfigModal: React.FC<Props> = ({ definitions, config, onSave, onClose }) => {
  const [items, setItems] = useState<ShiftRowDefinition[]>([...definitions]);
  const [localConfig, setLocalConfig] = useState<ConfigState>({ ...config });

  const updateItem = (id: string, field: keyof ShiftRowDefinition, val: string) => {
    setItems(items.map(it => it.id === id ? { ...it, [field]: val } : it));
  };

  const addItem = () => {
    const newId = `T${Date.now()}`;
    setItems([...items, { id: newId, label: 'Novo', defaultTime: '00h às 00h' }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(it => it.id !== id));
  };

  const toggleConfig = (key: keyof ConfigState) => {
    setLocalConfig({ ...localConfig, [key]: !localConfig[key] });
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full overflow-hidden border">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold uppercase text-xs tracking-widest">Configurações do Sistema</h3>
          <button onClick={onClose} className="text-xl">&times;</button>
        </div>
        
        <div className="flex h-[70vh]">
          {/* Sidebar Tabs */}
          <div className="w-1/3 bg-slate-100 border-r p-2 space-y-1">
            <button className="w-full text-left p-3 text-[10px] font-black uppercase bg-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">Colunas Visíveis</button>
            <button className="w-full text-left p-3 text-[10px] font-black uppercase hover:bg-white transition-all">Definição de Turnos</button>
          </div>

          {/* Content */}
          <div className="flex-grow p-6 overflow-y-auto">
            <div className="space-y-6">
              <section>
                <h4 className="text-[11px] font-black uppercase mb-4 border-b-2 border-black pb-1">Visibilidade de Colunas (Escala Principal)</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'showRank', label: 'Posto/Graduação' },
                    { key: 'showVtr', label: 'Viatura (VTR)' },
                    { key: 'showTime', label: 'Horário do Turno' },
                    { key: 'showMission', label: 'Missão/Observação' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center gap-3 p-3 bg-slate-50 rounded border-2 border-black cursor-pointer hover:bg-slate-100 transition-all">
                      <input 
                        type="checkbox" 
                        checked={localConfig[item.key as keyof ConfigState]} 
                        onChange={() => toggleConfig(item.key as keyof ConfigState)}
                        className="w-4 h-4 accent-black"
                      />
                      <span className="text-[10px] font-black uppercase">{item.label}</span>
                    </label>
                  ))}
                </div>
              </section>

              <section>
                <h4 className="text-[11px] font-black uppercase mb-4 border-b-2 border-black pb-1">Turnos da Escala</h4>
                <div className="space-y-3">
                  {items.map((it) => (
                    <div key={it.id} className="flex gap-2 items-end bg-slate-50 p-3 rounded border border-black group">
                      <div className="flex-grow space-y-2">
                        <div className="flex gap-2">
                          <div className="w-1/3">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Rótulo</label>
                            <input 
                              className="w-full border-2 border-black p-1 text-[10px] font-bold" 
                              value={it.label} 
                              onChange={e => updateItem(it.id, 'label', e.target.value)}
                            />
                          </div>
                          <div className="w-2/3">
                            <label className="text-[9px] font-black text-slate-400 uppercase">Horário Padrão</label>
                            <input 
                              className="w-full border-2 border-black p-1 text-[10px]" 
                              value={it.defaultTime} 
                              onChange={e => updateItem(it.id, 'defaultTime', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeItem(it.id)} className="p-1 text-red-600 hover:bg-red-50 rounded">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                      </button>
                    </div>
                  ))}
                  <button onClick={addItem} className="w-full py-2 border-2 border-dashed border-black text-[10px] font-black uppercase hover:bg-slate-50">+ Adicionar Turno</button>
                </div>
              </section>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-100 border-t-2 border-black flex gap-4">
          <button onClick={onClose} className="flex-1 py-2 text-[10px] font-black uppercase border-2 border-black bg-white">Cancelar</button>
          <button 
            onClick={() => onSave(items, localConfig)} 
            className="flex-1 py-2 text-[10px] font-black uppercase bg-black text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
          >
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfigModal;
