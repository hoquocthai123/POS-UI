import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "../Components/NotificationContext";

const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";

export default function Promotion() {
    const [promotions, setPromotions] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    //format date
    const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString("vi-VN"); 
  // Kết quả: 16/09/2025
};

    // Add modal
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        title: "",
        description: "",
        image_url: "",
        discount_percent: 0,
        start_date: "",
        end_date: "",
        promotion_type: "price", 
        price_min: "",            
        items: [],                
    });

    // Edit modal
    const [editingId, setEditingId] = useState(null);
    const [showEdit, setShowEdit] = useState(false);
    const [editForm, setEditForm] = useState({
        title: "",
        description: "",
        image_url: "",
        discount_percent: 0,
        start_date: "",
        end_date: "",
    });

    // Fetch promotion list
    const fetchPromotions = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/promotions`);
            setPromotions(Array.isArray(res.data) ? res.data : []);
        } catch (error) {
            console.error(error);
            showNotification("Lỗi khi tải danh sách khuyến mãi!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPromotions();

        axios.get(`${API_BASE}/products`)
            .then(res => setProducts(res.data))
            .catch(err => console.error("Lỗi load sản phẩm", err));
    }, []);
    //add item
    // Quản lý danh sách sản phẩm cho promotion_type = product
    const addItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { product_id: null, quantity: 1 }],
        }));
    };


    const removeItem = (index) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.filter((_, i) => i !== index),
        }));
    };

    const updateItem = (index, field, value) => {
  const newItems = [...form.items];
  if (field === "product_id") {
    newItems[index][field] = value ? parseInt(value, 10) : null;
  } else if (field === "quantity") {
    newItems[index][field] = Number(value) || 1;
  } else {
    newItems[index][field] = value;
  }
  setForm(prev => ({ ...prev, items: newItems }));
};


    // Add promotion
    const handleAdd = async (e) => {
        e.preventDefault();

        // Khai báo ở đây để scope cả try/catch
        const newPromotion = {
            title: form.title,
  description: form.description,
  image_url: form.image_url,
  discount_percent: Number(form.discount_percent) || 0,
  start_date: form.start_date,   // dạng "2025-09-19" hoặc "2025-09-19 00:00:00"
  end_date: form.end_date,       // dạng "2025-09-22" hoặc "2025-09-22 23:59:59"
  promotion_type: form.promotion_type, // 'product' hoặc 'price'
  price_min: form.promotion_type === "price" ? Number(form.price_min) : null,

  // Nếu promotion_type = "product" thì phải có items
  items: (form.items || []).map((p) => ({
    product_id: p.product_id ? Number(p.product_id) : null, // id trong bảng products
    quantity: Number(p.quantity) || 1,                     // số lượng yêu cầu
  })),
        };

        try {
            const res = await axios.post(`${API_BASE}/promotions`, newPromotion);
            setPromotions((prev) => [...prev, res.data]);
            setShowForm(false);
            setForm({
                title: "",
                description: "",
                image_url: "",
                discount_percent: 0,
                start_date: "",
                end_date: "",
            });
            showNotification(`Thêm khuyến mãi ${newPromotion.title} thành công!`, "success");
        } catch (error) {
            console.error(error);
            console.log(newPromotion);
            showNotification("Lỗi khi thêm khuyến mãi!", "error");
        }
    };


    // Delete promotion
    const handleDelete = async (id) => {
        if (confirm("Bạn có chắc muốn xóa khuyến mãi này?")) {
            try {
                await axios.delete(`${API_BASE}/promotions/${id}`);
                setPromotions((prev) => prev.filter((p) => p.promotion_id !== id));
            } catch (error) {
                console.error(error);
                showNotification("Lỗi khi xóa khuyến mãi!", "error");
            }
        }
    };

    // Open edit modal
    const handleEdit = (promotion) => {
        setEditingId(promotion.promotion_id);
        setEditForm({
            title: promotion.title || "",
            description: promotion.description || "",
            image_url: promotion.image_url || "",
            discount_percent: promotion.discount_percent || 0,
            start_date: promotion.start_date
                ? promotion.start_date.slice(0, 10) // "2025-09-16"
                : "",
            end_date: promotion.end_date
                ? promotion.end_date.slice(0, 10) // "2025-09-20"
                : "",
        });
        setShowEdit(true);
    };

    // Save promotion after editing
    const handleSave = async () => {
        if (!editingId) return;
        try {
            const res = await axios.put(`${API_BASE}/promotions/${editingId}`, editForm);
            setPromotions((prev) =>
                prev.map((p) => (p.promotion_id === editingId ? res.data : p))
            );
            setShowEdit(false);
            setEditingId(null);
            showNotification(`Cập nhật khuyến mãi ${editForm.title} thành công!`, "success");
        } catch (error) {
            console.error(error);
            showNotification("Lỗi khi cập nhật khuyến mãi!", "error");
        }
    };

    const filtered = promotions.filter(
        (p) =>
            (p.title || "").toLowerCase().includes(search.toLowerCase()) ||
            (p.description || "").toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white shadow p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold">Quản lý khuyến mãi</h1>
                <input
                    type="text"
                    placeholder="Tìm khuyến mãi..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md border rounded px-3 py-2"
                />
            </header>

            {/* Promotion List */}
            <main className="p-4">
                {loading ? (
                    <p className="text-center">Đang tải khuyến mãi...</p>
                ) : filtered.length === 0 ? (
                    <p className="text-center text-gray-500">Không có khuyến mãi nào.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((p) => (
                            <motion.div
                                key={p.promotion_id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white shadow rounded-xl overflow-hidden"
                            >
                                <img
                                    src={p.image_url}
                                    alt={p.title}
                                    className="w-full h-40 object-cover"
                                    onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300x200?text=No+Image")}
                                />
                                <div className="p-3">
                                    <p className="font-bold">{p.title}</p>
                                    <p className="text-gray-500 text-sm">{p.description}</p>
                                    <p>
                                        {formatDate(p.start_date)} → {formatDate(p.end_date)}{" "}
                                        {new Date(p.end_date).getTime() < Date.now() && (
                                            <span className="text-red-600 font-semibold">(Hết hạn)</span>
                                        )}
                                    </p>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => handleEdit(p)}
                                            className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                                        >
                                            Sửa
                                        </button>
                                        <button
                                            onClick={() => handleDelete(p.promotion_id)}
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

            {/* Add Promotion Modal */}
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
                            <h2 className="text-xl font-bold mb-4">Thêm khuyến mãi</h2>
                            <form onSubmit={handleAdd} className="grid gap-3">
                                <input
                                    type="text"
                                    placeholder="Tiêu đề"
                                    value={form.title}
                                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Mô tả"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                                <input
                                    type="text"
                                    placeholder="Link ảnh"
                                    value={form.image_url}
                                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                                <input
                                    type="number"
                                    placeholder="Giá trị giảm"
                                    min="0"
                                    value={form.discount_percent}
                                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                                    className="p-2 border rounded"
                                    required
                                />
                                <select
                                    value={form.promotion_type}
                                    onChange={(e) => setForm({ ...form, promotion_type: e.target.value })}
                                    className="p-2 border rounded"
                                >
                                    <option value="price">Theo tiền</option>
                                    <option value="product">Theo sản phẩm</option>
                                </select>

                                {/* Nếu chọn price */}
                                {form.promotion_type === "price" && (
                                    <input
                                        type="number"
                                        placeholder="Số tiền tối thiểu"
                                        value={form.price_min}
                                        onChange={(e) => setForm({ ...form, price_min: e.target.value })}
                                        className="p-2 border rounded"
                                        required
                                    />
                                )}

                                {/* Nếu chọn product */}
                                {form.promotion_type === "product" && (
                                    <div className="space-y-2 border p-2 rounded">
                                        <p className="font-semibold">Danh sách sản phẩm</p>
                                        {form.items.map((item, index) => (
                                            <div key={index} className="flex gap-2 items-center">
                                                <select
                                                    value={item.product_id ?? ""}
                                                    onChange={(e) => updateItem(index, "product_id", e.target.value)}
                                                    className="p-2 border rounded flex-1"
                                                >
                                                    <option value="">-- Chọn sản phẩm --</option>
                                                    {products.map((p) => (
                                                        <option key={p.id} value={p.id}>
                                                            {p.name}
                                                        </option>
                                                    ))}
                                                </select>


                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(e) => updateItem(index, "quantity", e.target.value)}
                                                    className="p-2 border rounded w-20"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="bg-red-500 text-white px-2 rounded"
                                                >
                                                    X
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="bg-blue-500 text-white px-3 py-1 rounded"
                                        >
                                            + Thêm sản phẩm
                                        </button>
                                    </div>
                                )}

                                <input
                                    type="date"
                                    placeholder="Ngày bắt đầu"
                                    value={form.start_date}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        const newStart = e.target.value;
                                        setForm((prev) => {
                                            let endDate = prev.end_date;
                                            // Nếu end_date nhỏ hơn start_date thì reset
                                            if (endDate && new Date(endDate) <= new Date(newStart)) {
                                                endDate = "";
                                            }
                                            return { ...prev, start_date: newStart, end_date: endDate };
                                        });
                                    }}
                                    className="p-2 border rounded"
                                    required
                                />
                                <input
                                    type="date"
                                    placeholder="Ngày kết thúc"
                                    value={form.end_date}
                                    min={form.start_date || new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        const newEnd = e.target.value;
                                        if (new Date(newEnd) <= new Date(form.start_date)) {
                                            alert("Ngày kết thúc phải lớn hơn ngày bắt đầu!");
                                            return;
                                        }
                                        setForm((prev) => ({ ...prev, end_date: newEnd }));
                                    }}
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

            {/* Edit Promotion Modal */}
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
                            <h2 className="text-xl font-bold mb-4">Sửa khuyến mãi</h2>
                            <div className="grid gap-3">
                                <input
                                    type="text"
                                    placeholder="Tiêu đề"
                                    value={editForm.title}
                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                    className="p-2 border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Mô tả"
                                    value={editForm.description}
                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                    className="p-2 border rounded"
                                />
                                <input
                                    type="text"
                                    placeholder="Link ảnh"
                                    value={editForm.image_url}
                                    onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                                    className="p-2 border rounded"
                                />
                                <input
                                    type="number"
                                    placeholder="Giá trị giảm"
                                    min="0"
                                    value={editForm.discount_percent}
                                    onChange={(e) => setEditForm({ ...editForm, discount_percent: e.target.value })}
                                    className="p-2 border rounded"
                                />
                                <input
                                    type="date"
                                    placeholder="Ngày bắt đầu"
                                    value={editForm.start_date}
                                    min={new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        const newStart = e.target.value;
                                        setEditForm((prev) => {
                                            let endDate = prev.end_date;
                                            // Nếu end_date < start_date thì reset lại
                                            if (endDate && new Date(endDate) <= new Date(newStart)) {
                                                endDate = "";
                                            }
                                            return { ...prev, start_date: newStart, end_date: endDate };
                                        });
                                    }}
                                    className="p-2 border rounded"
                                />
                                <input
                                    type="date"
                                    placeholder="Ngày kết thúc"
                                    value={editForm.end_date}
                                    min={editForm.start_date || new Date().toISOString().split("T")[0]}
                                    onChange={(e) => {
                                        const newEnd = e.target.value;
                                        if (new Date(newEnd) <= new Date(editForm.start_date)) {
                                            alert("Ngày kết thúc phải lớn hơn ngày bắt đầu!");
                                            return;
                                        }
                                        setEditForm((prev) => ({ ...prev, end_date: newEnd }));
                                    }}
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
