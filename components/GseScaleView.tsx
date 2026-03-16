
import React from 'react';
import { Officer, GseEntry, DocumentMeta } from '../types';

interface Props {
  month: string;
  officers: Officer[];
  entries: GseEntry[];
  onUpdate: (entries: GseEntry[]) => void;
  meta: DocumentMeta;
  isEditing: boolean;
}

const GseScaleView: React.FC<Props> = ({ month, officers, entries, onUpdate, meta, isEditing }) => {
  const addRow = () => {
    const newEntry: GseEntry = {
      id: Math.random().toString(),
      date: '01/02/2026',
      time: '17H ÀS 05H',
      extra: '12H',
      meIds: [],
      mission: 'PATRULHAMENTO TÁTICO MOTORIZADO'
    };
    onUpdate([...entries, newEntry]);
  };

  const updateEntry = (id: string, field: keyof GseEntry, val: any) => {
    onUpdate(entries.map(e => e.id === id ? { ...e, [field]: val } : e));
  };

  return (
    <div className="bg-white p-8 font-sans text-black max-w-[900px] mx-auto print:p-0">
      <div className="text-center mb-6">
        <h2 className="text-[14px] font-black uppercase underline decoration-1 underline-offset-4">
          ESCALA DE SERVIÇO EXTRAORDINÁRIA FORÇA TÁTICA/1ªCIA/5ºBPM - {month} 2026
        </h2>
      </div>

      <table className="w-full border-collapse border-2 border-black text-[10px]">
        <thead>
          <tr className="uppercase font-black text-center h-10 bg-slate-50">
            <th className="border border-black w-[100px]">DATA</th>
            <th className="border border-black w-[100px]">HORÁRIO</th>
            <th className="border border-black w-[80px]">HORA EXTRA</th>
            <th className="border border-black w-[200px]">MILITAR ESTADUAL</th>
            <th className="border border-black">MISSÃO</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((row) => (
            <tr key={row.id} className="border border-black min-h-[40px]">
              <td className="border border-black p-2 text-center font-bold">
                <input readOnly={!isEditing} className="w-full text-center bg-transparent uppercase outline-none" value={row.date} onChange={e => updateEntry(row.id, 'date', e.target.value)} />
              </td>
              <td className="border border-black p-2 text-center font-bold">
                <input readOnly={!isEditing} className="w-full text-center bg-transparent uppercase outline-none" value={row.time} onChange={e => updateEntry(row.id, 'time', e.target.value)} />
              </td>
              <td className="border border-black p-2 text-center font-bold">
                <input readOnly={!isEditing} className="w-full text-center bg-transparent uppercase outline-none" value={row.extra} onChange={e => updateEntry(row.id, 'extra', e.target.value)} />
              </td>
              <td className="border border-black p-2 font-bold leading-tight">
                {row.meIds.map(id => {
                  const off = officers.find(o => o.id === id);
                  return <div key={id} className="uppercase">{off?.rank} {off?.name}</div>;
                })}
                {isEditing && (
                  <select className="w-full mt-1 text-[8px] print:hidden" value="" onChange={e => e.target.value && updateEntry(row.id, 'meIds', [...row.meIds, e.target.value])}>
                    <option value="">+ PM</option>
                    {officers.map(o => <option key={o.id} value={o.id}>{o.rank} {o.name}</option>)}
                  </select>
                )}
              </td>
              <td className="border border-black p-2 text-center font-bold uppercase text-[9px]">
                <textarea readOnly={!isEditing} rows={2} className="w-full bg-transparent text-center resize-none outline-none" value={row.mission} onChange={e => updateEntry(row.id, 'mission', e.target.value)} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-8 text-right text-[11px] font-bold">
        Montenegro, RS, 28 de {month} de 2026
      </div>

      <div className="mt-12 flex flex-col items-center">
        <div className="text-center text-[11px] font-black uppercase leading-tight">
          ___________________________<br/>
          {meta.commanderName}<br/>
          {meta.cmtRankFunc || `${officers.find(o => o.name === meta.commanderName)?.rank} PM - Cmt da Força Tática/5ºBPM`}
        </div>
      </div>
    </div>
  );
};

export default GseScaleView;
