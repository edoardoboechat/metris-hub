export function parseJwtPayload(token) {
  if (!token) {
    return null;
  }

  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(window.atob(normalized));
  } catch (error) {
    return null;
  }
}

export function extractRoles(token) {
  const payload = parseJwtPayload(token);
  const roles = payload?.realm_access?.roles;
  return Array.isArray(roles) ? roles : [];
}

export function enrichSession(session) {
  return {
    ...session,
    roles: extractRoles(session?.accessToken),
  };
}
