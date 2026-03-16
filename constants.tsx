
import { Officer, ShiftRowDefinition } from './types';

export const MONTHS_OF_YEAR = [
  'JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
  'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
];

export const INITIAL_OFFICERS: Officer[] = [
  { id: '1', name: 'RICHER', fullName: 'RICHER WILLIAN MACIEL PIRES', rank: '1ºSGT', status: 'EDT', idFunc: '3192253', credor: '45327254', cpf: '02236526016' },
  { id: '2', name: 'PEDROTI', fullName: 'TAIGOR JOSÉ PEDROTI COELHO', rank: '2ºSGT', status: 'LTS', idFunc: '3705552', credor: '48867128', cpf: '02245786009' },
  { id: '3', name: 'NICHETTI', fullName: 'DANIEL HOMRICH NICHETTI', rank: 'SD', status: 'DISPONIVEL', idFunc: '2871041', credor: '39434818', cpf: '006.670.651.30' },
  { id: '4', name: 'GEHLEN', fullName: 'DANIEL GEHLEN', rank: 'SD', status: 'DISPONIVEL', idFunc: '4363515', credor: '54740649', cpf: '03375210000' },
  { id: '5', name: 'JAYMISON', fullName: 'JAYMISON MARQUES DE SOUSA', rank: 'SD', status: 'DISPONIVEL', idFunc: '4528395', credor: '57538956', cpf: '053.384.051-13' },
  { id: '6', name: 'IURI', fullName: 'IURI DA ROSA GARCIA', rank: 'SD', status: 'DISPONIVEL', idFunc: '4527224', credor: '57537879', cpf: '037.490.260-76' },
  { id: '7', name: 'CRUZ', fullName: 'MATHEUS ARAUJO CRUZ', rank: 'SD', status: 'DISPONIVEL', idFunc: '4663004', credor: '51283742', cpf: '036.500.440.56' },
  { id: '8', name: 'BRUNICZKI', fullName: 'JULIANO DOS SANTOS BRUNICZKI', rank: 'SD', status: 'DISPONIVEL', idFunc: '4674073', credor: '84729103', cpf: '853.739.150-68' },
  { id: '9', name: 'SILVA SANTOS', fullName: 'RAFAEL SILVA DOS SANTOS', rank: 'SD', status: 'DISPONIVEL', idFunc: '5011760', credor: '39281045', cpf: '038.907.200.13' },
];

export const INITIAL_SHIFT_DEFINITIONS: ShiftRowDefinition[] = [
  { id: '1T', label: '1ºT', defaultTime: '00h às 06h' },
  { id: '2T', label: '2ºT', defaultTime: '06h às 12h' },
  { id: '3T', label: '3ºT', defaultTime: '12h às 18h' },
  { id: '4T', label: '4ºT', defaultTime: '18h às 00h' },
  { id: 'EXP', label: 'EXP', defaultTime: '08h às 18h' },
  { id: 'BH', label: 'BH', defaultTime: '' },
];

export const STATUS_LABELS: Record<string, string> = {
  DISPONIVEL: 'QAP',
  LTS: 'LTS',
  FERIAS: 'Férias',
  LP: 'Licença Pr.',
  NUPC: 'NUPC',
  CURSO: 'Curso',
  EDT: 'EDT',
  LUTO: 'Luto'
};
