export const STORAGE_KEY = 'aether.quest.session';
export const TASK_POLL_INTERVAL = 15000;
export const PLAY_SYNC_INTERVAL = 1000;

export const initialLogin = { identifier: '', password: '' };

export const initialRegister = {
  username: '',
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
  password: '',
  confirmPassword: '',
};

export const initialProfile = {
  username: '',
  email: '',
  phone: '',
  firstName: '',
  lastName: '',
};

export const landingStats = [
  { label: 'Distritos ativos', value: '24', tone: 'cyan' },
  { label: 'Moedas escondidas', value: '1.280+', tone: 'gold' },
  { label: 'Rotas em disputa', value: '8.4k', tone: 'cyan' },
];
