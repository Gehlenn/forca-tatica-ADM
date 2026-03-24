
import React, { useState } from 'react';
import { Officer, OfficerStatus } from '../types';
import { STATUS_LABELS } from '../constants';

interface Props {
  officer: Officer;
  onSave: (officer: Officer) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

const OfficerModal: React.FC<Props> = ({ officer, onSave, onDelete, onClose }) => {
  const [edited, setEdited] = useState<Officer>({ ...officer });
  const [fullMonth, setFullMonth] = useState(!officer.statusStart);

  const handleFullMonthToggle = (checked: boolean) => {
    setFullMonth(checked);
    if (checked) {
      setEdited({ ...edited, statusStart: undefined, statusEnd: undefined });
    } else {
      const today = new Date();
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
      setEdited({ ...edited, statusStart: firstDay, statusEnd: lastDay });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-300 font-mono">
        <div className="bg-[#002b5c] text-white p-4 flex justify-between items-center">
          <h3 className="font-bold uppercase text-sm tracking-widest">Ficha Cadastral do Militar</h3>
          <button onClick={onClose} className="text-xl">&times;</button>
        </div>
        
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-3 pb-3 border-b">
            <div className="col-span-2">
              <label className="block text-[9px] font-black text-slate-400 uppercase">Nome Completo</label>
              <input 
                className="w-full border-b border-black p-1 text-xs font-black uppercase outline-none focus:border-blue-500" 
                value={edited.fullName} 
                onChange={e => setEdited({ ...edited, fullName: e.target.value })}
                placeholder="EX: JOÃO SILVA DOS SANTOS"
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase">Posto/Graduação</label>
              <select 
                className="w-full border-b border-black p-1 text-xs font-black uppercase outline-none focus:border-blue-500 bg-white" 
                value={edited.rank} 
                onChange={e => setEdited({ ...edited, rank: e.target.value as any })}
              >
                <option value="SD">SD</option>
                <option value="2ºSGT">2ºSGT</option>
                <option value="1ºSGT">1ºSGT</option>
                <option value="TEN">TEN</option>
                <option value="CAP">CAP</option>
                <option value="MAJ">MAJ</option>
              </select>
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase">Nome de Guerra</label>
              <input 
                className="w-full border-b border-black p-1 text-xs font-black uppercase outline-none focus:border-blue-500" 
                value={edited.name} 
                onChange={e => setEdited({ ...edited, name: e.target.value })}
                placeholder="EX: SILVA"
              />
            </div>
          </div>

          {/* Dados Administrativos */}
          <div className="grid grid-cols-3 gap-3 pb-3 border-b">
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase">ID Funcional</label>
              <input 
                className="w-full border-b border-black p-1 text-xs font-black outline-none focus:border-blue-500" 
                value={edited.idFunc} 
                onChange={e => setEdited({ ...edited, idFunc: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase">Credor</label>
              <input 
                className="w-full border-b border-black p-1 text-xs font-black outline-none focus:border-blue-500" 
                value={edited.credor} 
                onChange={e => setEdited({ ...edited, credor: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-400 uppercase">CPF</label>
              <input 
                className="w-full border-b border-black p-1 text-xs font-black outline-none focus:border-blue-500" 
                value={edited.cpf} 
                onChange={e => setEdited({ ...edited, cpf: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase mb-1 tracking-tighter">Status Operacional / Motivo Afastamento</label>
              <select 
                className="w-full border-2 border-black p-2.5 text-sm bg-white font-black uppercase outline-none focus:ring-2 focus:ring-blue-500"
                value={edited.status}
                onChange={e => setEdited({ ...edited, status: e.target.value as OfficerStatus })}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>

            {edited.status !== 'DISPONIVEL' && (
              <div className="bg-slate-50 p-4 border-2 border-dashed border-slate-300 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-600">Período do Afastamento</span>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={fullMonth} 
                      onChange={e => handleFullMonthToggle(e.target.checked)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span className="text-[9px] font-black uppercase">Mês Todo</span>
                  </label>
                </div>

                {!fullMonth && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase">Data Início</label>
                      <input 
                        type="date" 
                        value={edited.statusStart || ''} 
                        onChange={e => setEdited({ ...edited, statusStart: e.target.value })}
                        className="w-full border border-black p-2 text-xs font-black"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-slate-400 uppercase">Data Fim</label>
                      <input 
                        type="date" 
                        value={edited.statusEnd || ''} 
                        onChange={e => setEdited({ ...edited, statusEnd: e.target.value })}
                        className="w-full border border-black p-2 text-xs font-black"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-4 bg-slate-100 flex gap-2 border-t-2 border-black">
          {onDelete && (
            <button 
              onClick={() => {
                if (window.confirm('Tem certeza que deseja excluir este militar?')) {
                  onDelete(officer.id);
                }
              }} 
              className="px-4 py-3 text-xs font-black bg-red-600 text-white uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:bg-red-700 transition-all"
            >
              Excluir
            </button>
          )}
          <button onClick={onClose} className="flex-1 py-3 text-xs font-black text-slate-500 hover:bg-slate-200 uppercase border-2 border-transparent">Cancelar</button>
          <button 
            onClick={() => onSave(edited)} 
            className="flex-1 py-3 text-xs font-black bg-black text-white uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] active:translate-y-0.5 active:shadow-none transition-all"
          >
            Salvar Registro
          </button>
        </div>
      </div>
    </div>
  );
};

export default OfficerModal;
