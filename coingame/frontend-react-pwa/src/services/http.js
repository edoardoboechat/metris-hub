const API_URL = process.env.REACT_APP_API_URL || '';

export async function request(path, options = {}) {
  const { method = 'GET', body, token } = options;

  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (cause) {
    const error = new Error('Backend connection is unavailable.');
    error.isConnectionError = true;
    error.cause = cause;
    throw error;
  }

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const error = new Error(payload?.message || 'Nao foi possivel processar o pedido.');
    error.fieldErrors = payload?.errors || {};
    throw error;
  }

  return payload;
}

export function post(path, body, token) {
  return request(path, { method: 'POST', body, token });
}

export async function pingBackend() {
  try {
    const response = await fetch(`${API_URL}/api/health`, { method: 'GET' });
    return response.ok;
  } catch (error) {
    return false;
  }
}
