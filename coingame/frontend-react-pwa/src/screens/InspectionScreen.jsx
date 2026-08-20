import { useCallback, useEffect, useRef, useState } from 'react';
import PanelHeader from '../components/common/PanelHeader';
import { useI18n } from '../i18n/I18nProvider';

const INSPECTION_FEEDBACK_MS = 1400;
const POINT_MESSAGE_MS = 3200;
const CONNECTION_GRACE_MS = 5000;

function formatRemainingTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatCoinBalance(value) {
  return Number(value || 0).toFixed(2);
}

function playCoinSound() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return;
  }

  const context = new AudioContextClass();
  const now = context.currentTime;
  const gainNode = context.createGain();
  gainNode.connect(context.destination);
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

  const oscillatorA = context.createOscillator();
  oscillatorA.type = 'triangle';
  oscillatorA.frequency.setValueAtTime(880, now);
  oscillatorA.frequency.exponentialRampToValueAtTime(1320, now + 0.16);
  oscillatorA.connect(gainNode);
  oscillatorA.start(now);
  oscillatorA.stop(now + 0.2);

  const oscillatorB = context.createOscillator();
  oscillatorB.type = 'sine';
  oscillatorB.frequency.setValueAtTime(1320, now + 0.1);
  oscillatorB.frequency.exponentialRampToValueAtTime(1760, now + 0.34);
  oscillatorB.connect(gainNode);
  oscillatorB.start(now + 0.08);
  oscillatorB.stop(now + 0.38);

  window.setTimeout(() => {
    context.close().catch(() => {});
  }, 600);
}

