import { useState, useEffect } from "react";

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [type, setType] = useState(""); // "" = tất cả
  const [loading, setLoading] = useState(false);

  const fetchReports = async (selectedType) => {
    setLoading(true);
    try {
      const url = selectedType ? `/api/reports?type=${selectedType}` : `/api/reports`;
      const res = await fetch(url);
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Error fetching reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(type);
  }, [type]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Báo cáo lỗi</h1>
      <p className="mb-4">Tổng hợp các báo cáo lỗi theo từng loại hoạt động.</p>

      {/* Bộ lọc chọn loại báo cáo */}
      <div className="mb-4">
        <label className="mr-2 font-semibold">Chọn loại:</label>
        <select
          className="border rounded p-2"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="">Tất cả</option>
          <option value="order">Order</option>
          <option value="good">Good</option>
          <option value="customer">Customer</option>
          <option value="user">User</option>
          <option value="shift">Shift</option>
        </select>
      </div>

      {/* Hiển thị danh sách báo cáo */}
      {loading ? (
        <p>Đang tải dữ liệu...</p>
      ) : reports.length === 0 ? (
        <p>Không có báo cáo nào.</p>
      ) : (
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2">ID</th>
              <th className="border p-2">Tiêu đề</th>
              <th className="border p-2">Chi tiết</th>
              <th className="border p-2">Loại</th>
              <th className="border p-2">Ngày tạo</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id_repo}>
                <td className="border p-2">{r.id_repo}</td>
                <td className="border p-2">{r.error_title}</td>
                <td className="border p-2">{r.error_detail}</td>
                <td className="border p-2">{r.type}</td>
                <td className="border p-2">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
