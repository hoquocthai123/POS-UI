import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";

export default function ReceiveGoods() {
  const [goods, setGoods] = useState([]);
  const [selected, setSelected] = useState(null);
  const [realQuantities, setRealQuantities] = useState({});
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/goods`)
      .then((res) => res.json())
      .then((data) => setGoods(data.filter((g) => g.status === "pending")))
      .catch((err) => console.error(err));
  }, []);

  const handleChangeQty = (id, value) => {
    setRealQuantities((prev) => ({ ...prev, [id]: parseInt(value) || 0 }));
  };

  const handleApprove = async () => {
    try {
      const res = await fetch(`${API_BASE}/goods/${selected.id}/approve`, {
        method: "PUT",
      });
      if (!res.ok) throw new Error("Lỗi duyệt phiếu");
      const data = await res.json();
      setMessage(`✅ ${data.message}`);
      setGoods((prev) => prev.filter((g) => g.id !== selected.id));
      setSelected(null);
    } catch {
      setMessage("❌ Không thể duyệt phiếu");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-green-700">
        📥 Nhận hàng (Duyệt phiếu)
      </h2>
      {message && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-700">
          {message}
        </div>
      )}

      {!selected ? (
        <div className="grid md:grid-cols-2 gap-4">
          {goods.map((g) => (
            <div
              key={g.id}
              className="border rounded-lg p-4 bg-white shadow hover:shadow-lg transition"
            >
              <h3 className="font-bold text-lg mb-2 text-blue-700">
                Phiếu: {g.code}
              </h3>
              <p className="text-sm text-gray-500">
                Ngày tạo: {new Date(g.created_at).toLocaleString("vi-VN")}
              </p>
              <p className="text-sm text-gray-600">
                Sản phẩm: {g.items.length}
              </p>
              <button
                className="mt-3 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded"
                onClick={() => setSelected(g)}
              >
                👀 Xem & Duyệt
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white p-5 rounded-lg shadow">
          <h3 className="text-xl font-bold mb-4 text-blue-700">
            Phiếu {selected.code}
          </h3>
          <table className="w-full border rounded">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Sản phẩm</th>
                <th className="p-2">SL Dự kiến</th>
                <th className="p-2">SL Thực tế</th>
              </tr>
            </thead>
            <tbody>
              {selected.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.product_name}</td>
                  <td className="p-2 text-center">{item.quantity}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      min="0"
                      value={realQuantities[item.id] ?? item.quantity}
                      onChange={(e) =>
                        handleChangeQty(item.id, e.target.value)
                      }
                      className="border rounded px-2 py-1 w-24 text-center focus:ring focus:ring-green-300"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end gap-3">
            <button
              className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              onClick={() => setSelected(null)}
            >
              ❌ Hủy
            </button>
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              onClick={handleApprove}
            >
              ✅ Duyệt phiếu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
