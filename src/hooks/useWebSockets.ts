import { useEffect, useState, useCallback } from 'react';

export function useWebSockets(onMessage: (data: any) => void) {
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}`);

    ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      // Simple reconnect logic
      setTimeout(() => {
        setSocket(null);
      }, 3000);
    };

    setSocket(ws);

    return () => {
      ws.close();
    };
  }, [onMessage]);

  return socket;
}
