import React, { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";

export default function CustomerPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [editingCustomer, setEditingCustomer] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/customers`);
      setCustomers(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy khách hàng:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/customers`, newCustomer);
      setNewCustomer({ name: "", phone: "", email: "" });
      fetchCustomers();
    } catch (err) {
      console.error("Lỗi khi thêm khách hàng:", err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc muốn xóa khách hàng này?")) {
      try {
        await axios.delete(`${API_BASE}/customers/${id}`);
        fetchCustomers();
      } catch (err) {
        console.error("Lỗi khi xóa khách hàng:", err);
      }
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

  if (loading) return <p className="p-6">Đang tải dữ liệu...</p>;

  return (
    
  <div className="p-6 bg-gray-100 min-h-screen space-y-6">
     <header className="sticky top-0 z-10 bg-white shadow p-4 flex justify-between items-center">
      <h1 className="text-2xl font-bold mb-4">Quản lý khách hàng</h1>
      <input
        type="text"
        placeholder="Tìm theo tên hoặc SĐT..."
        className="w-full max-w-md border rounded px-3 py-2"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </header>
    

    <div className="flex justify-between items-center mb-4">
      
      <button
        onClick={() => setEditingCustomer({})} // mở modal thêm khách hàng
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg text-2xl"
      >
        +
      </button>
    </div>

    {/* Danh sách khách hàng */}
    <div className="bg-white p-4 rounded shadow">
      <h2 className="text-xl font-semibold mb-4">Danh sách khách hàng</h2>
      <div className="overflow-x-auto">
        <table className="w-full border rounded-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="border p-2">Tên</th>
              <th className="border p-2">SĐT</th>
              <th className="border p-2">Email</th>
              <th className="border p-2">Điểm</th>
              
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length ? (
              filteredCustomers.map((c) => (
                <tr key={c.id_cus} className="hover:bg-gray-50">
                  <td className="border p-2">{c.name}</td>
                  <td className="border p-2">{c.phone}</td>
                  <td className="border p-2">{c.email}</td>
                  <td className="border p-2">{c.points}</td>
                  
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-4 text-center">
                  Không có khách hàng
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

    {/* Modal Thêm / Sửa khách hàng */}
    {editingCustomer !== null && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-xl font-semibold mb-4">
            {editingCustomer.id_cus ? "Chỉnh sửa khách hàng" : "Thêm khách hàng"}
          </h2>
          <form
            onSubmit={editingCustomer.id_cus ? handleUpdateCustomer : handleAddCustomer}
            className="space-y-3"
          >
            <input
              type="text"
              placeholder="Tên khách hàng"
              className="border p-2 w-full rounded"
              value={editingCustomer.name || ""}
              onChange={(e) =>
                setEditingCustomer({ ...editingCustomer, name: e.target.value })
              }
              required
            />
            <input
              type="text"
              placeholder="Số điện thoại"
              className="border p-2 w-full rounded"
              value={editingCustomer.phone || ""}
              onChange={(e) =>
                setEditingCustomer({ ...editingCustomer, phone: e.target.value })
              }
              required
            />
            <input
              type="email"
              placeholder="Email"
              className="border p-2 w-full rounded"
              value={editingCustomer.email || ""}
              onChange={(e) =>
                setEditingCustomer({ ...editingCustomer, email: e.target.value })
              }
            />
            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setEditingCustomer(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition"
              >
                {editingCustomer.id_cus ? "Lưu" : "Thêm"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}
