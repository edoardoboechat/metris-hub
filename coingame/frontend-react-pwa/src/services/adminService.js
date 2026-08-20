import { request } from './http';

export function fetchAdminTasks(token) {
  return request('/api/admin/tasks', { token });
}

export function fetchAdminUsers(token, query, status) {
  const params = new URLSearchParams();

  if (query) {
    params.set('query', query);
  }
  if (status) {
    params.set('status', status);
  }

  const suffix = params.toString();
  return request(`/api/admin/users${suffix ? `?${suffix}` : ''}`, { token });
}

export function updateAdminUserStatus(token, userId, action) {
  return request(`/api/admin/users/${userId}/status`, {
    method: 'PATCH',
    token,
    body: { action },
  });
}

export function addAdminUserPlayTime(token, userId, minutes) {
  return request(`/api/admin/users/${userId}/play-time`, {
    method: 'PATCH',
    token,
    body: { minutes },
  });
}

export function deleteAdminUser(token, userId) {
  return request(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}

export function fetchAdminLedger(token, username, startDate, endDate) {
  const params = new URLSearchParams();

  if (username) {
    params.set('username', username);
  }
  if (startDate) {
    params.set('startDate', startDate);
  }
  if (endDate) {
    params.set('endDate', endDate);
  }

  const suffix = params.toString();
  return request(`/api/admin/ledger${suffix ? `?${suffix}` : ''}`, { token });
}

export function fetchAdminSettings(token) {
  return request('/api/admin/settings', { token });
}

export function updateAdminInactivityTimeout(token, inactivityTimeoutSeconds) {
  return request('/api/admin/settings/timeout', {
    method: 'PATCH',
    token,
    body: { inactivityTimeoutSeconds },
  });
}

export function updateAdminDistributionDays(token, distributionDays) {
  return request('/api/admin/settings/distribution-days', {
    method: 'PATCH',
    token,
    body: { distributionDays },
  });
}

export function addAdminCoins(token, amount) {
  return request('/api/admin/coins', {
    method: 'PATCH',
    token,
    body: { amount },
  });
}
