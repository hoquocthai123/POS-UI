// src/pages/ImportGoods.jsx
import React, { useEffect, useMemo, useState } from "react";
import pdfMake from "pdfmake/build/pdfmake.js";
import pdfFonts from "pdfmake/build/vfs_fonts.js";


const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";

export default function ImportGoods() {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [companyName, setCompanyName] = useState(
    "CÔNG TY TNHH CỬA HÀNG TIỆN LỢI DUCKBUNNSTORE"
  );
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Tất cả");

  // Fetch products
  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_BASE}/products`);
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Thêm sản phẩm từ search hoặc barcode
  const handleAddItem = (product) => {
    setQuantities((prev) => ({
      ...prev,
      [product.id]: (prev[product.id] || 0) + 1,
    }));
  };

  const addByQuery = () => {
    const found = products.find(
      (p) =>
        p.barcode === query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    if (found) {
      handleAddItem(found);
      setQuery("");
    } else {
      alert("Không tìm thấy sản phẩm!");
    }
  };

  // Các item đã chọn
  const chosenItems = useMemo(() => {
    return Object.entries(quantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([id, qty]) => {
        const p = products.find((x) => x.id === Number(id));
        return {
          product_id: Number(id),
          quantity: Number(qty),
          product: p || null,
        };
      })
      .filter((x) => x.product);
  }, [quantities, products]);

  // Tổng tiền theo giá nhập (80% giá bán)
  const subtotal = useMemo(() => {
    return chosenItems.reduce((s, it) => {
      const sellPrice = Number(it.product?.price || 0);
      const importPrice = sellPrice * 0.8;
      return s + importPrice * it.quantity;
    }, 0);
  }, [chosenItems]);

  const handleChangeQty = (id, value) => {
    const v = Math.max(0, Number(value || 0));
    setQuantities((prev) => ({ ...prev, [id]: v }));
  };

  // Tạo phiếu và xuất PDF
  const handleSubmit = async () => {
    if (chosenItems.length === 0) {
      alert("Chưa chọn số lượng nhập!");
      return;
    }

    const payload = {
      code: "PN" + Date.now(),
      type: "import",
      note: note || "Phiếu nhập hàng",
      items: chosenItems.map((it) => ({
        product_id: it.product_id,
        quantity: it.quantity,
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/goods`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || "Lỗi tạo phiếu nhập");
      }

      const data = await res.json();

      generatePDF({
        code: payload.code,
        createdAt: new Date(),
        companyName,
        note: payload.note,
        items: chosenItems,
        subtotal,
      });

      setMessage(`✅ Tạo phiếu nhập #${data.goods_id} thành công!`);
      setQuantities({});
      setNote("");
    } catch (e) {
      console.error(e);
      setMessage(`❌ Không thể tạo phiếu nhập: ${e.message}`);
    }
  };

  const generatePDF = ({ code, createdAt, companyName, note, items, subtotal }) => {
    const rows = [
      [
        { text: "STT", bold: true, alignment: "center" },
        { text: "Tên sản phẩm", bold: true },
        { text: "Barcode", bold: true },
        { text: "SL", bold: true, alignment: "right" },
        { text: "Đơn giá (₫)", bold: true, alignment: "right" },
        { text: "Thành tiền (₫)", bold: true, alignment: "right" },
      ],
      ...items.map((it, idx) => {
        const sellPrice = Number(it.product?.price || 0);
        const importPrice = sellPrice * 0.8;
        const amount = importPrice * it.quantity;
        return [
          { text: String(idx + 1), alignment: "center" },
          it.product?.name || "",
          it.product?.barcode || "",
          { text: it.quantity.toLocaleString("vi-VN"), alignment: "right" },
          { text: importPrice.toLocaleString("vi-VN"), alignment: "right" },
          { text: amount.toLocaleString("vi-VN"), alignment: "right" },
        ];
      }),
      [
        { text: "TỔNG CỘNG", colSpan: 5, alignment: "right", bold: true },
        {},
        {},
        {},
        {},
        { text: subtotal.toLocaleString("vi-VN"), alignment: "right", bold: true },
      ],
    ];

    const docDefinition = {
      pageSize: "A4",
      pageMargins: [28, 28, 28, 32],
      content: [
        {
          columns: [
            [
              { text: companyName, style: "company" },
              { text: "PHIẾU NHẬP HÀNG", style: "title", margin: [0, 2, 0, 0] },
            ],
            [
              { text: `Mã phiếu: ${code}`, alignment: "right" },
              { text: `Ngày giờ: ${createdAt.toLocaleString("vi-VN")}`, alignment: "right" },
            ],
          ],
        },
        { text: note ? `Ghi chú: ${note}` : "", margin: [0, 10, 0, 10], italics: true },
        {
          table: {
            headerRows: 1,
            widths: [30, "*", 120, 40, 70, 90],
            body: rows,
          },
          layout: {
            fillColor: (rowIndex) => (rowIndex === 0 ? "#F3F4F6" : null),
            hLineColor: "#E5E7EB",
            vLineColor: "#E5E7EB",
          },
        },
        {
          columns: [
            { text: "Người lập phiếu\n\n____________________", margin: [0, 24, 0, 0] },
            { text: "Thủ kho\n\n____________________", alignment: "center", margin: [0, 24, 0, 0] },
            { text: "Kế toán\n\n____________________", alignment: "right", margin: [0, 24, 0, 0] },
          ],
        },
      ],
      styles: {
        company: { fontSize: 12, bold: true, color: "#2563EB" },
        title: { fontSize: 16, bold: true, color: "#111827" },
      },
      defaultStyle: { font: "Roboto", fontSize: 10 },
    };

    pdfMake.createPdf(docDefinition).download(`${code}.pdf`);
  };

  // Filter products theo search & category
  const filteredProducts = products.filter((p) => {
    const matchQuery =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.barcode.includes(query);
    const matchCategory = category === "Tất cả" || p.category === category;
    return matchQuery && matchCategory;
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-blue-700 flex items-center gap-2">
        📦 Nhập hàng
      </h2>

      {message && (
        <div className="mb-4 p-3 rounded bg-green-100 text-green-700">{message}</div>
      )}

      

      {/* Company & Note */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 grid md:grid-cols-3 gap-3">
        <div className="md:col-span-2">
          <label className="block text-sm text-gray-600 mb-1">Tên công ty</label>
          <input
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200"
            placeholder="Nhập tên công ty"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Ghi chú</label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:ring focus:ring-blue-200"
            placeholder="Ví dụ: Nhập theo PO #123"
          />
        </div>
      </div>
      {/* Search & Reload */}
      <div className="flex items-center gap-2 bg-white rounded-xl shadow p-3 mb-4 flex-shrink-0">
        <button
          className="px-3 py-2 rounded bg-blue-600 text-white"
          onClick={() => {
            setQuery("");
            setCategory("Tất cả");
            fetchProducts();
          }}
          title="Tải lại"
        >
          ⟳
        </button>
        <div className="flex-1 flex items-center gap-2">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addByQuery()}
            placeholder="Quét barcode hoặc nhập tên sản phẩm…"
            className="flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            className="px-3 py-2 rounded bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold"
            onClick={addByQuery}
          >
            + Thêm
          </button>
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((p) => (
          <div
            key={p.id}
            className="border rounded-lg p-3 shadow hover:shadow-md transition bg-white flex flex-col"
          >
            <div className="aspect-[4/3] overflow-hidden rounded bg-gray-100">
              <img
                src={p.image}
                alt={p.name}
                className="w-full h-full object-cover"
                onError={(e) =>
                  (e.currentTarget.src =
                    "https://picsum.photos/seed/placeholder/200/150")
                }
              />
            </div>
            <div className="mt-2 font-semibold line-clamp-2">{p.name}</div>
            <div className="text-xs text-gray-500">{p.barcode}</div>
            <div className="mt-1 text-blue-600 font-bold">
              Giá bán: {Number(p.price || 0).toLocaleString("vi-VN")} ₫
            </div>
            <div className="mt-1 text-blue-600 font-bold">
              Giá nhập: {(Number(p.price || 0) * 0.8).toLocaleString("vi-VN")} ₫
            </div>
            <input
              type="number"
              min="0"
              value={quantities[p.id] || ""}
              onChange={(e) => handleChangeQty(p.id, e.target.value)}
              className="mt-2 border rounded px-2 py-1 w-full text-center focus:ring focus:ring-blue-300"
              placeholder={`Số lượng tồn: ${p.quantity ?? 0}`}
            />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between">
        <div className="text-gray-700">
          <span className="font-semibold">Tổng tiền ước tính: </span>
          <span className="text-blue-700 font-bold">
            {subtotal.toLocaleString("vi-VN")} ₫
          </span>
        </div>
        <button
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded shadow"
          onClick={handleSubmit}
        >
          ✅ Tạo phiếu & Xuất PDF
        </button>
      </div>
    </div>
  );
}
