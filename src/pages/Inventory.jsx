import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../Components/NotificationContext";


const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
     // ---------- Notification -----
      const { showNotification } = useNotification();
  

  // Add modal
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    price: "",
    category: "",
    image: "",
    quantity: "",
  });

  // Edit modal
  const [editingId, setEditingId] = useState(null);
  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    barcode: "",
    price: "",
    category: "",
    image: "",
    quantity: "",
  });
  const [categories, setCategories] = useState([]);
   useEffect(() => {
    fetch("http://localhost:3000/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data))
      .catch((err) => console.error("Lỗi load categories:", err));
  }, []);

  // Fetch product list
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/products`);
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Add product
  const handleAdd = async (e) => {
  e.preventDefault();
  try {
    const newProduct = {
      name: form.name,
      barcode: form.barcode,
      price: Number(form.price) || 0,
      quantity: Number(form.quantity) || 0,
      image: form.image || null,
      category: form.category || "", // gửi chuỗi rỗng thay vì null
    };
    console.log("Thêm sản phẩm:", newProduct);

    const res = await axios.post(`${API_BASE}/products`, newProduct);

    setProducts((prev) => [...prev, res.data]);

    setShowForm(false);
    setForm({
      name: "",
      barcode: "",
      price: "",
      quantity: "",
      image: "",
      category: "",
    });
    console.log("Thêm sản phẩm thành công:", res.data);
    showNotification(`Thêm sản phẩm ${form.name} thành công!`, "success");
  } catch (error) {
    showNotification("Lỗi khi thêm sản phẩm!", "error");  }
};



  // Delete product
  const handleDelete = async (id) => {
    if (confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
      try {
        await axios.delete(`${API_BASE}/products/${id}`);
        setProducts((prev) => prev.filter((p) => p.id !== id));
      } catch (error) {
        console.error(error);
      }
    }
  };

  // Open edit modal
  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditForm({
      name: product.name ?? "",
      barcode: product.barcode ?? "",
      price: product.price ?? 0,
      category: product.category ?? "",
      image: product.image ?? "",
      quantity: product.quantity ?? 0,
    });
    setShowEdit(true);
  };

  // Save product after editing
  const handleSave = async () => {
    if (!editingId) return;
    try {
      const updatedProduct = {
        ...editForm,
        price: Number(editForm.price) || 0,
        quantity: Number(editForm.quantity) || 0,
      };
      const res = await axios.put(`${API_BASE}/products/${editingId}`, updatedProduct);
      setProducts((prev) => prev.map((p) => (p.id === editingId ? res.data : p)));
      setShowEdit(false);
      setEditingId(null);
    } catch (error) {
      console.error(error);
    }
  };

  const filtered = products.filter(
    (p) =>
      (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || "").includes(search)
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">Quản lý kho</h1>
        <input
          type="text"
          placeholder="Tìm sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md border rounded px-3 py-2"
        />
      </header>

      {/* Product List */}
      <main className="p-4">
        {loading ? (
          <p className="text-center">Đang tải sản phẩm...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-gray-500">Không có sản phẩm nào.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white shadow rounded-xl overflow-hidden"
              >
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image";
                  }}
                />
                <div className="p-3">
                  <p className="font-bold">{product.name}</p>
                  <p className="text-gray-500 text-sm">
                    {product.barcode} | {product.category}
                  </p>
                  <p className="text-blue-600 font-bold">
                    {(Number(product.price) || 0).toLocaleString()} đ
                  </p>
                  <p className="text-sm text-gray-700">
                    Số lượng: <span className="font-semibold">{Number(product.quantity) || 0}</span>
                  </p>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => setShowForm(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg text-2xl"
      >
        +
      </button>

      {/* Add Product Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">Thêm sản phẩm</h2>
              <form onSubmit={handleAdd} className="grid gap-3">
                <input
                  type="text"
                  placeholder="Tên sản phẩm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  type="text"
                  placeholder="Barcode"
                  value={form.barcode}
                  onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Giá"
                  min="0"
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="p-2 border rounded"
                  required
                >
                  <option value="">-- Chọn danh mục --</option>
                  {categories.map((c) => (
                    <option key={c.id_cate} value={c.name_cate}>
                      {c.name_cate}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Link ảnh"
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <input
                  type="number"
                  placeholder="Số lượng"
                  min="0"
                  value={form.quantity}            
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  className="p-2 border rounded"
                  required
                />
                <div className="flex gap-2 justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                  >
                    Thêm
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Product Modal */}
      <AnimatePresence>
        {showEdit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md"
            >
              <h2 className="text-xl font-bold mb-4">Sửa sản phẩm</h2>
              <div className="grid gap-3">
                <input
                  type="text"
                  placeholder="Tên sản phẩm"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Barcode"
                  value={editForm.barcode}
                  onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Giá"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Danh mục"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="text"
                  placeholder="Link ảnh"
                  value={editForm.image}
                  onChange={(e) => setEditForm({ ...editForm, image: e.target.value })}
                  className="p-2 border rounded"
                />
                <input
                  type="number"
                  placeholder="Số lượng"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                  className="p-2 border rounded"
                />
                <div className="flex gap-2 justify-end mt-3">
                  <button
                    type="button"
                    onClick={() => { setShowEdit(false); setEditingId(null); }}
                    className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                  >
                    Lưu
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
