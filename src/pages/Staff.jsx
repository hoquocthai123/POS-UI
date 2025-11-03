import { useEffect, useState } from "react";
import axios from "axios";
import { useNotification } from "../Components/NotificationContext";


const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";


function UserManagement() {
  const [users, setUsers] = useState([]);
  const [newUser, setNewUser] = useState({ username: "", password: "", sdt: "", role: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const { showNotification } = useNotification();

  // Lấy danh sách user
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get("http://localhost:3000/users");
      setUsers(res.data);
    } catch (err) {
      setError("Không thể tải danh sách user");
    } finally {
      setLoading(false);
    }
  };

  // Thêm user mới
  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:3000/users", newUser);
      setNewUser({ username: "", password: "", sdt: "", role: "" });
      fetchUsers();
    } catch (err) {
      alert("Không thể thêm user");
    }
  };

  // Xóa user
  const handleDelete = async (id, username) => {
    if (!id) return;

    if (!window.confirm("Bạn có chắc muốn xóa user này?")) return;

    try {
      const res = await axios.delete(`${API_BASE}/users/${id}`);
      showNotification(`Xóa user ${username} thành công`, "success");

      setUsers((prev) => prev.filter((user) => user.id_user !== id));
    } catch (err) {
      showNotification(`User ${username} không thể xóa do có ràng buộc dữ liệu`, "error");
    }
  };
  const handleEdit = (user) => {
    setEditingUser({ ...user }); // mở modal với dữ liệu user
  };
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      await axios.put(`${API_BASE}/users/${editingUser.id_user}`, editingUser);
      showNotification(`Cập nhật user ${editingUser.username} thành công`, "success");
      setUsers((prev) =>
        prev.map((u) => (u.id_user === editingUser.id_user ? editingUser : u))
      );
      setEditingUser(null); // đóng modal
    } catch (err) {
      showNotification(`Cập nhật user ${editingUser.username} thất bại`, "error");
    }
  };



  return (
  <div className="p-6">
    <header className="sticky top-0 z-10 bg-white shadow p-4 flex justify-between items-center">
      <h2 className="text-2xl font-bold mb-4">Quản lý User</h2>
    </header>
    

    {/* Nút Thêm User */}
    <div className="mb-4">
      <button
        onClick={() => setEditingUser({})} // dùng same state để mở form thêm
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-full shadow-lg text-2xl"
      >
        +     
      </button>
    </div>

    {/* Bảng danh sách user */}
    {loading ? (
      <p>Đang tải...</p>
    ) : error ? (
      <p className="text-red-500">{error}</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg">
          <thead className="bg-gray-200">
            <tr>
              <th className="border px-4 py-2">ID</th>
              <th className="border px-4 py-2">Username</th>
              <th className="border px-4 py-2">SĐT</th>
              <th className="border px-4 py-2">Role</th>
              <th className="border px-4 py-2">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id_user} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{u.id_user}</td>
                <td className="border px-4 py-2">{u.username}</td>
                <td className="border px-4 py-2">{u.sdt}</td>
                <td className="border px-4 py-2">{u.role}</td>
                <td className="border px-4 py-2 flex space-x-2">
                  <button
                    onClick={() => handleEdit(u)}
                    className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition"
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(u.id_user, u.username)}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 transition"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {/* Modal Thêm / Sửa User */}
    {editingUser !== null && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
          <h2 className="text-xl font-semibold mb-4">
            {editingUser.id_user ? "Chỉnh sửa User" : "Thêm User"}
          </h2>
          <form
            onSubmit={editingUser.id_user ? handleUpdateUser : handleAddUser}
            className="space-y-2"
          >
            <input
              type="text"
              placeholder="Username"
              value={editingUser.username || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, username: e.target.value })
              }
              className="border p-2 w-full"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={editingUser.password || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, password: e.target.value })
              }
              className="border p-2 w-full"
              required={!editingUser.id_user} // edit có thể để trống
            />
            <input
              type="text"
              placeholder="Số điện thoại"
              value={editingUser.sdt || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, sdt: e.target.value })
              }
              className="border p-2 w-full"
            />
            <select
              value={editingUser.role || ""}
              onChange={(e) =>
                setEditingUser({ ...editingUser, role: e.target.value })
              }
              className="border p-2 w-full"
              required
            >
              <option value="">Chọn vai trò</option>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
            </select>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600 transition"
              >
                {editingUser.id_user ? "Lưu" : "Thêm"}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);

}

export default UserManagement;
