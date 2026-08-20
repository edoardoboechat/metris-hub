import { request } from './http';

const API_URL = process.env.REACT_APP_API_URL || '';

export function startPlaySession(token) {
  return request('/api/game/session/start', {
    method: 'POST',
    token,
  });
}

export function stopPlaySession(token) {
  return request('/api/game/session/stop', {
    method: 'POST',
    token,
  });
}

export function stopPlaySessionKeepalive(token) {
  if (!token) {
    return false;
  }

  fetch(`${API_URL}/api/game/session/stop`, {
    method: 'POST',
    keepalive: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: '{}',
  }).catch(() => {});

  return true;
}

export function inspectArea(token, coordinates) {
  return request('/api/game/inspect', {
    method: 'POST',
    token,
    body: coordinates,
  });
}

export function fetchPlayerLedger(token, startDate, endDate) {
  const params = new URLSearchParams();

  if (startDate) {
    params.set('startDate', startDate);
  }
  if (endDate) {
    params.set('endDate', endDate);
  }

  const suffix = params.toString();
  return request(`/api/game/ledger${suffix ? `?${suffix}` : ''}`, { token });
}

export function fetchGameSettings(token) {
  return request('/api/game/settings', { token });
}
