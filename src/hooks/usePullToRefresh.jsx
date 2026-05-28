import { useState, useRef, useCallback } from 'react';

export default function usePullToRefresh(onRefresh) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(null);
  const THRESHOLD = 70;

  const onTouchStart = useCallback((e) => {
    if (window.scrollY === 0) startY.current = e.touches[0].clientY;
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0 && window.scrollY === 0) {
      setIsPulling(true);
      setPullDistance(Math.min(dy * 0.5, THRESHOLD + 20));
    }
  }, []);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      setPullDistance(0);
      setIsPulling(false);
      await onRefresh();
      setIsRefreshing(false);
    } else {
      setPullDistance(0);
      setIsPulling(false);
    }
    startY.current = null;
  }, [pullDistance, onRefresh]);

  const containerProps = { onTouchStart, onTouchMove, onTouchEnd };

  function PullIndicator() {
    if (!isPulling && !isRefreshing) return null;
    const progress = Math.min(pullDistance / THRESHOLD, 1);
    return (
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: isPulling ? pullDistance : (isRefreshing ? 48 : 0),
        transition: isPulling ? 'none' : 'height 0.3s',
        overflow: 'hidden',
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: '50%',
          border: '3px solid rgba(124,58,237,0.3)',
          borderTopColor: '#7C3AED',
          animation: isRefreshing ? 'ptr-spin 0.7s linear infinite' : 'none',
          transform: isPulling ? `rotate(${progress * 270}deg)` : undefined,
          opacity: isRefreshing ? 1 : progress,
          transition: isPulling ? 'none' : 'all 0.2s',
        }} />
      </div>
    );
  }

  return { containerProps, isRefreshing, PullIndicator };
}