export default function InspectionScreen({
  backendConnected,
  inactivityTimeoutSeconds,
  inspectArea,
  startPlaySession,
  stopPlaySession,
  stopPlaySessionKeepalive,
  user,
}) {
  const { t } = useI18n();
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraState, setCameraState] = useState('loading');
  const [sessionRunning, setSessionRunning] = useState(false);
  const [isInspecting, setIsInspecting] = useState(false);
  const [result, setResult] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(user?.playTimeSeconds || 0);
  const [totalPlayedSeconds, setTotalPlayedSeconds] = useState(0);
  const [totalCoinsFound, setTotalCoinsFound] = useState(0);
  const [coinBalance, setCoinBalance] = useState('0.00');
  const [probe, setProbe] = useState(null);
  const [probeMode, setProbeMode] = useState('scan');
  const [pointMessage, setPointMessage] = useState(null);
  const [sessionPaused, setSessionPaused] = useState(false);
    const [searchEnabled, setSearchEnabled] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState({
    progress: false,
    feedback: false,
  });
  const sessionActiveRef = useRef(false);
  const sessionBaselineRef = useRef({ totalPlayedSeconds: 0, totalCoinsFound: 0 });
  const disconnectTimeoutRef = useRef(null);
  const inactivityTimerRef = useRef(null);
  const reconnectPendingRef = useRef(false);

  const activatePlaySession = useCallback(async () => {
    if (cameraState !== 'ready') {
      return null;
    }

    const response = await startPlaySession().catch(() => null);
    if (!response) {
      return null;
    }

    sessionActiveRef.current = true;
    setSessionRunning(true);
    setSearchEnabled(true);
    setSessionPaused(false);
    setRemainingSeconds(response.remainingPlayTimeSeconds);
    setTotalPlayedSeconds(response.totalPlayedSeconds);
    setTotalCoinsFound(response.totalCoinsFound);
    setCoinBalance(response.coinBalance);
    sessionBaselineRef.current = {
      totalPlayedSeconds: response.totalPlayedSeconds,
      totalCoinsFound: response.totalCoinsFound,
    };
    return response;
  }, [cameraState, startPlaySession]);

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      window.clearTimeout(inactivityTimerRef.current);
    }

    if (!searchEnabled || !inactivityTimeoutSeconds) {
      return;
    }

    inactivityTimerRef.current = window.setTimeout(() => {
      if (!sessionActiveRef.current || !searchEnabled) {
        return;
      }

      setSearchEnabled(false);
      setSessionPaused(true);
      setSessionRunning(false);
      setProbe(null);
      setProbeMode('scan');
      setPointMessage({
        x: 50,
        y: 52,
        text: t('inspection.inactivityStopped', { seconds: inactivityTimeoutSeconds }),
      });
      stopPlaySession().catch(() => {});
      sessionActiveRef.current = false;
    }, inactivityTimeoutSeconds * 1000);
  }, [inactivityTimeoutSeconds, searchEnabled, stopPlaySession, t]);

  const attachStreamToVideo = useCallback(async (stream) => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return false;
    }

    videoElement.muted = true;
    videoElement.defaultMuted = true;
    videoElement.playsInline = true;
    videoElement.setAttribute('playsinline', 'true');
    videoElement.setAttribute('muted', 'true');
    videoElement.srcObject = stream;

    try {
      await videoElement.play();
    } catch (error) {
      await new Promise((resolve) => {
        const handleLoadedMetadata = () => {
          videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
          resolve();
        };
        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
      });
      await videoElement.play().catch(() => {});
    }

    return Boolean(videoElement.srcObject);
  }, []);

  useEffect(() => {
    setRemainingSeconds(user?.playTimeSeconds || 0);
  }, [user?.playTimeSeconds]);

  useEffect(() => {
    if (typeof user?.totalPlayedSeconds === 'number') {
      setTotalPlayedSeconds(user.totalPlayedSeconds);
    }
    if (typeof user?.totalCoinsFound === 'number') {
      setTotalCoinsFound(user.totalCoinsFound);
    }
    if (typeof user?.coinBalance !== 'undefined') {
      setCoinBalance(user.coinBalance);
    }
  }, [user?.coinBalance, user?.totalCoinsFound, user?.totalPlayedSeconds]);

  useEffect(() => {
    return () => {
      if (sessionActiveRef.current) {
        stopPlaySession().catch(() => {});
        sessionActiveRef.current = false;
        setSessionRunning(false);
      }
      if (disconnectTimeoutRef.current) {
        window.clearTimeout(disconnectTimeoutRef.current);
      }
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [stopPlaySession]);

  useEffect(() => {
    if (backendConnected) {
      if (disconnectTimeoutRef.current) {
        window.clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }

      if (!reconnectPendingRef.current || !searchEnabled || cameraState !== 'ready') {
        return undefined;
      }

      reconnectPendingRef.current = false;
      activatePlaySession().then((response) => {
        if (!response) {
          return;
        }
        setResult({
          status: 'idle',
          title: t('inspection.reconnectedTitle'),
          text: t('inspection.reconnectedText'),
        });
      }).catch(() => {});

      return undefined;
    }

    if (disconnectTimeoutRef.current) {
      window.clearTimeout(disconnectTimeoutRef.current);
    }

    disconnectTimeoutRef.current = window.setTimeout(() => {
      sessionActiveRef.current = false;
      reconnectPendingRef.current = true;
      setSessionPaused(true);
      setSessionRunning(false);
      setIsInspecting(false);
      setProbe(null);
      setResult({
        status: 'failure',
        title: t('inspection.connectionLostTitle'),
        text: t('inspection.connectionLostText'),
      });
    }, CONNECTION_GRACE_MS);

    return () => {
      if (disconnectTimeoutRef.current) {
        window.clearTimeout(disconnectTimeoutRef.current);
        disconnectTimeoutRef.current = null;
      }
    };
  }, [activatePlaySession, backendConnected, cameraState, searchEnabled, t]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        if (sessionActiveRef.current) {
          stopPlaySessionKeepalive();
          sessionActiveRef.current = false;
          setSessionRunning(false);
        }
        return;
      }

      if (!searchEnabled || cameraState !== 'ready') {
        return;
      }

      activatePlaySession().then((response) => {
        if (response) {
          resetInactivityTimer();
        }
      }).catch(() => {});
    };

    const handlePageHide = () => {
      if (sessionActiveRef.current) {
        stopPlaySessionKeepalive();
        sessionActiveRef.current = false;
        setSessionRunning(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [activatePlaySession, cameraState, resetInactivityTimer, searchEnabled, stopPlaySessionKeepalive]);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      setCameraState('loading');
      if (!window.isSecureContext) {
        setCameraState('insecure');
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraState('unsupported');
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: 'environment' },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const attached = await attachStreamToVideo(stream);
        if (!attached) {
          setCameraState('unavailable');
          return;
        }
        setCameraState('ready');
        if (searchEnabled) {
          const response = await startPlaySession().catch(() => null);
          if (response) {
            sessionActiveRef.current = true;
            setSessionRunning(true);
            setSearchEnabled(true);
            setSessionPaused(false);
            setRemainingSeconds(response.remainingPlayTimeSeconds);
            setTotalPlayedSeconds(response.totalPlayedSeconds);
            setTotalCoinsFound(response.totalCoinsFound);
            setCoinBalance(response.coinBalance);
            sessionBaselineRef.current = {
              totalPlayedSeconds: response.totalPlayedSeconds,
              totalCoinsFound: response.totalCoinsFound,
            };
            resetInactivityTimer();
          }
        }
      } catch (error) {
        if (error?.name === 'NotAllowedError') {
          setCameraState('denied');
          return;
        }

        if (error?.name === 'SecurityError') {
          setCameraState('insecure');
          return;
        }

        setCameraState('unavailable');
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [attachStreamToVideo, resetInactivityTimer, searchEnabled, startPlaySession]);

  useEffect(() => {
    if (!sessionRunning || remainingSeconds <= 0 || sessionPaused) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setRemainingSeconds((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [remainingSeconds, sessionPaused, sessionRunning]);

  useEffect(() => {
    if (remainingSeconds > 0 || !searchEnabled) {
      return undefined;
    }

    if (sessionActiveRef.current) {
      stopPlaySession().catch(() => {});
      sessionActiveRef.current = false;
    }
    setSearchEnabled(false);
    setSessionPaused(true);
    setSessionRunning(false);
    return undefined;
  }, [remainingSeconds, searchEnabled, stopPlaySession]);

  useEffect(() => {
    if (!pointMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setPointMessage(null);
    }, POINT_MESSAGE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [pointMessage]);

  async function handleInspect(event) {
    if (!searchEnabled) {
      setPointMessage({
        x: 50,
        y: 52,
        text: t('inspection.searchPaused'),
      });
      return;
    }

    if (cameraState !== 'ready' || isInspecting) {
      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const pointerX = typeof event.clientX === 'number' ? event.clientX : bounds.left + bounds.width / 2;
    const pointerY = typeof event.clientY === 'number' ? event.clientY : bounds.top + bounds.height / 2;
    const x = ((pointerX - bounds.left) / bounds.width) * 100;
    const y = ((pointerY - bounds.top) / bounds.height) * 100;

    if (sessionPaused || !backendConnected) {
      setPointMessage({ x, y, text: t('inspection.connectionLostText') });
      return;
    }

    if (remainingSeconds <= 0) {
      setPointMessage({ x, y, text: t('inspection.noTimePopup') });
      return;
    }

    setIsInspecting(true);
    setResult(null);
    setProbe({ x, y });
    setProbeMode('scan');

    try {
      const response = await inspectArea({ x, y });
      if (!response) {
        setIsInspecting(false);
        setProbe(null);
        return;
      }

      const nextAttempts = attempts + 1;
      const nextSuccesses = response.success ? successes + 1 : successes;
      setAttempts(nextAttempts);
      setSuccesses(nextSuccesses);
      setRemainingSeconds(response.remainingPlayTimeSeconds);
      setTotalPlayedSeconds(response.totalPlayedSeconds);
      setTotalCoinsFound(response.totalCoinsFound);
      setCoinBalance(response.coinBalance);
      setResult(
        response.success
          ? {
              status: 'success',
              title: t('inspection.successTitle'),
              text: t('inspection.successText', { amount: response.rewardAmount || '1.00' }),
            }
          : {
              status: 'failure',
              title: t('inspection.failureTitle'),
              text: t('inspection.failureText'),
            }
      );
      if (typeof response.inactivityTimeoutSeconds === 'number' && response.inactivityTimeoutSeconds > 0) {
        resetInactivityTimer();
      }
      if (response.success) {
        setProbeMode('coin');
        playCoinSound();
      }
    } catch (error) {
      setPointMessage({ x, y, text: error.message || t('inspection.noTimePopup') });
    } finally {
      window.setTimeout(() => {
        setIsInspecting(false);
        setProbe(null);
        setProbeMode('scan');
      }, INSPECTION_FEEDBACK_MS);
    }
  }

  function handleInspectKeyDown(event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleInspect(event);
    }
  }

  const currentSessionPlayedSeconds = Math.max(totalPlayedSeconds - sessionBaselineRef.current.totalPlayedSeconds, 0);
  const currentSessionCoinsFound = Math.max(totalCoinsFound - sessionBaselineRef.current.totalCoinsFound, 0);

  function toggleDetails(section) {
    setDetailsOpen((current) => ({
      ...current,
      [section]: !current[section],
    }));
  }

  async function toggleSearch() {
    if (isInspecting) {
      return;
    }

    if (searchEnabled) {
      setSearchEnabled(false);
      setSessionPaused(true);
      setSessionRunning(false);
      setProbe(null);
      setProbeMode('scan');
      setResult({
        status: 'idle',
        title: t('inspection.awaitingTitle'),
        text: t('inspection.tapHint'),
      });
      if (sessionActiveRef.current) {
        await stopPlaySession().catch(() => {});
        sessionActiveRef.current = false;
      }
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      return;
    }

    const response = await activatePlaySession();
    if (!response) {
      return;
    }
    setResult({
      status: 'idle',
      title: t('inspection.awaitingTitle'),
      text: t('inspection.tapHint'),
    });
    resetInactivityTimer();
  }

  useEffect(() => {
    if (!searchEnabled) {
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
      return undefined;
    }

    const events = ['pointerdown', 'pointermove', 'keydown', 'touchstart'];
    const handleActivity = () => resetInactivityTimer();

    events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    resetInactivityTimer();

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
      if (inactivityTimerRef.current) {
        window.clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [inactivityTimeoutSeconds, resetInactivityTimer, searchEnabled]);

  return (
    <main className="screen-shell">
      <section className="auth-panel inspection-panel single-panel">
        <PanelHeader title={t('inspection.panelTitle')} subtitle={t('inspection.panelSubtitle')} />

        <div
          className={`camera-stage camera-${cameraState} ${remainingSeconds <= 0 || !searchEnabled ? 'camera-idle' : ''} ${isFullScreen ? 'fullscreen' : ''}`}
          onClick={handleInspect}
          onKeyDown={handleInspectKeyDown}
          role="button"
          tabIndex={0}
        >
          <video autoPlay className="camera-feed" muted playsInline ref={videoRef} />
          <div className="camera-overlay">
            <div className="camera-reticle" />
            <div className="camera-overlay-controls">
              <div className={`camera-status-chip ${cameraState === 'ready' ? 'online' : 'offline'}`} title={t(`inspection.cameraState.${cameraState}`)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  <path d="M12 4a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm0 4a4 4 0 1 1-4 4 4 4 0 0 1 4-4Z" />
                </svg>
              </div>
              <div className="camera-timer-chip">{formatRemainingTime(remainingSeconds)}</div>
              <button
                aria-label={searchEnabled ? t('actions.pauseSearch') : t('actions.resumeSearch')}
                className={`camera-search-toggle ${searchEnabled ? 'active' : 'paused'}`}
                onClick={(event) => {
                  event.stopPropagation();
                  toggleSearch();
                }}
                title={searchEnabled ? t('actions.pauseSearch') : t('actions.resumeSearch')}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  {searchEnabled ? <path d="M8 6h3v12H8V6Zm5 0h3v12h-3V6Z" /> : <path d="m9 7 8 5-8 5V7Z" />}
                </svg>
              </button>
              <button
                aria-label={isFullScreen ? t('actions.exitFullScreen') : t('actions.enterFullScreen')}
                className="camera-fullscreen-toggle"
                onClick={(event) => {
                  event.stopPropagation();
                  setIsFullScreen(!isFullScreen);
                }}
                title={isFullScreen ? t('actions.exitFullScreen') : t('actions.enterFullScreen')}
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                  {isFullScreen ? <path d="M5 16h3v3h2v-5H5v2Zm3-9H5v2h5V4H8v3Zm6 12h2v-3h3v-2h-5v5Zm2-12v-2h-2V4h5v5h-3Z" /> : <path d="m7 14h2v5H4v-5h3Zm-3-4h5V4H7v3H4v3Zm10 7h-2v-5h5v2h-3v3Zm2-9h-5V4h3v3h2v3Z" />} 
                </svg>
              </button>
            </div>
            {probe ? (
              <div className={`inspect-probe ${probeMode === 'coin' ? 'coin-found' : ''}`} style={{ left: `${probe.x}%`, top: `${probe.y}%` }}>
                <span className="inspect-probe-ring" />
                {probeMode === 'coin' ? <span className="inspect-probe-coin">$</span> : <span className="inspect-probe-glass" />}
              </div>
            ) : null}
            {pointMessage ? (
              <div className="inspect-popup" style={{ left: `${pointMessage.x}%`, top: `${pointMessage.y}%` }}>
                {pointMessage.text}
              </div>
            ) : null}
          </div>
          {cameraState !== 'ready' ? <div className="camera-fallback">{t(`inspection.cameraHelp.${cameraState}`)}</div> : null}
          {cameraState === 'ready' && remainingSeconds <= 0 ? <div className="camera-fallback">{t('inspection.cameraHelp.noTime')}</div> : null}
        </div>

        <div className="inspection-collapsible-stack">
          <section className={`inspection-collapsible ${detailsOpen.feedback ? 'open' : ''}`}>
            <button className="inspection-collapsible-toggle" onClick={() => toggleDetails('feedback')} type="button">
              <span>{t('inspection.resultLabel')}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                {detailsOpen.feedback ? <path d="m7 14 5-5 5 5H7Z" /> : <path d="m7 10 5 5 5-5H7Z" />}
              </svg>
            </button>
            {detailsOpen.feedback ? (
              <div className="inspection-collapsible-body">
                <div className="inspection-hint">{isInspecting ? t('inspection.inspecting') : t('inspection.tapHint')}</div>
                <div className={`inspection-result ${result?.status || 'idle'}`}>
                  <span className="feature-kicker">{t('inspection.resultLabel')}</span>
                  <strong>{result?.title || t('inspection.awaitingTitle')}</strong>
                  <p>{result?.text || t('inspection.awaitingText')}</p>
                </div>
              </div>
            ) : null}
          </section>

          <section className={`inspection-collapsible ${detailsOpen.progress ? 'open' : ''}`}>
            <button className="inspection-collapsible-toggle" onClick={() => toggleDetails('progress')} type="button">
              <span>{t('inspection.metrics.playTime')}</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
                {detailsOpen.progress ? <path d="m7 14 5-5 5 5H7Z" /> : <path d="m7 10 5 5 5-5H7Z" />}
              </svg>
            </button>
            {detailsOpen.progress ? (
              <div className="inspection-collapsible-body">
                <div className="inspection-stats-bar">
                  <div className="feature-card compact-stat">
                    <span className="feature-kicker">{t('inspection.metrics.attempts')}</span>
                    <p>{attempts}</p>
                  </div>
                  <div className="feature-card compact-stat">
                    <span className="feature-kicker">{t('inspection.metrics.playTime')}</span>
                    <p>{formatRemainingTime(remainingSeconds)}</p>
                  </div>
                  <div className="feature-card compact-stat">
                    <span className="feature-kicker">{t('inspection.metrics.totalPlayed')}</span>
                    <p>{formatRemainingTime(totalPlayedSeconds)}</p>
                  </div>
                  <div className="feature-card compact-stat">
                    <span className="feature-kicker">{t('inspection.metrics.sessionPlayed')}</span>
                    <p>{formatRemainingTime(currentSessionPlayedSeconds)}</p>
                  </div>
                  <div className="feature-card compact-stat">
                    <span className="feature-kicker">{t('inspection.metrics.totalCoinsFound')}</span>
                    <p>{totalCoinsFound}</p>
                  </div>
                  <div className="feature-card compact-stat">
                    <span className="feature-kicker">{t('inspection.metrics.sessionCoinsFound')}</span>
                    <p>{currentSessionCoinsFound}</p>
                  </div>
                  <div className="feature-card compact-stat">
                    <span className="feature-kicker">{t('inspection.metrics.coinBalance')}</span>
                    <p>{formatCoinBalance(coinBalance)}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
