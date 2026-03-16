
import React from 'react';
import { Officer, GseJustifyEntry, DocumentMeta } from '../types';

interface Props {
  month: string;
  officers: Officer[];
  entries: GseJustifyEntry[];
  onUpdate: (entries: GseJustifyEntry[]) => void;
  meta: DocumentMeta;
  isEditing: boolean;
}

const GseJustifyView: React.FC<Props> = ({ month, officers, entries, onUpdate, meta, isEditing }) => {
  const updateEntry = (id: string, field: keyof GseJustifyEntry, val: string) => {
    onUpdate(entries.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  return (
    <div className="bg-white p-10 font-sans text-black max-w-[950px] mx-auto print:p-0">
      <div className="text-center mb-8 uppercase text-[12px] font-bold">
        ESTADO DO RIO GRANDE DO SUL<br/>
        SECRETARIA DA SEGURANÇA PÚBLICA<br/>
        BRIGADA MILITAR/CRPO-VC/5ºBPM
      </div>

      <div className="mb-6 px-4">
        <p className="text-justify text-[11px] font-bold leading-relaxed">
          Relatório dos Militares Estaduais que excederam a carga horária durante o emprego na escala ordinária do mês de {month} de 2026, e que receberão gratificação de serviço extraordinário, conforme o disposto na NI 033.2, número 3, letra d, item 1, letra e; e no número 3, letra e, item 1, letra a.
        </p>
      </div>

      <table className="w-full border-collapse border-2 border-black text-[10px]">
        <thead>
          <tr className="bg-slate-50 font-black text-center h-10 uppercase">
            <th className="border border-black w-16">Grad.</th>
            <th className="border border-black">Nome</th>
            <th className="border border-black w-24">Id Func.</th>
            <th className="border border-black w-28">Dia/Mês/Ano</th>
            <th className="border border-black w-12">HE</th>
            <th className="border border-black w-16">Turno</th>
            <th className="border border-black w-24">Função</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row) => {
            const off = officers.find(o => o.id === row.officerId);
            return (
              <tr key={row.id} className="h-10">
                <td className="border border-black text-center font-bold">{off?.rank} PM</td>
                <td className="border border-black px-2 font-black uppercase">
                   <select disabled={!isEditing} className="w-full bg-transparent outline-none appearance-none" value={row.officerId} onChange={e => updateEntry(row.id, 'officerId', e.target.value)}>
                    {officers.map(o => <option key={o.id} value={o.id}>{o.rank} PM {o.name}</option>)}
                   </select>
                </td>
                <td className="border border-black text-center font-bold">{off?.idFunc}</td>
                <td className="border border-black text-center">
                  <input readOnly={!isEditing} className="w-full text-center bg-transparent outline-none" value={row.date} onChange={e => updateEntry(row.id, 'date', e.target.value)} />
                </td>
                <td className="border border-black text-center font-bold">{row.he}</td>
                <td className="border border-black text-center">{row.turno}</td>
                <td className="border border-black text-center font-bold">{row.funcao}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-10 text-center text-[11px] font-bold mb-12">
        Montenegro, RS, 31 de {month} de 2026.
      </div>

      <div className="grid grid-cols-2 gap-20 px-4 mt-8">
        <div className="flex flex-col items-center">
          <div className="text-center text-[10px] font-black uppercase leading-tight">
            ___________________________<br/>
            {meta.auxName}<br/>{meta.auxRankFunc || `${officers.find(o => o.name === meta.auxName)?.rank} PM - Aux Força Tática/5ºBPM`}
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="text-center text-[10px] font-black uppercase leading-tight">
            ___________________________<br/>
            {meta.commanderName}<br/>{meta.cmtRankFunc || `${officers.find(o => o.name === meta.commanderName)?.rank} PM - Cmt da Força Tática/5ºBPM`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GseJustifyView;
