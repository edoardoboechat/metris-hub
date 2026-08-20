import { post } from './http';

export function login(credentials) {
  return post('/api/auth/login', credentials);
}

export function registerAccount(payload) {
  return post('/api/auth/register', payload);
}

export function refreshSession(refreshToken) {
  return post('/api/auth/refresh', { refreshToken });
}

export function logout(refreshToken) {
  return post('/api/auth/logout', { refreshToken });
}
