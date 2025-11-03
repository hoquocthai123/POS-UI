// src/pages/Dashboard.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";

export default function Dashboard() {
  const [loading, setLoading] = useState(false);
  const [revenueDate, setRevenueDate] = useState([]);
  const [productStats, setProductStats] = useState([]);
  const [filterDates, setFilterDates] = useState({ start: "", end: "" });
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [resDate, resProduct] = await Promise.all([
        axios.get(`${API_BASE}/stats/revenue-by-date`),
        axios.get(`${API_BASE}/stats/revenue-by-product`),
      ]);
      setRevenueDate(resDate.data);
      setProductStats(resProduct.data);
    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  // --- Lọc dữ liệu ---
  const filteredRevenueDate = revenueDate.filter((item) => {
    const itemDate = new Date(item.date);
    const start = filterDates.start ? new Date(filterDates.start) : null;
    const end = filterDates.end ? new Date(filterDates.end) : null;
    if (start && itemDate < start) return false;
    if (end && itemDate > end) return false;
    return true;
  });

  const filteredProductStats = productStats.filter(
    (item) => selectedProducts.length === 0 || selectedProducts.includes(item.product_name)
  );

  // --- Biểu đồ ---
  const chartRevenueByDate = (data) => ({
    labels: data.map((item) => new Date(item.date).toLocaleDateString("vi-VN")),
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: data.map((item) => item.total_revenue),
        borderColor: "rgba(75,192,192,1)",
        backgroundColor: "rgba(75,192,192,0.2)",
        tension: 0.4,
      },
    ],
  });

  const chartRevenueByProduct = (data) => ({
    labels: data.map((item) => item.product_name),
    datasets: [
      {
        label: "Doanh thu (VNĐ)",
        data: data.map((item) => item.total_revenue),
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        yAxisID: "y1",
      },
      {
        label: "Số lượng bán",
        data: data.map((item) => item.total_quantity),
        backgroundColor: "rgba(54, 162, 235, 0.6)",
        yAxisID: "y2",
      },
    ],
  });

  const optionsProduct = {
    responsive: true,
    interaction: { mode: "index", intersect: false },
    stacked: false,
    plugins: { title: { display: true, text: "Doanh thu & Số lượng bán theo sản phẩm" } },
    scales: {
      y1: {
        type: "linear",
        display: true,
        position: "left",
        title: { display: true, text: "Doanh thu (VNĐ)" },
      },
      y2: {
        type: "linear",
        display: true,
        position: "right",
        title: { display: true, text: "Số lượng" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  if (loading) return <p className="p-6 text-lg">Đang tải dữ liệu...</p>;

  return (
    <div className="p-6 bg-gray-100 min-h-screen space-y-8">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>

      {/* --- Filter --- */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
          <input
            type="date"
            value={filterDates.start}
            onChange={(e) => setFilterDates({ ...filterDates, start: e.target.value })}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
          <input
            type="date"
            value={filterDates.end}
            onChange={(e) => setFilterDates({ ...filterDates, end: e.target.value })}
            className="mt-1 p-2 border rounded w-full"
          />
        </div>
        
      </div>

      {/* --- Biểu đồ doanh thu theo ngày --- */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">Doanh thu theo ngày</h2>
        {filteredRevenueDate.length ? (
          <Line data={chartRevenueByDate(filteredRevenueDate)} />
        ) : (
          <p>Không có dữ liệu</p>
        )}
      </div>
      <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">Sản phẩm</label>
          <select
            multiple
            value={selectedProducts}
            onChange={(e) =>
              setSelectedProducts(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            className="mt-1 p-2 border rounded w-full h-32"
          >
            {productStats.map((p) => (
              <option key={p.product_name} value={p.product_name}>
                {p.product_name}
              </option>
            ))}
          </select>
        </div>

      {/* --- Biểu đồ doanh thu & số lượng theo sản phẩm --- */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">Doanh thu theo sản phẩm</h2>
        {filteredProductStats.length ? (
          <Bar data={chartRevenueByProduct(filteredProductStats)} options={optionsProduct} />
        ) : (
          <p>Không có dữ liệu</p>
        )}
      </div>
    </div>
  );
}
