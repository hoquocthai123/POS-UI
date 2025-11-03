import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../Components/NotificationContext";

const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";

export default function Profile() {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const user = JSON.parse(localStorage.getItem("user"));
  const [currentShift, setCurrentShift] = useState(null);

  // 🔹 Load ca đang mở của user khi vào Profile
  useEffect(() => {
    if (!user) return;
    const fetchShift = async () => {
      try {
        const res = await fetch(`${API_BASE}/shifts/open/current/${user.id_user}`);
        if (res.ok) {
          const data = await res.json();
          setCurrentShift(data);
        } else {
          setCurrentShift(null);
        }
      } catch (err) {
        console.error("Lỗi khi load ca hiện tại:", err);
        setCurrentShift(null);
      }
    };
    fetchShift();
  }, [user]);

  const handleLogout = () => {
    if (currentShift) {
      // có ca đang mở → yêu cầu đóng ca
      showNotification("Vui lòng đóng ca trước khi đăng xuất!", "error");
      navigate("/closeshift");
      return;
    }

    // không có ca → logout bình thường
    localStorage.removeItem("user");
    showNotification("Đăng xuất thành công!", "success");
    navigate("/login");
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">👤 Thông tin cá nhân</h2>

      {user && (
        <div className="mb-4">
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="w-full mt-6 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 rounded-lg transition"
      >
        Đăng xuất
      </button>
    </div>
  );
}
