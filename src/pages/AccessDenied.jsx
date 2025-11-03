// src/pages/AccessDenied.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function AccessDenied() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-10 rounded shadow text-center space-y-4">
        <h1 className="text-2xl font-bold text-red-600">Bạn không có quyền truy cập</h1>
        <p>Vui lòng liên hệ quản trị viên hoặc trở về trang chính.</p>
        <Link
          to="/POS"
          className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Quay về POS
        </Link>
      </div>
    </div>
  );
}
