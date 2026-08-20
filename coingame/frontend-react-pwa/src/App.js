import { useEffect, useMemo, useState } from 'react';
import AppModal from './components/common/AppModal';
import AuthDialog from './components/auth/AuthDialog';
import FlashMessage from './components/common/FlashMessage';
import LoadingShell from './components/common/LoadingShell';
import SessionNavigation from './components/layout/SessionNavigation';
import TopBar from './components/layout/TopBar';
import { initialLogin, initialRegister, PLAY_SYNC_INTERVAL, TASK_POLL_INTERVAL } from './constants/app';
import useSession from './hooks/useSession';
import { useI18n } from './i18n/I18nProvider';
import AdminTasksScreen from './screens/AdminTasksScreen';
import AdminUsersScreen from './screens/AdminUsersScreen';
import AuthenticatedHome from './screens/AuthenticatedHome';
import InspectionScreen from './screens/InspectionScreen';
import LedgerScreen from './screens/LedgerScreen';
import LandingScreen from './screens/LandingScreen';
import ProfileScreen from './screens/ProfileScreen';

function App() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [loginForm, setLoginForm] = useState(initialLogin);
  const [registerForm, setRegisterForm] = useState(initialRegister);
  const [adminQuery, setAdminQuery] = useState('');
  const [adminStatus, setAdminStatus] = useState('all');
  const [adminInactivityTimeout, setAdminInactivityTimeout] = useState('30');
  const [adminDistributionDays, setAdminDistributionDays] = useState('30');
  const [adminCoinLoadAmount, setAdminCoinLoadAmount] = useState('100');
  const [ledgerUsername, setLedgerUsername] = useState('');
  const [ledgerStartDate, setLedgerStartDate] = useState('');
  const [ledgerEndDate, setLedgerEndDate] = useState('');
  const [modalState, setModalState] = useState(null);
  const {
    adminLedger,
    adminLoading,
    adminTasks,
    adminUsers,
    backendConnected,
    fieldErrors,
    gameSettings,
    historyLoading,
    loading,
    message,
    mode,
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
  } = useSession();
  const { t } = useI18n();
  const {
    handleAdminAddPlayTime: submitAdminAddPlayTime,
    handleAdminDeleteUser: submitAdminDeleteUser,
    handleAdminStatusChange: submitAdminStatusChange,
    handleLogin,
    handleLogout,
    handleProfileSave: saveProfile,
    handleRegister,
    inspectArea,
    loadAdminSettings,
    loadAdminLedger,
    loadAdminTasks,
    loadAdminUsers,
    loadGameSettings,
    loadPlayerLedger,
    refreshCurrentUser,
    saveAdminCoins,
    saveAdminDistributionDays,
    saveAdminInactivityTimeout,
    startPlaySession,
    stopPlaySession,
    stopPlaySessionKeepalive,
  } = actions;

  const stats = useMemo(
    () => [
      { label: t('landing.stats.activeDistricts'), value: '24', tone: 'cyan' },
      { label: t('landing.stats.hiddenCoins'), value: '1.280+', tone: 'gold' },
      { label: t('landing.stats.contestedRoutes'), value: '8.4k', tone: 'cyan' },
    ],
    [t]
  );
  const isAdmin = Boolean(session?.roles?.includes('ADMIN'));
  const pendingTaskCount = adminTasks.length;

  useEffect(() => {
    if (!isAdmin || !session?.accessToken) {
      return undefined;
    }

    const load = async () => {
      await loadAdminTasks({ silent: true });
    };

    load();
    const intervalId = window.setInterval(load, TASK_POLL_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAdmin, loadAdminTasks, session?.accessToken, setMessage]);

  useEffect(() => {
    if (!isAdmin || !session?.accessToken || screen !== 'users') {
      return;
    }

    loadAdminUsers(adminQuery, adminStatus, { silent: true });
    loadAdminSettings({ silent: true });
  }, [adminQuery, adminStatus, isAdmin, loadAdminSettings, loadAdminUsers, screen, session?.accessToken]);

  useEffect(() => {
    if (!session?.accessToken || screen !== 'ledger') {
      return;
    }

    if (isAdmin) {
      loadAdminLedger(ledgerUsername, ledgerStartDate, ledgerEndDate, { silent: true });
      return;
    }

    loadPlayerLedger(ledgerStartDate, ledgerEndDate, { silent: true });
  }, [isAdmin, ledgerEndDate, ledgerStartDate, ledgerUsername, loadAdminLedger, loadPlayerLedger, screen, session?.accessToken]);

  useEffect(() => {
    if (isAdmin || screen !== 'play' || !session?.accessToken) {
      return undefined;
    }

    const sync = async () => {
      await refreshCurrentUser({ silent: true });
    };

    sync();
    const intervalId = window.setInterval(sync, PLAY_SYNC_INTERVAL);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isAdmin, refreshCurrentUser, screen, session?.accessToken]);

  useEffect(() => {
    if (!isAdmin && screen === 'play' && session?.accessToken) {
      loadGameSettings({ silent: true });
    }
  }, [isAdmin, loadGameSettings, screen, session?.accessToken]);

  useEffect(() => {
    if (screen === 'play' && !isAdmin) {
      setNavCollapsed(true);
    }
  }, [isAdmin, screen]);

  useEffect(() => {
    setAdminInactivityTimeout(String(gameSettings?.inactivityTimeoutSeconds || 30));
  }, [gameSettings?.inactivityTimeoutSeconds]);

  useEffect(() => {
    setAdminDistributionDays(String(gameSettings?.distributionDays || 30));
  }, [gameSettings?.distributionDays]);

  async function handleLoginSubmit(event) {
    event.preventDefault();
    const success = await handleLogin(loginForm);
    if (success) {
      setLoginForm(initialLogin);
      setAuthDialogOpen(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();
    const success = await handleRegister(registerForm);
    if (success) {
      setRegisterForm(initialRegister);
      setAuthDialogOpen(false);
    }
  }

  async function handleProfileSave(event) {
    event.preventDefault();
    await saveProfile();
  }

  async function handleAdminStatusChange(userId, action) {
    await submitAdminStatusChange(userId, action, adminQuery, adminStatus);
  }

  async function handleAdminDelete(user) {
    setModalState({
      type: 'delete-user',
      user,
    });
  }

  async function handleAdminAddPlayTime(user) {
    setModalState({
      type: 'add-play-time',
      user,
      minutes: '15',
    });
  }

  async function handleAdminTimeoutSave() {
    const nextTimeout = Number(adminInactivityTimeout);
    if (!Number.isInteger(nextTimeout) || nextTimeout < 5) {
      setMessage({ type: 'error', text: t('flash.invalidInactivityTimeout') });
      return;
    }

    await saveAdminInactivityTimeout(nextTimeout);
  }

  async function handleAdminDistributionDaysSave() {
    const nextDistributionDays = Number(adminDistributionDays);
    if (!Number.isInteger(nextDistributionDays) || nextDistributionDays < 1) {
      setMessage({ type: 'error', text: t('flash.invalidDistributionDays') });
      return;
    }

    await saveAdminDistributionDays(nextDistributionDays);
  }

  async function handleAdminCoinsSave() {
    const nextValue = Number(adminCoinLoadAmount);
    if (!Number.isInteger(nextValue) || nextValue < 1) {
      setMessage({ type: 'error', text: t('flash.invalidCoinLoad') });
      return;
    }

    const success = await saveAdminCoins(nextValue);
    if (success) {
      setAdminCoinLoadAmount('100');
    }
  }

  async function handleModalConfirm() {
    if (!modalState) {
      return;
    }

    if (modalState.type === 'delete-user') {
      await submitAdminDeleteUser(modalState.user.id, adminQuery, adminStatus);
      setModalState(null);
      return;
    }

    if (modalState.type === 'add-play-time') {
      const minutes = Number(modalState.minutes);
      if (!Number.isInteger(minutes) || minutes <= 0) {
        setMessage({ type: 'error', text: t('flash.invalidPlayTime') });
        return;
      }
      await submitAdminAddPlayTime(modalState.user.id, minutes, adminQuery, adminStatus);
      setModalState(null);
    }
  }

  if (loading) {
    return <LoadingShell />;
  }

  return (
    <div className="shell">
      <div className="background-grid" />
      <div className="background-glow glow-left" />
      <div className="background-glow glow-right" />

      <TopBar
        backendConnected={backendConnected}
        hasSession={Boolean(session)}
        isAdmin={isAdmin}
        onLoginOpen={() => {
          setMode('login');
          setAuthDialogOpen(true);
        }}
        onLogout={handleLogout}
        onOpenTasks={() => setScreen('tasks')}
        pendingTaskCount={pendingTaskCount}
      />

      {session ? (
        <SessionNavigation
          collapsed={navCollapsed}
          isAdmin={isAdmin}
          onToggle={() => setNavCollapsed((current) => !current)}
          screen={screen}
          setScreen={setScreen}
        />
      ) : null}
      {message && !(authDialogOpen && !session) ? <FlashMessage message={message} onClose={() => setMessage(null)} /> : null}
      <AuthDialog
        authMessage={!session && authDialogOpen && message ? message : null}
        fieldErrors={fieldErrors}
        loginForm={loginForm}
        mode={mode}
        onClose={() => setAuthDialogOpen(false)}
        onLoginChange={setLoginForm}
        onLoginSubmit={handleLoginSubmit}
        onModeChange={setMode}
        onRegisterChange={setRegisterForm}
        onRegisterSubmit={handleRegisterSubmit}
        open={!session && authDialogOpen}
        registerForm={registerForm}
        submitting={submitting}
      />
      <AppModal
        confirmLabel={modalState?.type === 'delete-user' ? t('actions.delete') : t('actions.addTime')}
        description={modalState?.type === 'delete-user' ? t('app.confirmDelete', { username: modalState.user.username }) : t('app.addPlayTimePrompt', { username: modalState?.user?.username || '' })}
        onCancel={() => setModalState(null)}
        onConfirm={handleModalConfirm}
        open={Boolean(modalState)}
        title={modalState?.type === 'delete-user' ? t('modal.deleteTitle') : t('modal.addTimeTitle')}
        variant={modalState?.type === 'delete-user' ? 'danger' : 'default'}
      >
        {modalState?.type === 'add-play-time' ? (
          <div className="modal-form">
            <label className="field">
              <span>{t('modal.minutesLabel')}</span>
              <input
                min="1"
                onChange={(event) => setModalState((current) => current ? { ...current, minutes: event.target.value } : current)}
                type="number"
                value={modalState.minutes}
              />
            </label>
          </div>
        ) : null}
      </AppModal>

      {session ? (
        <>
          {screen === 'profile' ? (
            <ProfileScreen
              fieldErrors={fieldErrors}
              onBack={() => setScreen(isAdmin ? 'tasks' : 'home')}
              onSave={handleProfileSave}
              profileForm={profileForm}
              setProfileForm={setProfileForm}
              submitting={submitting}
            />
          ) : screen === 'ledger' ? (
            <LedgerScreen
              endDate={ledgerEndDate}
              isAdmin={isAdmin}
              ledger={isAdmin ? adminLedger : playerLedger}
              loading={historyLoading}
              onEndDateChange={setLedgerEndDate}
              onStartDateChange={setLedgerStartDate}
              onUsernameChange={setLedgerUsername}
              startDate={ledgerStartDate}
              username={ledgerUsername}
            />
          ) : screen === 'users' && isAdmin ? (
            <AdminUsersScreen
              availableCoins={gameSettings?.availableCoins || 0}
              adminLoading={adminLoading}
              coinLoadAmount={adminCoinLoadAmount}
              distributionDays={adminDistributionDays}
              estimatedSuccessProbability={gameSettings?.estimatedSuccessProbability || 0}
              inactivityTimeoutSeconds={adminInactivityTimeout}
              adminQuery={adminQuery}
              adminStatus={adminStatus}
              onAddPlayTime={handleAdminAddPlayTime}
              onAction={handleAdminStatusChange}
              onDelete={handleAdminDelete}
              onCoinLoadAmountChange={setAdminCoinLoadAmount}
              onCoinLoadSave={handleAdminCoinsSave}
              onDistributionDaysChange={setAdminDistributionDays}
              onDistributionDaysSave={handleAdminDistributionDaysSave}
              onInactivityTimeoutChange={setAdminInactivityTimeout}
              onInactivityTimeoutSave={handleAdminTimeoutSave}
              onQueryChange={setAdminQuery}
              onStatusChange={setAdminStatus}
              submitting={submitting}
              users={adminUsers}
            />
          ) : screen === 'tasks' && isAdmin ? (
            <AdminTasksScreen onAction={handleAdminStatusChange} submitting={submitting} tasks={adminTasks} />
          ) : screen === 'play' && !isAdmin ? (
            <InspectionScreen
              backendConnected={backendConnected}
              inactivityTimeoutSeconds={gameSettings?.inactivityTimeoutSeconds || 30}
              inspectArea={inspectArea}
              startPlaySession={startPlaySession}
              stopPlaySession={stopPlaySession}
              stopPlaySessionKeepalive={stopPlaySessionKeepalive}
              user={session.user}
            />
          ) : (
            <AuthenticatedHome
              isAdmin={isAdmin}
              onOpenPlay={() => setScreen('play')}
              onOpenProfile={() => setScreen('profile')}
              user={session.user}
            />
          )}
        </>
      ) : (
        <LandingScreen
          stats={stats}
        />
      )}
    </div>
  );
}

export default App;
