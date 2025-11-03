// src/components/PrivateRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import AccessDenied from "../pages/AccessDenied";

export default function PrivateRoute({ children, allowedRoles = [], requiresShift = false }) {
  const user = JSON.parse(localStorage.getItem("user"));

  if (!user) {
    // Nếu chưa login -> chuyển về login
    return <Navigate to="/login" />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Nếu role không hợp lệ -> hiện trang AccessDenied
    return <AccessDenied />;
  }

  if (requiresShift) {
    const shiftId = localStorage.getItem("shift_id");
    if (!shiftId) {
      // Nếu chưa mở ca -> chuyển về openshift
      return <Navigate to="/openshift" />;
    }
  }

  return children;
}
