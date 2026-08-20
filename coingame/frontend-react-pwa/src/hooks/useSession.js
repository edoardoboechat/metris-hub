import { useCallback, useEffect, useMemo, useState } from 'react';
import { initialProfile, TASK_POLL_INTERVAL } from '../constants/app';
import {
  addAdminCoins,
  addAdminUserPlayTime,
  deleteAdminUser,
  fetchAdminLedger,
  fetchAdminSettings,
  fetchAdminTasks,
  fetchAdminUsers,
  updateAdminDistributionDays,
  updateAdminInactivityTimeout,
  updateAdminUserStatus,
} from '../services/adminService';
import { login, logout, refreshSession, registerAccount } from '../services/authService';
import { fetchGameSettings, fetchPlayerLedger, inspectArea, startPlaySession, stopPlaySession, stopPlaySessionKeepalive } from '../services/gameService';
import { useI18n } from '../i18n/I18nProvider';
import { pingBackend } from '../services/http';
import { fetchProfile, updateProfile } from '../services/userService';
import { enrichSession } from '../utils/jwt';
import { clearSession, persistSession, readSession } from '../utils/sessionStorage';

export default function useSession() {
  const { t } = useI18n();
  const emptyLedger = useMemo(() => ({ coinEntries: [], playSessions: [], playTimeEntries: [] }), []);
  const [screen, setScreen] = useState('home');
  const [mode, setMode] = useState('login');
  const [session, setSession] = useState(null);
  const [profileForm, setProfileForm] = useState(initialProfile);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminTasks, setAdminTasks] = useState([]);
  const [playerLedger, setPlayerLedger] = useState(emptyLedger);
  const [adminLedger, setAdminLedger] = useState(emptyLedger);
  const [gameSettings, setGameSettings] = useState({ inactivityTimeoutSeconds: 30, availableCoins: 0, distributionDays: 30, estimatedSuccessProbability: 0 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [backendConnected, setBackendConnected] = useState(true);
  const [message, setMessage] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const accessToken = session?.accessToken;
  const refreshToken = session?.refreshToken;

  const mergeUserGameStats = useCallback((currentUser, nextUser) => ({
    ...currentUser,
    ...nextUser,
    playTimeSeconds: typeof nextUser?.playTimeSeconds === 'number'
      ? nextUser.playTimeSeconds
      : currentUser?.playTimeSeconds || 0,
    totalPlayedSeconds: typeof nextUser?.totalPlayedSeconds === 'number'
      ? nextUser.totalPlayedSeconds
      : currentUser?.totalPlayedSeconds || 0,
    totalCoinsFound: typeof nextUser?.totalCoinsFound === 'number'
      ? nextUser.totalCoinsFound
      : currentUser?.totalCoinsFound || 0,
    coinBalance: nextUser?.coinBalance ?? currentUser?.coinBalance ?? '0.00',
  }), []);

  const notifyBackendDisconnected = useCallback(() => {
    setMessage({ type: 'warning', text: t('flash.backendDisconnected') });
  }, [t]);

  const ensureBackendAvailable = useCallback(() => {
    if (backendConnected) {
      return true;
    }

    notifyBackendDisconnected();
    return false;
  }, [backendConnected, notifyBackendDisconnected]);

  const checkBackendConnection = useCallback(async () => {
    const connected = await pingBackend();
    setBackendConnected(connected);
    return connected;
  }, []);

  useEffect(() => {
    if (session?.user) {
      setProfileForm({
        username: session.user.username || '',
        email: session.user.email || '',
        phone: session.user.phone || '',
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
      });
    }
  }, [session]);

  useEffect(() => {
    checkBackendConnection();
    const intervalId = window.setInterval(checkBackendConnection, TASK_POLL_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [checkBackendConnection]);

  const restoreSession = useCallback(async () => {
    const stored = readSession();
    if (!stored?.accessToken) {
      setLoading(false);
      return;
    }

    try {
      const user = await fetchProfile(stored.accessToken);
      setBackendConnected(true);
      setSession(enrichSession({ ...stored, user }));
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        setLoading(false);
        return;
      }
      if (!stored.refreshToken) {
        clearSession();
        setLoading(false);
        return;
      }

      try {
        const refreshed = await refreshSession(stored.refreshToken);
        const user = await fetchProfile(refreshed.accessToken);
        setBackendConnected(true);
        const nextSession = enrichSession({ ...refreshed, user });
        persistSession(nextSession);
        setSession(nextSession);
      } catch (refreshError) {
        if (refreshError.isConnectionError) {
          setBackendConnected(false);
          setLoading(false);
          return;
        }
        clearSession();
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const handleLogin = useCallback(async (loginForm) => {
    if (!ensureBackendAvailable()) {
      return false;
    }
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});

    try {
      const nextSession = enrichSession(await login(loginForm));
      setBackendConnected(true);
      persistSession(nextSession);
      setSession(nextSession);
      setScreen(nextSession.roles.includes('ADMIN') ? 'tasks' : 'home');
      setMessage({ type: 'success', text: t('flash.loginSuccess') });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setFieldErrors(error.fieldErrors || {});
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, notifyBackendDisconnected, t]);

  const handleRegister = useCallback(async (registerForm) => {
    if (!ensureBackendAvailable()) {
      return false;
    }
    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});

    if (registerForm.password !== registerForm.confirmPassword) {
      setSubmitting(false);
      setFieldErrors({ confirmPassword: t('flash.confirmPasswordMismatch') });
      setMessage({ type: 'error', text: t('flash.confirmPasswordMismatch') });
      return false;
    }

    try {
      const payload = { ...registerForm };
      delete payload.confirmPassword;
      const response = await registerAccount(payload);
      setBackendConnected(true);
      setMode('login');
      setMessage({ type: 'success', text: response.message || t('flash.registerSuccess') });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setFieldErrors(error.fieldErrors || {});
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, notifyBackendDisconnected, t]);

  const handleProfileSave = useCallback(async () => {
    if (!session?.accessToken) {
      return false;
    }
    if (!ensureBackendAvailable()) {
      return false;
    }

    setSubmitting(true);
    setMessage(null);
    setFieldErrors({});

    try {
      const user = await updateProfile(session.accessToken, profileForm);
      setBackendConnected(true);
      const nextSession = enrichSession({ ...session, user });
      persistSession(nextSession);
      setSession(nextSession);
      setMessage({ type: 'success', text: t('flash.profileSaved') });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setFieldErrors(error.fieldErrors || {});
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, notifyBackendDisconnected, profileForm, session, t]);

  const refreshCurrentUser = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!accessToken) {
      return null;
    }

    try {
      const user = await fetchProfile(accessToken);
      setBackendConnected(true);
      setSession((current) => {
        if (!current) {
          return current;
        }
        const nextSession = enrichSession({
          ...current,
          user: mergeUserGameStats(current.user, user),
        });
        persistSession(nextSession);
        return nextSession;
      });
      return user;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        if (!silent) {
          notifyBackendDisconnected();
        }
        return null;
      }
      if (!silent) {
        setMessage({ type: 'error', text: error.message });
      }
      return null;
    }
  }, [accessToken, mergeUserGameStats, notifyBackendDisconnected]);

  const handleLogout = useCallback(async () => {
    if (!ensureBackendAvailable()) {
      return false;
    }
    if (refreshToken) {
      try {
        await logout(refreshToken);
        setBackendConnected(true);
      } catch (error) {
        if (error.isConnectionError) {
          setBackendConnected(false);
          notifyBackendDisconnected();
          return false;
        }
      }
    }

    clearSession();
    setSession(null);
    setScreen('home');
    setMode('login');
    setAdminUsers([]);
    setAdminTasks([]);
    setPlayerLedger(emptyLedger);
    setAdminLedger(emptyLedger);
    setFieldErrors({});
    setMessage({ type: 'success', text: t('flash.logoutSuccess') });
    return true;
  }, [emptyLedger, ensureBackendAvailable, notifyBackendDisconnected, refreshToken, t]);

  const loadAdminTasks = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!session?.accessToken) {
      return [];
    }
    if (!backendConnected) {
      return [];
    }

    try {
      const board = await fetchAdminTasks(session.accessToken);
      setBackendConnected(true);
      const tasks = board.tasks || [];
      setAdminTasks(tasks);
      return tasks;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        if (!silent) {
          notifyBackendDisconnected();
        }
        return [];
      }
      if (!silent) {
        setMessage({ type: 'error', text: error.message });
      }
      return [];
    }
  }, [backendConnected, notifyBackendDisconnected, session]);

  const loadAdminUsers = useCallback(async (query, status, options = {}) => {
    const { silent = false } = options;
    if (!session?.accessToken) {
      return [];
    }
    if (!backendConnected) {
      return [];
    }

    setAdminLoading(true);
    try {
      const users = await fetchAdminUsers(session.accessToken, query, status);
      setBackendConnected(true);
      setAdminUsers(users);
      return users;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        if (!silent) {
          notifyBackendDisconnected();
        }
        return [];
      }
      if (!silent) {
        setMessage({ type: 'error', text: error.message });
      }
      return [];
    } finally {
      setAdminLoading(false);
    }
  }, [backendConnected, notifyBackendDisconnected, session]);

  const loadPlayerLedger = useCallback(async (startDate, endDate, options = {}) => {
    const { silent = false } = options;
    if (!session?.accessToken) {
      return null;
    }
    if (!backendConnected) {
      return null;
    }

    setHistoryLoading(true);
    try {
      const ledger = await fetchPlayerLedger(session.accessToken, startDate, endDate);
      setBackendConnected(true);
      setPlayerLedger(ledger || emptyLedger);
      return ledger;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        if (!silent) {
          notifyBackendDisconnected();
        }
        return null;
      }
      if (!silent) {
        setMessage({ type: 'error', text: error.message });
      }
      return null;
    } finally {
      setHistoryLoading(false);
    }
  }, [backendConnected, emptyLedger, notifyBackendDisconnected, session]);

  const loadAdminLedger = useCallback(async (username, startDate, endDate, options = {}) => {
    const { silent = false } = options;
    if (!session?.accessToken) {
      return null;
    }
    if (!backendConnected) {
      return null;
    }

    setHistoryLoading(true);
    try {
      const ledger = await fetchAdminLedger(session.accessToken, username, startDate, endDate);
      setBackendConnected(true);
      setAdminLedger(ledger || emptyLedger);
      return ledger;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        if (!silent) {
          notifyBackendDisconnected();
        }
        return null;
      }
      if (!silent) {
        setMessage({ type: 'error', text: error.message });
      }
      return null;
    } finally {
      setHistoryLoading(false);
    }
  }, [backendConnected, emptyLedger, notifyBackendDisconnected, session]);

  const loadAdminSettings = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!session?.accessToken) {
      return null;
    }
    if (!backendConnected) {
      return null;
    }

    try {
      const settings = await fetchAdminSettings(session.accessToken);
      setBackendConnected(true);
      setGameSettings(settings || { inactivityTimeoutSeconds: 30, availableCoins: 0, distributionDays: 30, estimatedSuccessProbability: 0 });
      return settings;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        if (!silent) {
          notifyBackendDisconnected();
        }
        return null;
      }
      if (!silent) {
        setMessage({ type: 'error', text: error.message });
      }
      return null;
    }
  }, [backendConnected, notifyBackendDisconnected, session]);

  const saveAdminInactivityTimeout = useCallback(async (inactivityTimeoutSeconds) => {
    if (!session?.accessToken) {
      return false;
    }
    if (!ensureBackendAvailable()) {
      return false;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const settings = await updateAdminInactivityTimeout(session.accessToken, inactivityTimeoutSeconds);
      setBackendConnected(true);
      setGameSettings(settings);
      setMessage({ type: 'success', text: t('flash.settingsSaved') });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, notifyBackendDisconnected, session, t]);

  const saveAdminDistributionDays = useCallback(async (distributionDays) => {
    if (!session?.accessToken) {
      return false;
    }
    if (!ensureBackendAvailable()) {
      return false;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const settings = await updateAdminDistributionDays(session.accessToken, distributionDays);
      setBackendConnected(true);
      setGameSettings(settings);
      setMessage({ type: 'success', text: t('flash.settingsSaved') });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, notifyBackendDisconnected, session, t]);

  const saveAdminCoins = useCallback(async (amount) => {
    if (!session?.accessToken) {
      return false;
    }
    if (!ensureBackendAvailable()) {
      return false;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const settings = await addAdminCoins(session.accessToken, amount);
      setBackendConnected(true);
      setGameSettings(settings);
      await loadAdminTasks({ silent: true });
      setMessage({ type: 'success', text: t('flash.coinsAdded', { amount }) });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, loadAdminTasks, notifyBackendDisconnected, session, t]);

  const handleAdminStatusChange = useCallback(async (userId, action, query, status) => {
    if (!session?.accessToken) {
      return false;
    }
    if (!ensureBackendAvailable()) {
      return false;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await updateAdminUserStatus(session.accessToken, userId, action);
      setBackendConnected(true);
      await Promise.all([loadAdminUsers(query, status), loadAdminTasks()]);
      setMessage({
        type: 'success',
        text: action === 'activate' ? t('flash.userActivated') : t('flash.userBlocked'),
      });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, loadAdminTasks, loadAdminUsers, notifyBackendDisconnected, session, t]);

  const handleAdminDeleteUser = useCallback(async (userId, query, status) => {
    if (!session?.accessToken) {
      return false;
    }
    if (!ensureBackendAvailable()) {
      return false;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await deleteAdminUser(session.accessToken, userId);
      setBackendConnected(true);
      await Promise.all([loadAdminUsers(query, status), loadAdminTasks()]);
      setMessage({ type: 'success', text: t('flash.userDeleted') });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, loadAdminTasks, loadAdminUsers, notifyBackendDisconnected, session, t]);

  const handleAdminAddPlayTime = useCallback(async (userId, minutes, query, status) => {
    if (!session?.accessToken) {
      return false;
    }
    if (!ensureBackendAvailable()) {
      return false;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await addAdminUserPlayTime(session.accessToken, userId, minutes);
      setBackendConnected(true);
      await Promise.all([loadAdminUsers(query, status), loadAdminTasks(), loadAdminSettings({ silent: true })]);
      setMessage({ type: 'success', text: t('flash.playTimeAdded', { minutes }) });
      return true;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return false;
      }
      setMessage({ type: 'error', text: error.message });
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [ensureBackendAvailable, loadAdminSettings, loadAdminTasks, loadAdminUsers, notifyBackendDisconnected, session, t]);

  const inspectPlayArea = useCallback(async (coordinates) => {
    if (!accessToken || !ensureBackendAvailable()) {
      return null;
    }
    try {
      const response = await inspectArea(accessToken, coordinates);
      setBackendConnected(true);
      setSession((current) => {
        if (!current) {
          return current;
        }
        const nextSession = {
          ...current,
          user: mergeUserGameStats(current.user, {
            playTimeSeconds: response.remainingPlayTimeSeconds,
            totalPlayedSeconds: response.totalPlayedSeconds,
            totalCoinsFound: response.totalCoinsFound,
            coinBalance: response.coinBalance,
          }),
        };
        persistSession(nextSession);
        return nextSession;
      });
      setGameSettings((current) => ({
        ...current,
        inactivityTimeoutSeconds: response.inactivityTimeoutSeconds ?? current.inactivityTimeoutSeconds,
        availableCoins: response.availableCoins ?? current.availableCoins,
        distributionDays: response.distributionDays ?? current.distributionDays,
        estimatedSuccessProbability: response.estimatedSuccessProbability ?? current.estimatedSuccessProbability,
      }));
      return response;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return null;
      }
      throw error;
    }
  }, [accessToken, ensureBackendAvailable, mergeUserGameStats, notifyBackendDisconnected]);

  const beginPlaySession = useCallback(async () => {
    if (!accessToken || !ensureBackendAvailable()) {
      return null;
    }
    try {
      const response = await startPlaySession(accessToken);
      setBackendConnected(true);
      setSession((current) => {
        if (!current) {
          return current;
        }
        const nextSession = {
          ...current,
          user: mergeUserGameStats(current.user, {
            playTimeSeconds: response.remainingPlayTimeSeconds,
            totalPlayedSeconds: response.totalPlayedSeconds,
            totalCoinsFound: response.totalCoinsFound,
            coinBalance: response.coinBalance,
          }),
        };
        persistSession(nextSession);
        return nextSession;
      });
      setGameSettings((current) => ({
        ...current,
        inactivityTimeoutSeconds: response.inactivityTimeoutSeconds ?? current.inactivityTimeoutSeconds,
        availableCoins: response.availableCoins ?? current.availableCoins,
        distributionDays: response.distributionDays ?? current.distributionDays,
        estimatedSuccessProbability: response.estimatedSuccessProbability ?? current.estimatedSuccessProbability,
      }));
      return response;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        notifyBackendDisconnected();
        return null;
      }
      throw error;
    }
  }, [accessToken, ensureBackendAvailable, mergeUserGameStats, notifyBackendDisconnected]);

  const endPlaySession = useCallback(async () => {
    if (!accessToken || !backendConnected) {
      return null;
    }
    try {
      const response = await stopPlaySession(accessToken);
      setBackendConnected(true);
      setSession((current) => {
        if (!current) {
          return current;
        }
        const nextSession = {
          ...current,
          user: mergeUserGameStats(current.user, {
            playTimeSeconds: response.remainingPlayTimeSeconds,
            totalPlayedSeconds: response.totalPlayedSeconds,
            totalCoinsFound: response.totalCoinsFound,
            coinBalance: response.coinBalance,
          }),
        };
        persistSession(nextSession);
        return nextSession;
      });
      setGameSettings((current) => ({
        ...current,
        inactivityTimeoutSeconds: response.inactivityTimeoutSeconds ?? current.inactivityTimeoutSeconds,
        availableCoins: response.availableCoins ?? current.availableCoins,
        distributionDays: response.distributionDays ?? current.distributionDays,
        estimatedSuccessProbability: response.estimatedSuccessProbability ?? current.estimatedSuccessProbability,
      }));
      return response;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        return null;
      }
      throw error;
    }
  }, [accessToken, backendConnected, mergeUserGameStats]);

  const endPlaySessionKeepalive = useCallback(() => {
    if (!accessToken) {
      return false;
    }
    return stopPlaySessionKeepalive(accessToken);
  }, [accessToken]);

  const loadGameSettings = useCallback(async (options = {}) => {
    const { silent = false } = options;
    if (!accessToken || !backendConnected) {
      return null;
    }

    try {
      const settings = await fetchGameSettings(accessToken);
      setBackendConnected(true);
      setGameSettings(settings || { inactivityTimeoutSeconds: 30, availableCoins: 0, distributionDays: 30, estimatedSuccessProbability: 0 });
      return settings;
    } catch (error) {
      if (error.isConnectionError) {
        setBackendConnected(false);
        if (!silent) {
          notifyBackendDisconnected();
        }
        return null;
      }
      if (!silent) {
        setMessage({ type: 'error', text: error.message });
      }
      return null;
    }
  }, [accessToken, backendConnected, notifyBackendDisconnected]);

  const actions = useMemo(
    () => ({
      handleAdminAddPlayTime,
      handleAdminDeleteUser,
      loadAdminSettings,
      handleAdminStatusChange,
      handleLogin,
      handleLogout,
      handleProfileSave,
      handleRegister,
      inspectArea: inspectPlayArea,
      loadAdminLedger,
      loadAdminTasks,
      loadAdminUsers,
      loadGameSettings,
      loadPlayerLedger,
      refreshCurrentUser,
      saveAdminCoins,
      saveAdminDistributionDays,
      saveAdminInactivityTimeout,
      startPlaySession: beginPlaySession,
      stopPlaySession: endPlaySession,
      stopPlaySessionKeepalive: endPlaySessionKeepalive,
    }),
    [beginPlaySession, endPlaySession, endPlaySessionKeepalive, handleAdminAddPlayTime, handleAdminDeleteUser, handleAdminStatusChange, handleLogin, handleLogout, handleProfileSave, handleRegister, inspectPlayArea, loadAdminLedger, loadAdminSettings, loadAdminTasks, loadAdminUsers, loadGameSettings, loadPlayerLedger, refreshCurrentUser, saveAdminCoins, saveAdminDistributionDays, saveAdminInactivityTimeout]
  );

  return {
    adminLedger,
    adminLoading,
    adminTasks,
    adminUsers,
    fieldErrors,
    backendConnected,
    historyLoading,
    loading,
    message,
    mode,
    gameSettings,
    playerLedger,
    profileForm,
    screen,
    session,
    setMessage,
    setMode,
    setProfileForm,
    setScreen,
    submitting,
    actions,
  };
}
