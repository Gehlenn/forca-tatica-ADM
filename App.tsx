
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import ShiftCell from './components/ShiftCell';
import ShiftModal from './components/ShiftModal';
import OfficerModal from './components/OfficerModal';
import ConfigModal from './components/ConfigModal';
import LogbookView from './components/LogbookView';
import GseScaleView from './components/GseScaleView';
import GseJustifyView from './components/GseJustifyView';
import { INITIAL_OFFICERS, INITIAL_SHIFT_DEFINITIONS, STATUS_LABELS, MONTHS_OF_YEAR } from './constants';
import { Officer, RosterState, AppTab, GseEntry, GseJustifyEntry, DocumentMeta, DayColumn, ConfigState, ShiftRowDefinition, ShiftEntry } from './types';
import { analyzeScaleImage } from './services/geminiService';

const isWeekend = (weekday: string) => weekday.toLowerCase() === 'sábado' || weekday.toLowerCase() === 'domingo';

const App: React.FC = () => {
  const [officers, setOfficers] = useState<Officer[]>(() => {
    const saved = localStorage.getItem('pm_officers');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.map((o: Officer) => {
        const initial = INITIAL_OFFICERS.find(io => io.id === o.id);
        if (initial) {
          return { ...o, rank: initial.rank, fullName: initial.fullName, idFunc: initial.idFunc, credor: initial.credor, cpf: initial.cpf };
        }
        return o;
      });
    }
    return INITIAL_OFFICERS;
  });
  const [rosters, setRosters] = useState<Record<string, RosterState>>(() => {
    const saved = localStorage.getItem('pm_rosters');
    return saved ? JSON.parse(saved) : {};
  });
  const [roster, setRoster] = useState<RosterState | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('ESCALA');
  const [selectedMonth, setSelectedMonth] = useState('FEVEREIRO');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedWeek, setSelectedWeek] = useState('1'); 
  const [isScanning, setIsScanning] = useState(false);
  const [isEditingScale, setIsEditingScale] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [config, setConfig] = useState<ConfigState>(() => {
    const saved = localStorage.getItem('pm_config');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            showVtr: parsed.showVtr ?? true,
            showTime: parsed.showTime ?? true,
            showMission: parsed.showMission ?? true,
            showRank: parsed.showRank ?? true,
          };
        }
      } catch (e) {
        console.error("Error parsing config", e);
      }
    }
    return { showVtr: true, showTime: true, showMission: true, showRank: true };
  });
  const [showConfig, setShowConfig] = useState(false);

  const [gseEntries, setGseEntries] = useState<GseEntry[]>(() => {
    const saved = localStorage.getItem('pm_gse_entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [justifyEntries, setJustifyEntries] = useState<GseJustifyEntry[]>(() => {
    const saved = localStorage.getItem('pm_justify_entries');
    return saved ? JSON.parse(saved) : [];
  });
  const [logOverrides, setLogOverrides] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('pm_log_overrides');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem('pm_officers', JSON.stringify(officers));
  }, [officers]);

  useEffect(() => {
    localStorage.setItem('pm_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('pm_gse_entries', JSON.stringify(gseEntries));
  }, [gseEntries]);

  useEffect(() => {
    localStorage.setItem('pm_justify_entries', JSON.stringify(justifyEntries));
  }, [justifyEntries]);

  useEffect(() => {
    localStorage.setItem('pm_rosters', JSON.stringify(rosters));
  }, [rosters]);

  useEffect(() => {
    localStorage.setItem('pm_log_overrides', JSON.stringify(logOverrides));
  }, [logOverrides]);

  const filteredOfficers = useMemo(() => {
    return officers.filter(o => 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.idFunc.includes(searchTerm)
    );
  }, [officers, searchTerm]);

  const handleSaveConfig = (newDefs: ShiftRowDefinition[], newConfig: ConfigState) => {
    if (roster) {
      setRoster({ ...roster, shiftDefinitions: newDefs });
    }
    setConfig(newConfig);
    setShowConfig(false);
  };

  const syncRosterToLog = (dayIdx: number, rowId: string, entry: ShiftEntry) => {
    const day = roster?.days[dayIdx];
    if (!day) return;
    const dayNum = parseInt(day.date.split('/')[0]);
    
    entry.officers.forEach(offId => {
      const type = rowId === 'BH' ? 'BH' : (entry.type === 'SERVICO' ? 'SV' : 'EA');
      const key = `${offId}-${dayNum}-${type}`;
      const val = rowId === 'BH' ? '2' : (entry.timeRange?.includes('06') ? '06' : '12');
      
      setLogOverrides(prev => ({ ...prev, [key]: val }));
    });
  };

  const updateShift = (dayIdx: number, rowId: string, entry: ShiftEntry) => {
    if (!roster) return;
    const newDays = [...roster.days];
    newDays[dayIdx].shifts[rowId] = entry;
    const updatedRoster = { ...roster, days: newDays };
    setRoster(updatedRoster);
    setRosters(prev => ({ ...prev, [updatedRoster.id]: updatedRoster }));
    syncRosterToLog(dayIdx, rowId, entry);
    setEditingCell(null);
  };

  const handleLogOverride = (key: string, val: string) => {
    setLogOverrides(prev => ({ ...prev, [key]: val }));
    
    if (!roster) return;
    const [offId, dayStr, type] = key.split('-');
    const dayNum = parseInt(dayStr);

    const dayIdx = roster.days.findIndex(d => parseInt(d.date.split('/')[0]) === dayNum);
    if (dayIdx === -1) return;

    const newDays = [...roster.days];
    const day = newDays[dayIdx];

    let rowId = '';
    if (type === 'BH') rowId = 'BH';
    else if (type === 'SV') rowId = roster.shiftDefinitions[0]?.id || '1';
    else if (type === 'EA') rowId = 'EA';
    else if (type === 'GSE') rowId = 'GSE';
    
    if (!rowId) return;

    if (!day.shifts[rowId]) {
      day.shifts[rowId] = { id: Math.random().toString(), officers: [], type: 'SERVICO' };
    }

    const shift = day.shifts[rowId];
    
    if (val === '' || val === 'FG') {
      shift.officers = shift.officers.filter(id => id !== offId);
    } else {
      if (!shift.officers.includes(offId)) {
        shift.officers.push(offId);
      }
      if (val === '12') shift.timeRange = '06h às 18h';
      else if (val === '06') shift.timeRange = '06h às 12h';
      
      if (type === 'GSE') {
        shift.vtr = 'GSE';
      }
    }

    const updatedRoster = { ...roster, days: newDays };
    setRoster(updatedRoster);
    setRosters(prev => ({ ...prev, [updatedRoster.id]: updatedRoster }));
  };

  const [editingCell, setEditingCell] = useState<{ dayIdx: number, rowId: string } | null>(null);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const autoMeta = useMemo(() => {
    const qapOfficers = officers.filter(o => o.status === 'DISPONIVEL');
    const cmt = qapOfficers[0];
    const aux = qapOfficers[1];

    return {
      unit: '5º BATALHÃO DE POLÍCIA MILITAR',
      subUnit: 'FORÇA TÁTICA / 1ª CIA',
      city: 'MONTENEGRO',
      cmtFullName: cmt ? cmt.fullName : '---',
      cmtRankFunc: cmt ? `${cmt.rank} PM - Cmt da Força Tática/5ºBPM` : '---',
      auxFullName: aux ? aux.fullName : '---',
      auxRankFunc: aux ? `${aux.rank} PM - Aux Força Tática/5ºBPM` : '---',
      cmtPanel: cmt ? `${cmt.rank} PM ${cmt.name}` : '---',
      auxPanel: aux ? `${aux.rank} PM ${aux.name}` : '---',
      commanderName: cmt ? cmt.name : '---',
      auxName: aux ? aux.name : '---',
      commanderRank: 'Cmt — FORÇA TÁTICA / 5ºBPM',
      auxRank: 'Aux — FORÇA TÁTICA / 5ºBPM'
    };
  }, [officers]);

  const generateStatusObservations = (list: Officer[]) => {
    const specific = list.filter(o => o.status !== 'DISPONIVEL');
    if (specific.length === 0) return "NADA CONSTA.";
    return specific.map(o => `${o.rank} PM ${o.name}: ${STATUS_LABELS[o.status] || o.status}`).join('; ').toUpperCase();
  };

  useEffect(() => {
    const monthIndex = MONTHS_OF_YEAR.indexOf(selectedMonth);
    let firstFriday = 1;
    while (new Date(Number(selectedYear), monthIndex, firstFriday).getDay() !== 5) {
      firstFriday++;
    }

    const startDay = firstFriday + (Number(selectedWeek) - 1) * 7;
    const weekdays = ['sexta-feira', 'sábado', 'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira'];
    
    const dates = weekdays.map((weekday, i) => {
      const d = new Date(Number(selectedYear), monthIndex, startDay + i);
      const dayNum = d.getDate().toString().padStart(2, '0');
      const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
      return { date: `${dayNum}/${monthNum}/2026`, weekday };
    });

    const rosterId = `r-${selectedMonth}-${selectedWeek}`;
    
    if (rosters[rosterId]) {
      setRoster({
        ...rosters[rosterId],
        observations: generateStatusObservations(officers)
      });
    } else {
      const initialDays: DayColumn[] = dates.map((d) => ({ ...d, shifts: {} }));
      setRoster({
        id: rosterId,
        title: 'ESCALA SEMANAL DE SERVIÇO',
        startDate: dates[0].date,
        endDate: dates[6].date,
        days: initialDays,
        observations: generateStatusObservations(officers),
        shiftDefinitions: INITIAL_SHIFT_DEFINITIONS
      });
    }
  }, [selectedWeek, selectedMonth, selectedYear, officers, rosters]);

  // Auto-fill GSE based on Roster
  useEffect(() => {
    if (!roster) return;
    const newGse: GseEntry[] = [];
    const newJustify: GseJustifyEntry[] = [];

    roster.days.forEach(day => {
      Object.entries(day.shifts).forEach(([rowId, shift]: [string, ShiftEntry]) => {
        if (shift.type === 'SERVICO' && (rowId === 'BH' || shift.vtr?.includes('GSE'))) {
          const entryId = `gse-${day.date}-${rowId}`;
          newGse.push({
            id: entryId,
            date: day.date,
            time: shift.timeRange || '00h às 00h',
            extra: rowId === 'BH' ? '2' : '12',
            meIds: shift.officers,
            mission: shift.mission || 'PATRULHAMENTO'
          });

          shift.officers.forEach(offId => {
            newJustify.push({
              id: `justify-${offId}-${day.date}`,
              officerId: offId,
              date: day.date,
              he: rowId === 'BH' ? '2' : '12',
              turno: rowId,
              funcao: 'PATRULHEIRO'
            });
          });
        }
      });
    });

    setGseEntries(newGse);
    setJustifyEntries(newJustify);
  }, [roster]);

  const handleScanByTab = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const mimeType = file.type;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result?.toString().split(',')[1];
      if (base64) {
        let type: any = activeTab === 'LIVRO' ? 'LOGBOOK' : (activeTab === 'GSE_SCALE' ? 'GSE_SCALE' : 'GSE_JUSTIFY');
        if (activeTab === 'ESCALA') type = 'ROSTER';
        try {
          const result = await analyzeScaleImage(base64, officers, type, mimeType);
          if (result) {
            if (result.month) setSelectedMonth(result.month);
            if (result.year) setSelectedYear(result.year);
            if (result.week) setSelectedWeek(result.week);

            if (activeTab === 'GSE_SCALE' && result.entries) {
              setGseEntries(result.entries.map((r: any) => ({ ...r, id: Math.random().toString() })));
            }
            if (activeTab === 'GSE_JUSTIFY' && result.entries) {
              setJustifyEntries(result.entries.map((r: any) => ({ ...r, id: Math.random().toString() })));
            }
            if (activeTab === 'LIVRO' && result.overrides) {
              setLogOverrides(prev => ({ ...prev, ...result.overrides }));
            }
            if (activeTab === 'ESCALA' && result.updates && roster) {
              // Apply roster updates if needed
              alert("Escala digitalizada. Verifique os turnos.");
            }
            alert("Digitalizado com sucesso!");
          }
        } catch (err) { alert("Erro na leitura da IA."); }
      }
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-black font-mono pb-24">
      <Header />
      
      <div className="bg-white border-b-2 border-black sticky top-0 z-40 print:hidden shadow-lg">
        <div className="container mx-auto px-4 py-2 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="text-[11px] font-black border-2 border-black p-1 bg-white uppercase">
                {MONTHS_OF_YEAR.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <nav className="flex border-2 border-black rounded overflow-hidden">
                {(['ESCALA', 'LIVRO', 'GSE_SCALE', 'GSE_JUSTIFY'] as AppTab[]).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 text-[10px] font-black uppercase transition-all ${activeTab === tab ? 'bg-black text-white' : 'bg-white hover:bg-slate-100 border-r border-black last:border-0'}`}>
                    {tab === 'GSE_SCALE' ? 'ESCALA GSE' : tab === 'GSE_JUSTIFY' ? 'JUSTIFICATIVA GSE' : tab}
                  </button>
                ))}
              </nav>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowConfig(true)} className="p-2 border-2 border-black bg-white hover:bg-slate-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              </button>
              <button onClick={() => setIsEditingScale(!isEditingScale)} className={`px-4 py-2 text-[10px] font-black border-2 border-black ${isEditingScale ? 'bg-red-600 text-white' : 'bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}>
                {isEditingScale ? 'CONCLUIR' : 'EDITAR ESCALA'}
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 text-[10px] font-black border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-white transition-all">
                 {isScanning ? 'LENDO...' : 'IA VISION'}
              </button>
              <button onClick={() => window.print()} className="px-4 py-2 text-[10px] font-black border-2 border-black bg-black text-white">IMPRIMIR</button>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-50 border-2 border-black p-1">
            <svg className="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            <input 
              type="text" 
              placeholder="BUSCAR POLICIAL POR NOME OU ID FUNC..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="flex-grow bg-transparent text-[10px] font-black uppercase p-1 outline-none"
            />
          </div>
        </div>
      </div>

      <main className="container mx-auto p-4 flex-grow">
        {activeTab === 'ESCALA' && (
          <div className="flex flex-col gap-6">
            <div className="bg-white border-[3px] border-black p-1 mx-auto w-full max-w-[1250px] relative print:border-none print:p-0">
              {/* VISTO AMPLIADO E REPOSICIONADO PARA NÃO SOBREPOR A ESCALA */}
              <div className="absolute top-0 right-0 border-l-[3px] border-b-[3px] border-black p-4 bg-white z-10 w-80 h-40 flex flex-col items-center justify-start print:border-black">
                <span className="text-[12px] font-black uppercase mb-16 text-center leading-tight">Visto do Cmt da 1ª Cia / 5º BPM</span>
                <div className="w-full border-t border-black/40"></div>
              </div>

              {/* TÍTULO COM MARGEM SUPERIOR AUMENTADA PARA DESCER A ESCALA */}
              <div className="text-center mb-6 mt-48"> 
                <h2 className="text-[15px] font-black uppercase underline decoration-2 underline-offset-4 tracking-tight">
                  ESCALA DE SERVIÇO FORÇA-TÁTICA/1ªCIA/5ºBPM {roster?.startDate} À {roster?.endDate}
                </h2>
              </div>
              
              <table className="w-full border-collapse table-fixed border-[3px] border-black">
                <thead>
                  <tr className="bg-white text-black h-10">
                    <th className="w-12 text-[10px] font-black border-r-[3px] border-black bg-slate-100">TURNO</th>
                    {roster?.days.map((day, idx) => (
                      <th key={idx} className={`border-r-[3px] border-black text-center text-[10px] font-black uppercase ${isWeekend(day.weekday) ? 'bg-red-100/50' : 'bg-white'}`}>
                        <div className="border-b border-black/20 pb-0.5">{day.date}</div>
                        <div className="pt-0.5">{day.weekday}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {roster?.shiftDefinitions.map((def) => (
                    <tr key={def.id} className="border-b-[3px] border-black min-h-[45px]">
                      <td className="p-1 border-r-[3px] border-black font-black text-center text-[10px] bg-slate-50 uppercase italic leading-tight">
                        {def.label}
                      </td>
                      {roster.days.map((day, dIdx) => (
                        <td key={dIdx} className={`p-1 align-top border-r-[3px] border-black min-h-[45px] ${isWeekend(day.weekday) ? 'bg-red-50/50' : ''}`}>
                          <ShiftCell 
                            entry={day.shifts[def.id] || { id: Math.random().toString(), officers: [], type: 'SERVICO' }} 
                            officersList={officers}
                            config={config}
                            onClick={() => isEditingScale && setEditingCell({ dayIdx: dIdx, rowId: def.id })}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-[3px] border-black h-16">
                    <td className="p-1 border-r-[3px] border-black font-black text-center text-[10px] bg-slate-50 uppercase">OBS:</td>
                    <td colSpan={7} className="p-2 font-black text-red-700 text-[10px] uppercase align-top leading-tight">
                      {roster?.observations}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="mt-24 mb-12 flex justify-between px-24">
                <div className="flex flex-col items-center">
                  <div className="text-center text-[12px] font-black uppercase leading-tight">
                    ___________________________<br/>
                    {autoMeta.auxName}<br/>{autoMeta.auxRankFunc}
                  </div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="text-center text-[12px] font-black uppercase leading-tight">
                    ___________________________<br/>
                    {autoMeta.commanderName}<br/>{autoMeta.cmtRankFunc}
                  </div>
                </div>
              </div>

              <div className="mt-8 text-right text-[10px] font-black uppercase px-12 italic opacity-60">
                ATUALIZADA EM {roster?.startDate}
              </div>
            </div>
            
            <div className="flex gap-4 max-w-[1250px] mx-auto w-full print:hidden">
              <div className="w-1/4 bg-black text-white p-4 border-4 border-black shadow-lg">
                <h3 className="text-[10px] font-black uppercase italic mb-3 border-b border-slate-700 pb-1">Comando FT</h3>
                <div className="space-y-3">
                  <div className="p-2 bg-slate-900 border-l-4 border-green-500">
                    <span className="text-[7px] font-black uppercase text-green-500 block mb-1">Cmt da Força Tática</span>
                    <span className="text-[12px] font-black uppercase">{autoMeta.cmtPanel}</span>
                  </div>
                  <div className="p-2 bg-slate-900 border-l-4 border-blue-500">
                    <span className="text-[7px] font-black uppercase text-blue-500 block mb-1">Aux Força Tática</span>
                    <span className="text-[12px] font-black uppercase">{autoMeta.auxPanel}</span>
                  </div>
                </div>
              </div>

              <div className="w-3/4 bg-white p-4 border-4 border-black shadow-lg">
                <div className="flex justify-between items-center mb-3 border-b-2 border-black pb-1">
                  <h3 className="text-[10px] font-black uppercase italic">Situação do efetivo</h3>
                  <button onClick={() => setIsEditingStaff(!isEditingStaff)} className="text-[9px] font-black border-2 border-black px-3 py-1 uppercase hover:bg-black hover:text-white transition-all">
                    {isEditingStaff ? 'Salvar Efetivo' : 'Editar Efetivo'}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {officers.map(off => (
                    <div key={off.id} onClick={() => isEditingStaff && setEditingOfficer(off)} className={`p-1.5 border-2 border-black flex justify-between items-center transition-transform hover:scale-[1.02] ${off.status === 'DISPONIVEL' ? 'bg-white' : 'bg-red-50'}`}>
                      <span className="text-[9px] font-black uppercase">{off.rank} {off.name}</span>
                      <span className={`text-[7px] font-black px-1 rounded ${off.status === 'DISPONIVEL' ? 'bg-green-600 text-white' : 'bg-slate-200 text-black'}`}>
                        {STATUS_LABELS[off.status]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'LIVRO' && roster && (
          <LogbookView 
            roster={roster} 
            officers={filteredOfficers} 
            overrides={logOverrides}
            onOverride={handleLogOverride}
            isEditing={isEditingScale}
            meta={autoMeta as any}
          />
        )}
        {activeTab === 'GSE_SCALE' && <GseScaleView month={selectedMonth} officers={officers} entries={gseEntries} onUpdate={setGseEntries} meta={autoMeta as any} isEditing={isEditingScale} />}
        {activeTab === 'GSE_JUSTIFY' && <GseJustifyView month={selectedMonth} officers={officers} entries={justifyEntries} onUpdate={setJustifyEntries} meta={autoMeta as any} isEditing={isEditingScale} />}
      </main>

      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleScanByTab} />

      {showConfig && (
        <ConfigModal 
          definitions={roster?.shiftDefinitions || INITIAL_SHIFT_DEFINITIONS} 
          config={config}
          onSave={handleSaveConfig} 
          onClose={() => setShowConfig(false)} 
        />
      )}

      {editingCell && roster && (
        <ShiftModal 
          entry={roster.days[editingCell.dayIdx].shifts[editingCell.rowId] || { id: '', officers: [], type: 'SERVICO' }} 
          officersList={filteredOfficers} 
          onSave={(entry) => updateShift(editingCell.dayIdx, editingCell.rowId, entry)} 
          onClose={() => setEditingCell(null)} 
        />
      )}
      {editingOfficer && <OfficerModal officer={editingOfficer} onSave={off => { setOfficers(officers.map(o => o.id === off.id ? off : o)); setEditingOfficer(null); }} onClose={() => setEditingOfficer(null)} />}
    </div>
  );
};

export default App;
