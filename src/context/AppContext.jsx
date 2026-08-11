import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const AppCtx = createContext(null);

export function AppProvider({ children }) {
  const [scaleConnected, setScaleConnected] = useState(false);
  const [scaleData, setScaleData] = useState(null); // { itemNo, weight, price }
  const [toasts, setToasts] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);

  // ─── WebSocket Bridge (connects to local Node bridge on port 3001) ──────
  const connectBridge = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:3001');
      wsRef.current = ws;

      ws.onopen = () => {
        setScaleConnected(true);
        addToast('⚖️ तराजू जुड़ गया! Scale connected!', 'success');
        if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      };

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          // Complete bill from scale PRINT button
          if (msg.type === 'SCALE_BILL') {
            setScaleData({ type: 'SCALE_BILL', items: msg.items, total: msg.total, ts: Date.now() });
          }
          // Individual weight reading
          if (msg.type === 'SCALE_DATA') {
            setScaleData({ type: 'SCALE_DATA', itemNo: msg.itemNo, weight: msg.weight, price: msg.price, ts: Date.now() });
          }
          // Live weight only (no item)
          if (msg.type === 'SCALE_WEIGHT') {
            setScaleData({ type: 'SCALE_WEIGHT', weight: msg.weight, ts: Date.now() });
          }
        } catch (_) {}
      };

      ws.onclose = () => {
        setScaleConnected(false);
        // Auto-reconnect every 5s
        reconnectTimer.current = setTimeout(connectBridge, 5000);
      };

      ws.onerror = () => { ws.close(); };
    } catch (_) {
      setScaleConnected(false);
      reconnectTimer.current = setTimeout(connectBridge, 5000);
    }
  }, []);

  useEffect(() => {
    connectBridge();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connectBridge]);

  // Send print command to bridge
  const printBill = useCallback((billData) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'PRINT_BILL', bill: billData }));
    }
  }, []);

  // ─── Toast system ──────────────────────────────────────────────────────
  const addToast = useCallback((msg, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  return (
    <AppCtx.Provider value={{ scaleConnected, scaleData, printBill, addToast, toasts }}>
      {children}
    </AppCtx.Provider>
  );
}

export const useApp = () => useContext(AppCtx);
