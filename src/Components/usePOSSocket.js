import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function usePOSSocket(apiBase, orderCode, onPaid) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!apiBase) return;

    socketRef.current = io(apiBase, { transports: ["websocket"] });
    const s = socketRef.current;

    const handlePaid = ({ orderCode: paidCode }) => {
      if (paidCode && paidCode === orderCode) {
        onPaid?.();
      }
    };

    s.on("order_paid", handlePaid);

    return () => {
      s.off("order_paid", handlePaid);
      s.disconnect();
    };
  }, [apiBase, orderCode, onPaid]);

  return socketRef;
}
