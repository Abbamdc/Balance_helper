export const darkTheme = {
  bg: '#0a0e1a',
  panel: '#111827',
  panel2: '#0f1520',
  border: '#1e2d45',
  accent: '#00d4ff',
  accent2: '#ff6b35',
  accent3: '#00ff9d',
  text: '#e2eaf7',
  muted: '#5a7090',
  danger: '#ff4757',
  success: '#2ed573',
  gold: '#ffd700',
  inputBg: '#0f1520',
  cardBefore: 'rgba(0,212,255,0.5)',
  overlay: 'rgba(0,0,0,0.75)',
  statusBar: 'light',
};

export const lightTheme = {
  bg: '#f0f4fa',
  panel: '#ffffff',
  panel2: '#f5f8fd',
  border: '#d0daea',
  accent: '#0077aa',
  accent2: '#d95a20',
  accent3: '#00996a',
  text: '#1a2535',
  muted: '#7a90aa',
  danger: '#cc2233',
  success: '#1a9e52',
  gold: '#c68a00',
  inputBg: '#f5f8fd',
  cardBefore: 'rgba(0,119,170,0.5)',
  overlay: 'rgba(20,30,50,0.55)',
  statusBar: 'dark',
};

export const getTheme = (mode) => (mode === 'light' ? lightTheme : darkTheme);
