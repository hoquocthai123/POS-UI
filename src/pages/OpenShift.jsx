import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../Components/NotificationContext";

const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";
const denominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];

export default function OpenShift() {
  const [counts, setCounts] = useState(denominations.reduce((acc, d) => ({ ...acc, [d]: 0 }), {}));
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
   // ---------- Notification -----
    const { showNotification } = useNotification();

  useEffect(() => {
    if (!user) {
      showNotification("Vui lòng đăng nhập", "error");
      navigate("/login");
      return;
      
    }
    const checkShift = async () => {
      try {
        const res = await fetch(`${API_BASE}/shifts/open/current`);
        const data = await res.json();
        if (data && data.id_shift) {
          navigate("/"); // Nếu đã có ca → về POS
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    checkShift();
  }, [navigate]);

  useEffect(() => {
    let sum = 0;
    for (const d of denominations) sum += d * (counts[d] || 0);
    setTotal(sum);
  }, [counts]);

  const handleChange = (denom, val) => {
    setCounts((prev) => ({ ...prev, [denom]: parseInt(val) || 0 }));
  };

  const handleOpenShift = async () => {
  try {
    const res = await fetch(`${API_BASE}/shifts/open`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: user.id_user,
        opening_balance: counts,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      // ✅ Lưu đầy đủ thông tin ca để dùng lại
      localStorage.setItem("shift_id", data.shift_id);
      localStorage.setItem("currentShift", JSON.stringify(data));

      navigate("/pos"); // Về POS sau khi mở ca
      showNotification("Mở ca thành công!", "success");
    } else {
      showNotification(data.error || "Không thể mở ca", "error");
    }
  } catch (err) {
    showNotification("Lỗi kết nối", "error");
  }
};


  if (loading) return <div className="p-6 text-blue-600">Đang tải...</div>;

  return (
    <div className="p-6 bg-white shadow rounded max-w-3xl mx-auto">
      <h2 className="text-xl font-bold text-blue-700 mb-4">🔑 Mở ca</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {denominations.map((d) => (
          <div key={d} className="border rounded p-2">
            <label className="block text-sm text-gray-600">Mệnh giá {d.toLocaleString("vi-VN")} ₫</label>
            <input
              type="number"
              min="0"
              value={counts[d] || ""}
              onChange={(e) => handleChange(d, e.target.value)}
              className="w-full border rounded px-2 py-1 text-right"
            />
          </div>
        ))}
      </div>
      <div className="mt-4 font-semibold">
        Tổng: <span className="text-blue-700">{total.toLocaleString("vi-VN")} ₫</span>
      </div>
      <button
        onClick={handleOpenShift}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded"
      >
        ✅ Mở ca
      </button>
    </div>
  );
}
