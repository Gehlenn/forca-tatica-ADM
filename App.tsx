
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Header from './components/Header';
import ShiftCell from './components/ShiftCell';
import ShiftModal from './components/ShiftModal';
import OfficerModal from './components/OfficerModal';
import ConfigModal from './components/ConfigModal';
import LogbookView from './components/LogbookView';
import GseScaleView from './components/GseScaleView';
import GseJustifyView from './components/GseJustifyView';
import AiAssistant from './components/AiAssistant';
import { INITIAL_OFFICERS, INITIAL_SHIFT_DEFINITIONS, STATUS_LABELS, MONTHS_OF_YEAR } from './constants';
import { Officer, RosterState, AppTab, GseEntry, GseJustifyEntry, DocumentMeta, DayColumn, ConfigState, ShiftRowDefinition, ShiftEntry } from './types';
import { analyzeScaleImage } from './services/geminiService';
import { api } from './src/api';

const isWeekend = (weekday: string) => weekday.toLowerCase() === 'sábado' || weekday.toLowerCase() === 'domingo';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [officers, setOfficers] = useState<Officer[]>(INITIAL_OFFICERS);
  const [rosters, setRosters] = useState<Record<string, RosterState>>({});
  const [roster, setRoster] = useState<RosterState | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('ESCALA');
  const [selectedMonth, setSelectedMonth] = useState('FEVEREIRO');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [selectedWeek, setSelectedWeek] = useState('1'); 
  const [isScanning, setIsScanning] = useState(false);
  const [isEditingScale, setIsEditingScale] = useState(false);
  const [isEditingStaff, setIsEditingStaff] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [config, setConfig] = useState<ConfigState>({ showVtr: true, showTime: true, showMission: true, showRank: true });
  const [showConfig, setShowConfig] = useState(false);

  const [gseEntries, setGseEntries] = useState<GseEntry[]>([]);
  const [justifyEntries, setJustifyEntries] = useState<GseJustifyEntry[]>([]);
  const [logOverrides, setLogOverrides] = useState<Record<string, string>>({});
  const isSavingRef = useRef(false);

  // Auth Mock (since we moved away from Firebase)
  useEffect(() => {
    const savedUser = localStorage.getItem('gestor_user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setIsAuthReady(true);
  }, []);

  // API Sync
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      if (isSavingRef.current) return;
      try {
        const offData = await api.get('officers');
        if (Array.isArray(offData) && offData.length > 0) {
          // Sort by order_index just in case
          const sorted = [...offData].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          setOfficers(sorted);
        } else if (Array.isArray(offData)) {
          // Initialize with defaults if empty, preserving order
          for (let i = 0; i < INITIAL_OFFICERS.length; i++) {
            const off = { ...INITIAL_OFFICERS[i], order_index: i };
            await api.post('officers', off);
          }
          const initialized = INITIAL_OFFICERS.map((o, i) => ({ ...o, order_index: i }));
          setOfficers(initialized);
        }

        const rosterData = await api.get('rosters');
        const rosterMap: Record<string, RosterState> = {};
        if (Array.isArray(rosterData)) {
          rosterData.forEach((r: any) => { if (r && r.id) rosterMap[r.id] = r; });
        }
        setRosters(rosterMap);

        const configData = await api.get('config');
        if (Array.isArray(configData) && configData.length > 0) setConfig(configData[0]);

        const overrideData = await api.get('log_overrides');
        const overrideMap: Record<string, string> = {};
        if (Array.isArray(overrideData)) {
          overrideData.forEach((o: any) => { if (o && o.id) overrideMap[o.id] = o.val; });
        }
        setLogOverrides(overrideMap);

        const gseData = await api.get('gse_entries');
        if (Array.isArray(gseData)) setGseEntries(gseData);

        const justifyData = await api.get('justify_entries');
        if (Array.isArray(justifyData)) setJustifyEntries(justifyData);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
    // In a real app, we'd use WebSockets or polling for "real-time"
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  // Persist Changes to API
  const saveOfficer = async (off: Officer) => {
    isSavingRef.current = true;
    try {
      // Ensure we keep the order_index
      const existing = officers.find(o => o.id === off.id);
      const toSave = { ...off, order_index: existing?.order_index ?? officers.length };
      await api.post('officers', toSave);
      setOfficers(prev => prev.map(o => o.id === off.id ? toSave : o));
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    } catch (err) { 
      console.error(err); 
      isSavingRef.current = false;
    }
  };

  const addOfficer = async (off: Officer) => {
    isSavingRef.current = true;
    try {
      const toSave = { ...off, order_index: officers.length };
      await api.post('officers', toSave);
      setOfficers(prev => [...prev, toSave]);
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    } catch (err) { 
      console.error(err); 
      isSavingRef.current = false;
    }
  };

  const deleteOfficer = async (id: string) => {
    isSavingRef.current = true;
    try {
      await api.delete('officers', id);
      setOfficers(prev => prev.filter(o => o.id !== id));
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    } catch (err) { 
      console.error(err); 
      isSavingRef.current = false;
    }
  };

  const saveRoster = async (r: RosterState) => {
    isSavingRef.current = true;
    try {
      await api.post('rosters', r);
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    } catch (err) { 
      console.error(err); 
      isSavingRef.current = false;
    }
  };

  const saveConfig = async (c: ConfigState) => {
    isSavingRef.current = true;
    try {
      await api.post('config', { ...c, id: 'main' });
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    } catch (err) { 
      console.error(err); 
      isSavingRef.current = false;
    }
  };

  const saveOverride = async (key: string, val: string) => {
    isSavingRef.current = true;
    try {
      await api.post('log_overrides', { id: key, val });
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    } catch (err) { 
      console.error(err); 
      isSavingRef.current = false;
    }
  };

  const saveGseEntries = async (entries: GseEntry[]) => {
    isSavingRef.current = true;
    try {
      for (const entry of entries) {
        await api.post('gse_entries', entry);
      }
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    } catch (err) { 
      console.error(err); 
      isSavingRef.current = false;
    }
  };

  const saveJustifyEntries = async (entries: GseJustifyEntry[]) => {
    isSavingRef.current = true;
    try {
      for (const entry of entries) {
        await api.post('justify_entries', entry);
      }
      setTimeout(() => { isSavingRef.current = false; }, 2000);
    } catch (err) { 
      console.error(err); 
      isSavingRef.current = false;
    }
  };

  const filteredOfficers = useMemo(() => {
    return officers.filter(o => 
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      o.idFunc.includes(searchTerm)
    );
  }, [officers, searchTerm]);

  const handleSaveConfig = (newDefs: ShiftRowDefinition[], newConfig: ConfigState) => {
    if (roster) {
      const updatedRoster = { ...roster, shiftDefinitions: newDefs };
      setRoster(updatedRoster);
      saveRoster(updatedRoster);
    }
    setConfig(newConfig);
    saveConfig(newConfig);
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
      saveOverride(key, val);

      // If it's a GSE shift, also set GSE row in logbook
      if (entry.vtr === 'GSE' || rowId === 'GSE') {
        saveOverride(`${offId}-${dayNum}-GSE`, '12');
      }
    });
  };

  const getTurnosForTimeRange = (timeRange: string): string[] => {
    const match = timeRange.match(/(\d+)h\s+às\s+(\d+)h/i);
    if (!match) return [];
    
    let start = parseInt(match[1]);
    let end = parseInt(match[2]);
    
    if (end <= start) end += 24; // Handle overnight
    
    const turnos = [
      { id: '1T', start: 0, end: 6 },
      { id: '2T', start: 6, end: 12 },
      { id: '3T', start: 12, end: 18 },
      { id: '4T', start: 18, end: 24 },
      { id: '1T_NEXT', start: 24, end: 30 }, // Next day dawn
    ];
    
    const result: string[] = [];
    const overlaps: { id: string, overlap: number }[] = [];

    turnos.forEach(t => {
      const overlapStart = Math.max(start, t.start);
      const overlapEnd = Math.min(end, t.end);
      const overlap = Math.max(0, overlapEnd - overlapStart);
      if (overlap > 0) {
        overlaps.push({ id: t.id.replace('_NEXT', ''), overlap });
      }
    });

    overlaps.forEach((o, index) => {
      if (o.overlap > 3) {
        result.push(o.id);
      } else if (o.overlap === 3) {
        // Preference for the last one if it's a tie or if it's the only one
        if (index === overlaps.length - 1 || overlaps.length === 1) {
          result.push(o.id);
        }
      }
    });

    return Array.from(new Set(result));
  };

  const updateShift = (dayIdx: number, rowId: string, entry: ShiftEntry, originalEntryId?: string) => {
    if (!roster) return;
    const newDays = [...roster.days];
    
    // 1. Remove original entry from ALL rows of this day
    if (originalEntryId) {
      const shifts = newDays[dayIdx].shifts || {};
      Object.keys(shifts).forEach(rid => {
        if (shifts[rid]) {
          shifts[rid] = shifts[rid].filter(e => e.id !== originalEntryId);
        }
      });
      newDays[dayIdx].shifts = shifts;
    }

    // 2. Determine target rows based on timeRange
    let targetRowIds: string[] = [rowId];
    if (entry.timeRange && entry.timeRange.includes(' às ')) {
      const autoTurnos = getTurnosForTimeRange(entry.timeRange);
      if (autoTurnos.length > 0) {
        targetRowIds = autoTurnos;
      }
    }

    // 3. Auto-move to EXP row if type is EXPEDIENTE
    if (entry.type === 'EXPEDIENTE') {
      targetRowIds = ['EXP'];
    }

    // 4. Add/Update entry in target rows
    targetRowIds.forEach(trid => {
      if (!newDays[dayIdx].shifts[trid]) newDays[dayIdx].shifts[trid] = [];
      newDays[dayIdx].shifts[trid].push(entry);
    });

    const updatedRoster = { ...roster, days: newDays };
    setRoster(updatedRoster);
    saveRoster(updatedRoster);
    syncRosterToLog(dayIdx, rowId, entry); // Note: rowId here might be slightly off if auto-assigned, but syncRosterToLog handles it
    setEditingCell(null);
  };

  const duplicateShift = (dayIdx: number, rowId: string, entry: ShiftEntry) => {
    if (!roster) return;
    
    let nextDayIdx = dayIdx;
    let nextRowId = '';
    
    const rowIdx = roster.shiftDefinitions.findIndex(d => d.id === rowId);
    if (rowIdx < roster.shiftDefinitions.length - 1) {
      nextRowId = roster.shiftDefinitions[rowIdx + 1].id;
    } else {
      nextDayIdx = dayIdx + 1;
      if (nextDayIdx < roster.days.length) {
        nextRowId = roster.shiftDefinitions[0].id;
      }
    }
    
    if (nextRowId && nextDayIdx < roster.days.length) {
      const newEntry = { ...entry, id: Math.random().toString() };
      updateShift(nextDayIdx, nextRowId, newEntry);
      alert(`Turno duplicado para ${roster.days[nextDayIdx].weekday} (${roster.days[nextDayIdx].date}) - ${nextRowId}`);
    } else {
      alert("Não há próximo turno disponível nesta escala.");
    }
  };

  const handleLogOverride = (key: string, val: string) => {
    saveOverride(key, val);
    
    const [offId, dayStr, type] = key.split('-');
    const dayNum = parseInt(dayStr);

    // Find which week this day belongs to
    const monthIndex = MONTHS_OF_YEAR.indexOf(selectedMonth);
    let firstFriday = 1;
    while (new Date(Number(selectedYear), monthIndex, firstFriday).getDay() !== 5) {
      firstFriday++;
    }
    
    let week = 1;
    if (dayNum >= firstFriday) {
      week = Math.floor((dayNum - firstFriday) / 7) + 1;
    }
    const targetRosterId = `r-${selectedMonth}-${week}`;

    let targetRoster = rosters[targetRosterId];
    
    if (!targetRoster) {
      // Initialize a basic roster for that week if it doesn't exist
      const monthIndex = MONTHS_OF_YEAR.indexOf(selectedMonth);
      let firstFriday = 1;
      while (new Date(Number(selectedYear), monthIndex, firstFriday).getDay() !== 5) {
        firstFriday++;
      }
      const startDay = firstFriday + (week - 1) * 7;
      const weekdays = ['sexta-feira', 'sábado', 'domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira'];
      const dates = weekdays.map((weekday, i) => {
        const d = new Date(Number(selectedYear), monthIndex, startDay + i);
        const dayNum = d.getDate().toString().padStart(2, '0');
        const monthNum = (d.getMonth() + 1).toString().padStart(2, '0');
        return { date: `${dayNum}/${monthNum}/2026`, weekday };
      });

      targetRoster = {
        id: targetRosterId,
        title: 'ESCALA SEMANAL DE SERVIÇO',
        startDate: dates[0].date,
        endDate: dates[6].date,
        days: dates.map(d => ({ ...d, shifts: {} })),
        observations: "NADA CONSTA.",
        shiftDefinitions: INITIAL_SHIFT_DEFINITIONS
      };
    }

    const newDays = [...targetRoster.days];
    const dayIdx = newDays.findIndex(d => parseInt(d.date.split('/')[0]) === dayNum);
    if (dayIdx === -1) return;

    const day = { ...newDays[dayIdx], shifts: { ...newDays[dayIdx].shifts } };
    let rowId = '';
    if (type === 'BH') rowId = 'BH';
    else if (type === 'SV') rowId = targetRoster.shiftDefinitions[0]?.id || '1';
    else if (type === 'EA') rowId = 'EA';
    else if (type === 'GSE') rowId = 'GSE';
    
    if (!rowId) return;

    if (!day.shifts[rowId]) {
      day.shifts[rowId] = [];
    }

    // Find if this officer is already in a shift in this row
    let shift = day.shifts[rowId].find(s => s.officers.includes(offId));
    
    if (val === '' || val === 'FG') {
      if (shift) {
        shift.officers = shift.officers.filter(id => id !== offId);
        // If shift becomes empty, remove it? Maybe not, keep it for now or remove if it was the only one
        if (shift.officers.length === 0) {
          day.shifts[rowId] = day.shifts[rowId].filter(s => s.id !== shift!.id);
        }
      }
    } else {
      if (!shift) {
        shift = { id: Math.random().toString(), officers: [offId], type: 'SERVICO' };
        day.shifts[rowId].push(shift);
      }
      
      if (val === '12') shift.timeRange = '06h às 18h';
      else if (val === '06') shift.timeRange = '06h às 12h';
      
      if (type === 'GSE') {
        shift.vtr = 'GSE';
      }
    }
    newDays[dayIdx] = day;
    
    const updated = { ...targetRoster, days: newDays };
    saveRoster(updated);
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

  // Auto-fill GSE and Justify from Roster and Logbook
  useEffect(() => {
    const newGse: GseEntry[] = [];
    const newJustify: GseJustifyEntry[] = [];

    // 1. Collect from all rosters of the month
    (Object.values(rosters || {}) as RosterState[]).forEach(r => {
      if (!r || !r.id || !r.id.includes(selectedMonth)) return;
      (r.days || []).forEach(day => {
        Object.entries(day.shifts || {}).forEach(([rowId, entries]: [string, ShiftEntry[]]) => {
          (entries || []).forEach(shift => {
            if (shift.type === 'SERVICO' && (rowId === 'BH' || shift.vtr?.includes('GSE') || rowId === 'GSE')) {
              const dateStr = day.date;
              const existing = newGse.find(g => g.date === dateStr);
              if (existing) {
                shift.officers.forEach(id => {
                  if (!existing.meIds.includes(id)) existing.meIds.push(id);
                });
              } else {
                newGse.push({
                  id: `gse-${day.date}-${rowId}-${shift.id}`,
                  date: day.date,
                  time: shift.timeRange || '17H ÀS 05H',
                  extra: rowId === 'BH' ? '2' : '12',
                  meIds: [...shift.officers],
                  mission: shift.mission || 'PATRULHAMENTO TÁTICO MOTORIZADO'
                });
              }
            }
          });
        });
      });
    });

    // 2. Collect from Logbook Overrides (GSE row)
    Object.entries(logOverrides || {}).forEach(([key, val]) => {
      if (!val || val === '' || val === 'FG') return;
      const [offId, dayStr, type] = key.split('-');
      if (type === 'GSE') {
        const day = parseInt(dayStr);
        const dateStr = `${day.toString().padStart(2, '0')}/${(MONTHS_OF_YEAR.indexOf(selectedMonth) + 1).toString().padStart(2, '0')}/${selectedYear}`;
        const existing = newGse.find(g => g.date === dateStr);
        if (existing) {
          if (!existing.meIds.includes(offId)) existing.meIds.push(offId);
        } else {
          newGse.push({
            id: `gse-log-${day}-${offId}`,
            date: dateStr,
            time: '17H ÀS 05H',
            extra: '12H',
            meIds: [offId],
            mission: 'PATRULHAMENTO TÁTICO MOTORIZADO'
          });
        }
      }
    });

    // Sort by date
    newGse.sort((a, b) => {
      const dayA = parseInt(a.date.split('/')[0]);
      const dayB = parseInt(b.date.split('/')[0]);
      return dayA - dayB;
    });

    // Populate Justify
    newGse.forEach(g => {
      g.meIds.forEach(meId => {
        const off = officers.find(o => o.id === meId);
        if (off) {
          newJustify.push({
            id: `justify-${meId}-${g.date}`,
            officerId: meId,
            date: g.date,
            he: g.extra,
            turno: 'GSE',
            funcao: 'PATRULHEIRO'
          });
        }
      });
    });

    setGseEntries(newGse);
    setJustifyEntries(newJustify);
  }, [rosters, logOverrides, selectedMonth, selectedYear, officers]);

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

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 font-mono">
        <div className="text-xl font-black uppercase animate-pulse">Carregando Sistema...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4 font-mono">
        <div className="bg-white border-4 border-black p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black uppercase leading-none mb-2">Gestor FT</h1>
            <p className="text-xs font-bold text-slate-500 uppercase">5º Batalhão de Polícia Militar</p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black uppercase mb-1">Usuário</label>
              <input 
                type="text" 
                value={loginUser}
                onChange={e => setLoginUser(e.target.value)}
                className="w-full border-2 border-black p-2 text-sm font-bold outline-none"
                placeholder="admin"
              />
            </div>
            <div>
              <label className="block text-xs font-black uppercase mb-1">Senha</label>
              <input 
                type="password" 
                value={loginPass}
                onChange={e => setLoginPass(e.target.value)}
                className="w-full border-2 border-black p-2 text-sm font-bold outline-none"
                placeholder="••••••••"
              />
            </div>
            
            {loginError && <p className="text-red-600 text-[10px] font-black uppercase">{loginError}</p>}

            <button 
              onClick={async () => {
                setLoginError('');
                if (loginUser === 'admin' && loginPass === 'admin123') {
                  const mockUser = { displayName: 'Administrador', username: loginUser, photoURL: 'https://picsum.photos/seed/admin/200' };
                  setUser(mockUser);
                  localStorage.setItem('gestor_user', JSON.stringify(mockUser));
                } else {
                  setLoginError('Falha no login. Verifique as credenciais.');
                }
              }}
              className="w-full bg-black text-white p-4 font-black uppercase hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
            >
              Entrar no Sistema
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-black/10"></div></div>
              <div className="relative flex justify-center text-[8px] font-black uppercase"><span className="bg-white px-2 text-slate-400">Ou use Google</span></div>
            </div>

            <button 
              onClick={() => {
                const mockUser = { displayName: 'Administrador', username: 'admin', photoURL: 'https://picsum.photos/seed/admin/200' };
                setUser(mockUser);
                localStorage.setItem('gestor_user', JSON.stringify(mockUser));
              }}
              className="w-full border-2 border-black text-black p-3 font-black uppercase flex items-center justify-center gap-3 hover:bg-slate-50 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-2.16 5.44-7.84 5.44-4.88 0-8.88-4.04-8.88-9s4-9 8.88-9c2.8 0 4.68 1.16 5.76 2.2l2.56-2.48C19.04 1.32 16.04 0 12.48 0 5.84 0 .48 5.36.48 12s5.36 12 12 12c6.96 0 11.6-4.88 11.6-11.8 0-.8-.08-1.4-.2-2.08h-11.4z"/>
              </svg>
              Login Rápido
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-black font-mono pb-24">
      <Header />
      
      <div className="bg-white border-b-2 border-black sticky top-0 z-40 print:hidden shadow-lg">
        <div className="container mx-auto px-4 py-2 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 mr-4">
                <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border-2 border-black" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase leading-none">{user.displayName}</span>
                  <button onClick={() => {
                    setUser(null);
                    localStorage.removeItem('gestor_user');
                  }} className="text-[7px] font-bold text-red-600 uppercase text-left hover:underline">Sair</button>
                </div>
              </div>
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
              <div className="flex border-2 border-black rounded overflow-hidden">
                {['1', '2', '3', '4', '5'].map(w => (
                  <button key={w} onClick={() => setSelectedWeek(w)} className={`w-8 h-8 flex items-center justify-center text-[10px] font-black transition-all ${selectedWeek === w ? 'bg-black text-white' : 'bg-white hover:bg-slate-100 border-r border-black last:border-0'}`}>
                    {w}
                  </button>
                ))}
              </div>
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
              <button 
                onClick={() => {
                  window.focus();
                  window.print();
                }} 
                className="px-4 py-2 text-[10px] font-black border-2 border-black bg-black text-white hover:bg-slate-800 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]"
              >
                IMPRIMIR
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between gap-2 bg-slate-50 border-2 border-black p-1">
            <div className="flex items-center flex-grow">
              <svg className="w-4 h-4 ml-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              <input 
                type="text" 
                placeholder="BUSCAR POLICIAL POR NOME OU ID FUNC..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="flex-grow bg-transparent text-[10px] font-black uppercase p-1 outline-none"
              />
            </div>
            <div className="text-[8px] font-bold text-slate-400 uppercase mr-2 print:hidden">
              Dica: Se a impressão não abrir, use Ctrl+P ou abra em nova aba
            </div>
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
                      {roster?.days.map((day, dIdx) => (
                        <td key={dIdx} className={`p-1 align-top border-r-[3px] border-black min-h-[45px] ${isWeekend(day.weekday) ? 'bg-red-50/50' : ''}`}>
                          <ShiftCell 
                            entries={day.shifts?.[def.id] || []} 
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
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setEditingOfficer({ id: Math.random().toString(), name: '', rank: 'SD', status: 'DISPONIVEL', fullName: '', idFunc: '', credor: '', cpf: '' })} 
                      className="text-[9px] font-black border-2 border-black px-3 py-1 uppercase hover:bg-black hover:text-white transition-all"
                    >
                      + Novo Militar
                    </button>
                    <button onClick={() => setIsEditingStaff(!isEditingStaff)} className="text-[9px] font-black border-2 border-black px-3 py-1 uppercase hover:bg-black hover:text-white transition-all">
                      {isEditingStaff ? 'Concluir' : 'Editar Efetivo'}
                    </button>
                  </div>
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
        {activeTab === 'GSE_SCALE' && <GseScaleView month={selectedMonth} officers={officers} entries={gseEntries} onUpdate={saveGseEntries} meta={autoMeta as any} isEditing={isEditingScale} />}
        {activeTab === 'GSE_JUSTIFY' && <GseJustifyView month={selectedMonth} officers={officers} entries={justifyEntries} onUpdate={saveJustifyEntries} meta={autoMeta as any} isEditing={isEditingScale} />}
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
          entries={roster.days[editingCell.dayIdx].shifts[editingCell.rowId] || []} 
          officersList={filteredOfficers} 
          onSave={(entries) => {
            if (!roster) return;
            const newDays = [...roster.days];
            newDays[editingCell.dayIdx].shifts[editingCell.rowId] = entries;
            const updatedRoster = { ...roster, days: newDays };
            setRoster(updatedRoster);
            saveRoster(updatedRoster);
            setEditingCell(null);
          }} 
          onUpdateEntry={(entry, originalId) => updateShift(editingCell.dayIdx, editingCell.rowId, entry, originalId)}
          onDuplicate={(entry) => duplicateShift(editingCell.dayIdx, editingCell.rowId, entry)}
          onClose={() => setEditingCell(null)} 
        />
      )}
      {editingOfficer && (
        <OfficerModal 
          officer={editingOfficer} 
          onSave={off => { 
            if (officers.find(o => o.id === off.id)) {
              saveOfficer(off); 
            } else {
              addOfficer(off);
            }
            setEditingOfficer(null); 
          }} 
          onDelete={id => {
            deleteOfficer(id);
            setEditingOfficer(null);
          }}
          onClose={() => setEditingOfficer(null)} 
        />
      )}
      
      {roster && (
        <AiAssistant 
          officers={officers} 
          roster={roster} 
          onUpdateRoster={(updated) => {
            setRoster(updated);
            saveRoster(updated);
          }} 
        />
      )}
    </div>
  );
};

export default App;
