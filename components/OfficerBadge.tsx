
import React from 'react';
import { Officer } from '../types';

interface Props {
  officer: Officer;
  onRemove?: () => void;
}

const OfficerBadge: React.FC<Props> = ({ officer, onRemove }) => {
  return (
    <div className="inline-flex items-center bg-slate-100 border border-slate-300 rounded px-2 py-0.5 text-xs font-medium mr-1 mb-1">
      <span className="text-blue-800 font-bold mr-1">{officer.rank}</span>
      <span className="text-slate-700 uppercase">{officer.name}</span>
      {onRemove && (
        <button 
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="ml-1 text-slate-400 hover:text-red-500 transition-colors"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default OfficerBadge;
