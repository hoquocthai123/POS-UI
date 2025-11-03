import React, { createContext, useContext, useState } from "react";

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info"); // success | error | warning | info

  const showNotification = (msg, t = "info") => {
    setMessage(msg);
    setType(t);

    // ẩn sau 3s
    setTimeout(() => setMessage(""), 3000);
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}

      {message && (
        <div
          className={`fixed top-4 right-4 px-4 py-2 rounded shadow-lg text-white z-50 transition ${
            type === "success"
              ? "bg-green-600"
              : type === "error"
              ? "bg-red-600"
              : type === "warning"
              ? "bg-yellow-500"
              : "bg-blue-600"
          }`}
        >
          {message}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  return useContext(NotificationContext);
}