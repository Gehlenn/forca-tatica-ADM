
import React, { useMemo } from 'react';
import { RosterState, Officer, DocumentMeta } from '../types';
import { MONTHS_OF_YEAR } from '../constants';

interface Props {
  roster: RosterState;
  officers: Officer[];
  overrides: Record<string, string>;
  onOverride: (key: string, val: string) => void;
  isEditing: boolean;
  meta: DocumentMeta;
}

const LogbookView: React.FC<Props> = ({ roster, officers, overrides, onOverride, isEditing, meta }) => {
  const monthName = roster.id.split('-')[1];
  const monthIndex = MONTHS_OF_YEAR.indexOf(monthName);
  
  const daysInMonth = useMemo(() => {
    return new Date(2026, monthIndex + 1, 0).getDate();
  }, [monthIndex]);

  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const getDayValue = (off: Officer, day: number, type: string) => {
    const overrideKey = `${off.id}-${day}-${type}`;
    if (overrides[overrideKey] !== undefined) return overrides[overrideKey];

    if (off.status === 'EDT' && type === 'SV') return day <= 22 ? 'EDT' : '';
    if (off.status === 'LTS' && type === 'SV') return 'LTS';
    if (off.status === 'FERIAS' && type === 'SV') return 'FER';

    if (off.status === 'DISPONIVEL' || (off.status === 'EDT' && day > 22)) {
      if (type === 'SV') return day % 2 === 0 ? '12' : 'FG';
      if (type === 'GSE' && [15, 22].includes(day)) return '12';
      if (type === 'BH' && [15, 22].includes(day)) return '2';
    }
    return '';
  };

  return (
    <div className="bg-white p-4 font-mono text-black print:p-0">
      <div className="border-2 border-black p-2 text-center mb-4 mx-auto max-w-[800px]">
        <h2 className="text-[12px] font-black uppercase">
          PLANILHA DE TRABALHO DO FT/5º BPM REFERENTE AO MÊS DE {monthName} DE 2026
        </h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[8px] border-2 border-black">
          <thead>
            <tr className="h-8">
              <th className="border-2 border-black p-1 w-[220px] text-center font-black bg-slate-50">FORÇA TÁTICA</th>
              <th className="border-2 border-black p-0 w-[24px] text-center font-black">Tipo</th>
              {daysArray.map(d => (
                <th key={d} className="border border-black p-0 w-[24px] text-center font-bold">{d}</th>
              ))}
              <th className="border-2 border-black p-0 w-[35px] text-center font-black bg-slate-100">Soma hs</th>
              <th className="border-2 border-black p-0 w-[35px] text-center font-black bg-slate-100">Total Hs</th>
              <th className="border-2 border-black p-0 w-[35px] text-center font-black bg-slate-100">GSE</th>
            </tr>
          </thead>
          <tbody>
            {officers.map((off, oIdx) => {
              const rows = ['SV', 'EA', 'IE', 'GSE', 'BH'];
              
              const rowTotals = rows.reduce((acc, type) => {
                const total = daysArray.reduce((sum, d) => {
                  const val = getDayValue(off, d, type);
                  const num = parseInt(val);
                  return sum + (isNaN(num) ? 0 : num);
                }, 0);
                acc[type] = total;
                return acc;
              }, {} as Record<string, number>);

              const totalHs = rowTotals['SV'] + rowTotals['EA'] + rowTotals['IE'] + rowTotals['BH'];
              const gseTotal = rowTotals['GSE'];

              return (
                <React.Fragment key={off.id}>
                  {rows.map((type, rIdx) => (
                    <tr key={type} className="h-5">
                      {rIdx === 0 && (
                        <td rowSpan={5} className="border-2 border-black p-1 bg-white align-top">
                          <div className="text-[9px] font-black uppercase underline">{off.rank} {off.name}</div>
                          <div className="text-[7px] font-bold mt-0.5">ID FUNC: {off.idFunc}</div>
                          <div className="text-[7px] font-bold">CREDOR: {off.credor}</div>
                          <div className="text-[7px] font-bold">CPF: {off.cpf}</div>
                        </td>
                      )}
                      <td className="border border-black p-0 text-center font-black bg-slate-50">{type}</td>
                      {daysArray.map(d => {
                        const val = getDayValue(off, d, type);
                        return (
                          <td 
                            key={d} 
                            className={`border border-black p-0 text-center text-[8px] font-bold ${isEditing ? 'bg-yellow-50' : ''}`}
                          >
                            {isEditing ? (
                              <input 
                                className="w-full h-full text-center bg-transparent outline-none uppercase"
                                value={val}
                                onChange={(e) => onOverride(`${off.id}-${d}-${type}`, e.target.value.toUpperCase())}
                              />
                            ) : val}
                          </td>
                        );
                      })}
                      <td className="border border-black p-0 text-center font-black bg-slate-50">
                        {rowTotals[type] || ''}
                      </td>
                      {rIdx === 0 && (
                        <>
                          <td rowSpan={5} className="border-2 border-black p-0 text-center font-black bg-slate-50">{totalHs}</td>
                          <td rowSpan={5} className="border-2 border-black p-0 text-center font-black bg-slate-50">{gseTotal}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legenda Estilo Foto 3 */}
      <div className="mt-4 grid grid-cols-3 gap-4 border-2 border-black p-2 text-[7px] font-bold uppercase">
        <div>
          AGA-Agregação Administrativa; C-Curso; D-Dispensa; FER-Férias; LTS-Licença para Tratamento de Saúde; FG-Folga; FN-Falta Não Justificada;
        </div>
        <div>
          EF-Educação Física; OG-Operação Golfinho; LAA-Licença Especial para Fins de Aposentadoria; R-Reserva; OC-Operação Canarinho; AD-Adisposição;
        </div>
        <div>
          Gala ou Núpcias; VS-Viagem a serviço; DAP-Desempenho Atividade Prisional; LNJ-Licença Nojo ou Luto; C-Curso; LGE-Licença Gestante; EDT-Em Deslocamento Temporário
        </div>
      </div>
    </div>
  );
};

export default LogbookView;
