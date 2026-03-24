
import React from 'react';
import { ShiftEntry, Officer, ConfigState } from '../types';

interface Props {
  entries: ShiftEntry[];
  officersList: Officer[];
  config?: ConfigState;
  onClick: () => void;
}

const ShiftCell: React.FC<Props> = ({ entries = [], officersList, config = { showVtr: true, showTime: true, showMission: true, showRank: true }, onClick }) => {
  const hasContent = entries.length > 0;

  return (
    <div 
      onClick={onClick}
      className={`h-full w-full p-0.5 border-slate-100 flex flex-col justify-center overflow-hidden transition-all hover:bg-slate-50/50 ${!hasContent ? 'min-h-[20px]' : 'min-h-[24px]'}`}
    >
      {entries.map((entry, idx) => {
        const isFolga = entry.type === 'FOLGA';
        const hasType = entry.type && entry.type.trim().length > 0;

        return (
          <div key={entry.id || idx} className={`flex flex-col h-full justify-center ${idx > 0 ? 'mt-1 border-t border-slate-100 pt-1' : ''}`}>
            {isFolga ? (
              <div className="flex items-center justify-center h-full opacity-30">
                <span className="uppercase text-[7px] font-black">Folga</span>
              </div>
            ) : (
              <>
                {hasType && entry.type !== 'SERVICO' && (
                  <div className="text-red-600 font-black uppercase text-[7px] leading-none mb-0.5 truncate">
                    {entry.type}
                  </div>
                )}

                {((config.showVtr && entry.vtr) || (config.showTime && entry.timeRange)) && (
                  <div className="text-red-600 font-black uppercase text-[7px] leading-none mb-0.5 truncate">
                    {config.showVtr ? entry.vtr : ''} {config.showTime ? entry.timeRange : ''}
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
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ShiftCell;
