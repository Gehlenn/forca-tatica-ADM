
import React from 'react';
import { ShiftEntry, Officer, ConfigState } from '../types';

interface Props {
  entry: ShiftEntry;
  officersList: Officer[];
  config?: ConfigState;
  onClick: () => void;
}

const ShiftCell: React.FC<Props> = ({ entry, officersList, config = { showVtr: true, showTime: true, showMission: true, showRank: true }, onClick }) => {
  const isFolga = entry.type === 'FOLGA';
  const isTreinamento = entry.type === 'TREINAMENTO';
  
  const getEntryStyles = () => {
    if (isFolga) return 'bg-transparent text-slate-400 italic';
    if (isTreinamento) return 'bg-white text-red-600 border-l-2 border-red-500';
    return 'bg-transparent hover:bg-slate-50/50';
  };

  const hasContent = entry.vtr || entry.timeRange || entry.officers.length > 0;

  return (
    <div 
      onClick={onClick}
      className={`h-full w-full p-0.5 border-slate-100 flex flex-col justify-center overflow-hidden transition-all ${getEntryStyles()} ${!hasContent ? 'min-h-[20px]' : 'min-h-[24px]'}`}
    >
      {isFolga ? (
        <div className="flex items-center justify-center h-full opacity-30">
          <span className="uppercase text-[7px] font-black">Folga</span>
        </div>
      ) : (
        <div className="flex flex-col h-full justify-center">
          {((config.showVtr && entry.vtr) || (config.showTime && entry.timeRange) || isTreinamento) && (
            <div className="text-red-600 font-black uppercase text-[7px] leading-none mb-0.5 truncate">
              {isTreinamento ? 'TREINAMENTO' : `${config.showVtr ? entry.vtr : ''} ${config.showTime ? entry.timeRange : ''}`}
            </div>
          )}

          <div className="flex flex-col">
            {entry.officers.map(id => {
              const off = officersList.find(o => o.id === id);
              if (!off) return null;
              return (
                <div key={id} className="font-bold text-slate-800 uppercase text-[8px] leading-[1.1] truncate">
                  {config.showRank ? `${off.rank} PM ` : ''}{off.name}
                </div>
              );
            })}
          </div>
          
          {config.showMission && entry.mission && (
            <div className="text-[6px] text-slate-500 italic truncate mt-0.5">
              {entry.mission}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShiftCell;
