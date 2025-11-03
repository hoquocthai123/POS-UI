import { useEffect, useState } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";

export default function Sale() {
  const [orders, setOrders] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [customerMap, setCustomerMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchOrderDetails = async (orderId) => {
    setDetailLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/orders/${orderId}`);
      setOrderDetails(res.data);
    } catch (err) {
      console.error("Lỗi khi lấy chi tiết đơn:", err);
      setOrderDetails(null);
    } finally {
      setDetailLoading(false);
    }
  };


  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch đồng thời orders, users, customers
      const [ordersRes, usersRes, customersRes] = await Promise.all([
        axios.get(`${API_BASE}/orders`),
        axios.get(`${API_BASE}/users`),
        axios.get(`${API_BASE}/customers`),
      ]);

      setOrders(ordersRes.data);

      // Map user: id_user -> username
      const uMap = {};
      usersRes.data.forEach((u) => {
        uMap[String(u.id_user)] = u.username;
      });
      setUserMap(uMap);

      // Map customer: id_cus -> name
      const cMap = {};
      customersRes.data.forEach((c) => {
        cMap[String(c.id_cus)] = c.name;
      });
      setCustomerMap(cMap);

    } catch (err) {
      console.error("Lỗi khi lấy dữ liệu:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return (
  <>
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Danh sách đơn hàng</h1>
        <button
          onClick={fetchOrders}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Làm mới
        </button>
      </div>

      {loading ? (
        <p className="text-gray-500">Đang tải đơn hàng...</p>
      ) : orders.length === 0 ? (
        <p className="text-gray-500">Chưa có đơn hàng nào.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id_order}
              className="bg-white p-4 rounded shadow border border-gray-200"
            >
              <div className="flex justify-between mb-2">
                <p className="font-semibold">Đơn #{order.id_order}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <p>
                <strong>Nhân viên:</strong>{" "}
                {userMap[String(order.id_user)] || "Không rõ"}
              </p>
              <p>
                <strong>Khách hàng:</strong>{" "}
                {order.id_cus
                  ? customerMap[String(order.id_cus)] || "Không rõ"
                  : "Khách lẻ"}
              </p>
              <p>
                <strong>Tổng tiền:</strong>{" "}
                {Number(order.tongtien).toLocaleString()} đ
                <button
                  onClick={() => {
                    setSelectedOrder(order);
                    fetchOrderDetails(order.id_order);
                  }}
                  className="ml-2 text-blue-600 hover:underline text-sm"
                >
                  Xem chi tiết
                </button>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>

    {selectedOrder && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 w-[600px] max-h-[80vh] overflow-y-auto">
          <h2 className="text-xl font-bold mb-4">
            Chi tiết đơn #{selectedOrder.id_order}
          </h2>

          {detailLoading ? (
            <p className="text-gray-500">Đang tải chi tiết...</p>
          ) : orderDetails ? (
            <div className="space-y-2">
              <p>
                <strong>Nhân viên:</strong>{" "}
                {userMap[String(selectedOrder.id_user)]}
              </p>
              <p>
                <strong>Khách hàng:</strong>{" "}
                {selectedOrder.id_cus
                  ? customerMap[String(selectedOrder.id_cus)]
                  : "Khách lẻ"}
              </p>
              <p>
                <strong>Số điểm sử dụng:</strong> {selectedOrder.used_points || 0} điểm
              </p>
              <p>
                <strong>Ngày tạo:</strong>{" "}
                {new Date(selectedOrder.created_at).toLocaleString()}
              </p>
              <p>
                <strong>Tổng tiền:</strong>{" "}
                {Number(selectedOrder.tongtien).toLocaleString()} đ
              </p>

              <h3 className="font-semibold mt-4">Sản phẩm</h3>
              <table className="w-full border mt-2">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border px-2 py-1">Tên sản phẩm</th>
                    <th className="border px-2 py-1">SL</th>
                    <th className="border px-2 py-1">Giá</th>
                    <th className="border px-2 py-1">Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {orderDetails.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border px-2 py-1">{item.name}</td>
                      <td className="border px-2 py-1">{item.quantity}</td>
                      <td className="border px-2 py-1">
                        {Number(item.price).toLocaleString()} đ
                      </td>
                      <td className="border px-2 py-1">
                        {(item.quantity * item.price).toLocaleString()} đ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-red-500">Không lấy được chi tiết đơn hàng.</p>
          )}

          <div className="mt-4 text-right">
            <button
              onClick={() => {
                setSelectedOrder(null);
                setOrderDetails(null);
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);

}
