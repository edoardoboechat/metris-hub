import { request } from './http';

export function fetchProfile(token) {
  return request('/api/users/me', { token });
}

export function updateProfile(token, profile) {
  return request('/api/users/me', { method: 'PUT', token, body: profile });
}
