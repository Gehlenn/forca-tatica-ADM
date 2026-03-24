
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-black text-white p-6 shadow-2xl border-b-4 border-slate-800 print:hidden">
      <div className="container mx-auto flex items-center gap-8">
        {/* Logo da Força Tática - Lado Esquerdo */}
        <div className="flex-shrink-0">
          <img 
            src="https://raw.githubusercontent.com/lucas-moraes/pm-roster-assets/main/eagle-ft.png" 
            alt="Logo Força Tática" 
            className="w-44 h-36 object-contain brightness-125 contrast-125"
            style={{ filter: 'drop-shadow(0 0 15px rgba(255,255,255,0.3))' }}
            onError={(e) => {
              // Fallback caso a imagem customizada falhe
              e.currentTarget.src = "https://www.brigadamilitar.rs.gov.br/themes/standard/images/brasao_bm.png";
            }}
          />
        </div>

        {/* Informações Textuais Centrais */}
        <div className="flex flex-col justify-center flex-grow">
          <div className="mb-2 border-b-2 border-slate-700 pb-2">
            <h1 className="text-5xl font-black italic tracking-tighter leading-none mb-1 uppercase">FORÇA TÁTICA</h1>
          </div>
          
          <div className="flex flex-col">
            <span className="text-[16px] font-black uppercase tracking-[0.1em] text-slate-300">
              Brigada Militar / CRPO-VC / 5ºBPM / 1°CIA
            </span>
          </div>
        </div>

        {/* Lado Direito: Destaque RS */}
        <div className="hidden md:flex flex-col items-end gap-1">
          <span className="text-[22px] font-black uppercase tracking-[0.3em] leading-tight text-slate-400">Segurança Pública</span>
          <span className="text-[34px] font-black uppercase tracking-[0.1em] leading-tight text-white border-b-8 border-red-600">RIO GRANDE DO SUL</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
