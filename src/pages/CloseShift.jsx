import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../Components/NotificationContext";


const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";
const denominations = [500000, 200000, 100000, 50000, 20000, 10000, 5000, 2000, 1000];

export default function CloseShift() {
  const [currentShift, setCurrentShift] = useState(null);
  const [counts, setCounts] = useState(
    denominations.reduce((acc, d) => ({ ...acc, [d]: 0 }), {})
  );
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  //làm đẹp nhoa
  const toVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n) || 0) + " ₫";

  const opening = Number(currentShift?.opening_total) || 0;
  const sales = Number(currentShift?.sales_total) || 0;
  const theo = opening + sales;           // Tổng lý thuyết
  const actual = Number(total) || 0;        // Tổng thực tế (đếm)
  const diff = actual - theo;             // Chênh lệch
   // ---------- Notification -----
    const { showNotification } = useNotification();


  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchShift = async () => {
      try {
        const res = await fetch(`${API_BASE}/shifts/open/current/${user.id_user}`);
        const data = await res.json();
        if (data && (data.id || data.id_shift)) {
          setCurrentShift(data);
        } else {
          setCurrentShift(null); // Không có ca mở
        }
      } catch (error) {
        console.error(error);
        setCurrentShift(null);
      }
    };

    fetchShift();
  }, [user]);


  // Tính tổng tiền nhập vào
  useEffect(() => {
    let sum = 0;
    for (const d of denominations) {
      sum += d * (counts[d] || 0);
    }
    setTotal(sum);
  }, [counts]);

  const handleChange = (denom, val) => {
    setCounts((prev) => ({ ...prev, [denom]: parseInt(val) || 0 }));
  };

  const handleCloseShift = async () => {
  try {
    const res = await fetch(`${API_BASE}/shifts/${currentShift.id}/close`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ closing_balance: counts }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.removeItem("user"); 
      showNotification("Đăng xuất thành công!", "success");
      navigate("/login");
    } else {
       showNotification(data.error || "Đóng ca thất bại", "error");
    }
  } catch (err) {
    showNotification("Lỗi khi đóng ca", "error");
  }
};

  if (!currentShift) {
    return <p className="p-6 text-center">Đang tải ca hiện tại...</p>;
  }

  return (

    <div className="p-6 bg-white shadow rounded max-w-3xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-red-700 mb-4">🔒 Đóng ca</h2>
      <p><b>Người mở ca:</b> {currentShift.username}</p>
      <p><b>Thời gian mở:</b> {new Date(currentShift.opened_at).toLocaleString("vi-VN")}</p>
      <p><b>Số tiền mở ca:</b> {currentShift.opening_total.toLocaleString("vi-VN")} ₫</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {denominations.map((d) => (
          <div key={d} className="border rounded p-2">
            <label className="block text-sm text-gray-600">
              Mệnh giá {d.toLocaleString("vi-VN")} ₫
            </label>
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

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-lg border bg-white space-y-2">
          <p><b>💰 Tiền mở ca:</b> {toVND(opening)}</p>
          <p><b>🛒 Doanh thu trong ca:</b> {toVND(sales)}</p>
          <p>
            <b>📊 Tổng lý thuyết:</b>
            <span className="text-blue-700 ml-2">{toVND(theo)}</span>
          </p>
        </div>

        <div className="p-4 rounded-lg border bg-white space-y-2">
          <p>
            <b>✅ Tổng thực tế:</b>
            <span className="text-green-700 ml-2">{toVND(actual)}</span>
          </p>
          <p>
            <b>⚠️ Chênh lệch:</b>
            <span
              className={
                diff === 0 ? "text-green-600 ml-2"
                  : diff > 0 ? "text-yellow-600 ml-2"
                    : "text-red-600 ml-2"
              }
            >
              {toVND(diff)}
            </span>
          </p>
        </div>
      </div>



      <button
        onClick={handleCloseShift}
        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        ✅ Xác nhận đóng ca
      </button>
    </div>
  );
}
