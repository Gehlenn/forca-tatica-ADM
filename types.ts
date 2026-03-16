
export type OfficerStatus = 'DISPONIVEL' | 'LTS' | 'FERIAS' | 'LP' | 'NUPC' | 'CURSO' | 'LUTO' | 'EDT';

export interface Officer {
  id: string;
  name: string; 
  fullName: string;
  rank: 'SD' | 'SGT' | '1ºSGT' | '2ºSGT' | 'TEN' | 'CAP' | 'MAJ';
  status: OfficerStatus;
  statusStart?: string;
  statusEnd?: string;
  idFunc: string;
  credor: string;
  cpf: string;
}

export interface ShiftRowDefinition {
  id: string;
  label: string;
  defaultTime: string;
}

export interface ShiftEntry {
  id: string;
  vtr?: string;
  timeRange?: string;
  officers: string[]; 
  type: 'SERVICO' | 'FOLGA' | 'TREINAMENTO' | 'EXPEDIENTE';
  mission?: string;
}

export interface DayColumn {
  date: string;
  weekday: string;
  shifts: {
    [key: string]: ShiftEntry;
  };
}

export interface RosterState {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  days: DayColumn[];
  observations: string;
  shiftDefinitions: ShiftRowDefinition[];
}

export interface ConfigState {
  showVtr: boolean;
  showTime: boolean;
  showMission: boolean;
  showRank: boolean;
}

export type AppTab = 'ESCALA' | 'LIVRO' | 'GSE_SCALE' | 'GSE_JUSTIFY';

export interface AppTabState {
  activeTab: AppTab;
  selectedMonth: string;
  selectedYear: string;
  selectedWeek: string;
}

export interface GseEntry {
  id: string;
  date: string;
  time: string;
  extra: string;
  meIds: string[];
  mission: string;
}

export interface GseJustifyEntry {
  id: string;
  officerId: string;
  date: string;
  he: string;
  turno: string;
  funcao: string;
}

export interface DocumentMeta {
  unit: string;
  subUnit: string;
  city: string;
  commanderName: string;
  commanderRank: string;
  auxName: string;
  auxRank: string;
  cmtRankFunc?: string;
  auxRankFunc?: string;
}
