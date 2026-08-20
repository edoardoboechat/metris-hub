import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'aether.quest.split.ratio';
const DEFAULT_RATIO = 30;
const MIN_RATIO = 20;
const MAX_RATIO = 45;

function readStoredRatio() {
  const stored = Number(window.localStorage.getItem(STORAGE_KEY));
  if (Number.isFinite(stored) && stored >= MIN_RATIO && stored <= MAX_RATIO) {
    return stored;
  }
  return DEFAULT_RATIO;
}

export default function SplitLayout({ className, left, right }) {
  const containerRef = useRef(null);
  const [ratio, setRatio] = useState(readStoredRatio);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(ratio));
  }, [ratio]);

  const gridTemplateColumns = useMemo(() => `${ratio}fr 14px ${100 - ratio}fr`, [ratio]);

  function handlePointerDown(event) {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    event.preventDefault();

    const onPointerMove = (moveEvent) => {
      const bounds = container.getBoundingClientRect();
      const nextRatio = ((moveEvent.clientX - bounds.left) / bounds.width) * 100;
      const clampedRatio = Math.min(MAX_RATIO, Math.max(MIN_RATIO, nextRatio));
      setRatio(clampedRatio);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return (
    <main className={`split-layout ${className}`} ref={containerRef} style={{ gridTemplateColumns }}>
      <div className="split-pane split-pane-left">{left}</div>
      <div
        aria-label="Resize panels"
        className="split-divider"
        onPointerDown={handlePointerDown}
        role="separator"
      >
        <span />
      </div>
      <div className="split-pane split-pane-right">{right}</div>
    </main>
  );
}
