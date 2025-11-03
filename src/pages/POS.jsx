import { q } from "framer-motion/client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useNotification } from "../Components/NotificationContext";
import axios from "axios";
import dollarImg from '../assets/dollar.png';
import momoImg from '../assets/momologo.png';
import vnpayImg from '../assets/vnpaylogo.png';




const API_BASE = import.meta.env.VITE_POSBE_API || "http://localhost:3000";
const getPromoItemQty = (pi) =>
  Number(
    pi?.quantity ??
    pi?.required_quantity ??
    pi?.requiredQuantity ??
    pi?.qty ??
    pi?.requiredQty ??
    0
  );
const getPromoDiscountPercent = (promo) =>
  Number(promo?.discount_percent ?? promo?.discountPercent ?? promo?.discount ?? 0);
const SOCKET_BASE = "http://localhost:3008";



export default function POS({ currentUser }) {
  const { showNotification } = useNotification();
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);
  const [category, setCategory] = useState("Tất cả");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [points, setPoints] = useState(0);
  const [usedPoints, setUsedPoints] = useState(0);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const shiftId = localStorage.getItem("shift_id");
  const [promotions, setPromotions] = useState([]);
  const [appliedPromotion, setAppliedPromotion] = useState(null);
  const [availablePromotions, setAvailablePromotions] = useState([]);



  const [showPaymentPopup, setShowPaymentPopup] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash"); 
  const [discountPercent, setDiscountPercent] = useState(0);
  const [customerCash, setCustomerCash] = useState("");
  const [rawCash, setRawCash] = useState(0);
  const [popupError, setPopupError] = useState("");


  
  const [orderCode, setOrderCode] = useState("");
  const [qrStatus, setQrStatus] = useState("pending");
  const [selectMail, setSelectMail] = useState(false);
  const [momoPayUrl, setMomoPayUrl] = useState("");
  const autoCreatedRef = useRef(false);
  const pollingRef = useRef(null);
  const socketRef = useRef(null);


  const user = currentUser || JSON.parse(localStorage.getItem("user") || "null");

 
  const subtotal = useMemo(
    () => cart.reduce((s, i) => s + i.price * i.cartQty, 0),
    [cart]
  );

  const safeDiscountPercent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const discountAmount = useMemo(
    () => Math.round((subtotal * safeDiscountPercent) / 100),
    [subtotal, safeDiscountPercent]
  );
  //promotion
  const promoDiscount = useMemo(() => {
    if (!appliedPromotion) {
      return 0;
    }
    if ((appliedPromotion.promotion_type ?? "product") !== "product") {
      return 0;
    }

    let comboTotal = 0;

    (appliedPromotion.items || []).forEach((pi) => {
      const pid = pi.product_id ?? pi.productId;
      const cartItem = cart.find(ci => String(ci.id) === String(pid));
      if (cartItem) {
        const qtyInPromo = getPromoItemQty(pi);
        const price = Number(cartItem.price) || 0;
        const qty = Math.min(Number(cartItem.cartQty) || 0, qtyInPromo);
        comboTotal += price * qty;
      }
    });

    const discountPercent = getPromoDiscountPercent(appliedPromotion);
    const discount = Math.round(comboTotal * discountPercent / 100);
    return discount;
  }, [cart, appliedPromotion]);

  const finalAmount = Math.max(0, subtotal - usedPoints - discountAmount - promoDiscount);
  const changeAmount =
    paymentMethod === "cash" ? Math.max(0, rawCash - finalAmount) : 0;

  // ---------- Fetch Products ----------
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch(`${API_BASE}/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const mapped = (Array.isArray(data) ? data : []).map((p) => ({
        id: p.id,
        name: p.name,
        barcode: p.barcode,
        price: Number(p.price) || 0,
        category: p.category || "Khác",
        image: p.image || "https://picsum.photos/seed/placeholder/200/200",
        quantity: Number(p.quantity) || 0,
      }));
      setProducts(mapped);
    } catch (e) {
      setError(`Không tải được sản phẩm: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    axios.get(`${API_BASE}/promotions-with-items`)
      .then(res => {
        setPromotions(Array.isArray(res.data) ? res.data : []);
      })
      .catch(err => console.error("Lỗi load khuyến mãi", err));

  }, []);
  useEffect(() => {
  }, [appliedPromotion, promoDiscount, subtotal, discountAmount, usedPoints]);



  // ---------- Categories & Filter ----------
  const categories = useMemo(
    () => ["Tất cả", ...Array.from(new Set(products.map((p) => p.category)))],
    [products]
  );

  const filtered = useMemo(() => {
    const base =
      category === "Tất cả"
        ? products
        : products.filter((p) => p.category === category);
    if (!query.trim()) return base;
    const q = query.trim().toLowerCase();
    return base.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.barcode || "").includes(q)
    );
  }, [category, query, products]);
  // ---------- Auto Input Handler ----------

  const handleAutoInput = async (value) => {
    const v = value.trim();

    // Barcode sản phẩm 13 ký tự, bắt đầu 89
    if (v.startsWith("89") && v.length === 13) {
      addByBarcodeLocal(v);
      setQuery(""); // xóa input
      return;
    }

    // Mã khách hàng 9 ký tự, không bắt đầu 89
    if (!v.startsWith("89") && v.length === 9) {
      try {
        const res = await fetch(`${API_BASE}/customers/${v}`);
        if (res.ok) {
          const data = await res.json();
          setCustomerName(data?.name || "");
          setPoints(Number(data?.points) || 0);
          setCustomerId(v);
        } else {
          setCustomerName("");
          setPoints(0);
        }
      } catch (_) {
        setCustomerName("");
        setPoints(0);
      }
      setQuery(""); // xóa input
      return;
    }
  };

  let typingTimer = null;




  // ---------- Cart ----------
  // khi thêm vào giỏ
  const addToCart = (product) => {
    setCart((prev) => {
      const found = prev.find((i) => i.id === product.id);

      if (found) {
        if (found.cartQty >= product.quantity) {
          showNotification(`"${product.name}" đã đạt số lượng tồn kho!`, "error");
          return prev;
        }
        return prev.map((i) =>
          i.id === product.id ? { ...i, cartQty: i.cartQty + 1 } : i
        );
      }

      return [...prev, { ...product, cartQty: 1 }];
    });
  };





  const addByBarcodeLocal = (barcode) => {
    const product = products.find((p) => String(p.barcode) === String(barcode));
    if (product && product.quantity > 0) {
      addToCart(product);
      setQuery("");
    } else {
      showNotification(`"${product.name}" đã hết hàng!`, "error");
    }
  };

  // thay đổi số lượng
  const changeQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;

        const newQty = i.cartQty + delta;

        // Nếu giảm thì không cho nhỏ hơn 0
        if (delta < 0) {
          return { ...i, cartQty: Math.max(0, newQty) };
        }

        // Nếu tăng thì không cho vượt tồn kho
        if (delta > 0 && i.cartQty >= i.quantity) {
          showNotification(`"${i.name}" đã đạt số lượng tồn kho!`, "error");
          return i; // giữ nguyên
        }

        return { ...i, cartQty: newQty };
      }).filter((i) => i.cartQty > 0) // loại bỏ sp = 0
    );
  };


  const removeItem = (id) => setCart((prev) => prev.filter((i) => i.id !== id));
  const clearCart = () => setCart([]);

  // ---------- Socket.IO for QR ----------
  useEffect(() => {
    socketRef.current = io(SOCKET_BASE, { transports: ["websocket"] });
    const s = socketRef.current;

    const onPaid = ({ orderCode: paidCode }) => {
      if (paidCode && paidCode === orderCode) {
        afterSuccessfulPayment();
      }
    };

    s.on("order_paid", onPaid);

    return () => {
      s.off("order_paid", onPaid);
      s.disconnect();
    };
  }, [orderCode]);
  const checkOrderStatus = async (code) => {
    try {
      const res = await fetch(`${API_BASE}/orders/status/${code}`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.status === "paid") {
        await fetch(`${API_BASE}/orders/paid/${code}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectMail }),
      });
        setQrStatus("paid");
        afterSuccessfulPayment(); // xử lý frontend sau thanh toán
        stopPolling();           // dừng polling khi đã thanh toán
      }
    } catch (err) {
      console.error("Lỗi check order status:", err);
    }
  };

  const startPolling = (code, selectMail) => {
    stopPolling();

    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/orders/status/${code}`);
        if (!res.ok) return;

        const data = await res.json();

        if (data.order?.status === "paid") {
          await fetch(`${API_BASE}/orders/paid/${code}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ selectMail }),
        });
          afterSuccessfulPayment();
          stopPolling();
        }
      } catch (err) {
        console.log("Polling error:", err);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  };

  const resetPopup = () => {
    setPaymentMethod("cash");
    setDiscountPercent(0);
    setCustomerCash("");
    setRawCash(0);
    setPopupError("");
    setOrderCode("");
    setQrStatus("pending");
    setMomoPayUrl("");
    autoCreatedRef.current = false;
  };

  const afterSuccessfulPayment = () => {
    showNotification(`Thanh toán thành công`, "success");
    stopPolling();
    setQrStatus("paid");
    clearCart();
    setCustomerId("");
    setCustomerName("");
    setPoints(0);
    setShowPaymentPopup(false);
    resetPopup();

  };



  // ---------- Checkout (split logic) ----------
  const handleCashCheckout = async () => {
    setPopupError("");
    setError("");

    if (!user?.id_user) return showNotification("Chưa đăng nhập người dùng", "error");
    if (paymentMethod === "cash" && rawCash < finalAmount) {
      return showNotification("Số tiền khách đưa chưa đủ.", "warning");
    }

    const payload = {
      id_user: user.id_user,
      id_cus: customerId || null,
      shift_id: shiftId || null,
      created_at: new Date().toISOString(),
      tongtien: finalAmount || null,
      discount_percent: safeDiscountPercent,
      discount_amount: discountAmount,
      promotion_id: appliedPromotion ? (appliedPromotion.promotion_id ?? appliedPromotion.id ?? null) : null,
      promotion_title: appliedPromotion?.title ?? null,
      promotion_discount_amount: promoDiscount || 0,
      payment_method: paymentMethod === "cash" ? "cash" : "qrcode",
      cash_given: rawCash,
      change: changeAmount,
      used_points: usedPoints || 0,
      items: cart.map((i) => ({
        id_product: i.id,
        name: i.name,
        quantity: i.cartQty,
        price: i.price,
        barcode: i.barcode,
        category: i.category,
        image: i.image,
      })),
    };
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();  
      const orderCode = data?.order_code; 
      if (orderCode) {
        await fetch(`${API_BASE}/orders/paid/${orderCode}`, {
  method: "PUT",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ selectMail }),
});
      }
      afterSuccessfulPayment();
    } catch (e) {
      setPopupError(`Không tạo được đơn hàng: ${e.message}`);
    }
  };

  
  const autoCreateQrOrder = async () => {
    if (autoCreatedRef.current) {
      return;
    }
    autoCreatedRef.current = true;
    setPopupError("");
    setError("");

    if (!user?.id_user) {
      setPopupError("Chưa đăng nhập người dùng");
      return;
    }
    if (cart.length === 0) {
      setPopupError("Giỏ hàng trống");
      return;
    }

    // Use a deterministic order code so QR image matches webhook
    const oc = `DH${Date.now()}`;
    setOrderCode(oc);
    setQrStatus("pending");
    const payload = {
      id_user: user.id_user,
      id_cus: customerId || null,
      shift_id: shiftId || null,
      created_at: new Date().toISOString(),
      tongtien: finalAmount,
      discount_percent: safeDiscountPercent,
      discount_amount: discountAmount,
      payment_method: paymentMethod,
      cash_given: 0,
      change: 0,
      used_points: usedPoints || 0,
      order_code: oc, 
      selectMail: selectMail ,
      items: cart.map((i) => ({
        id_product: i.id,
        name: i.name,
        quantity: i.cartQty,
        price: i.price,
        barcode: i.barcode,
        category: i.category,
        image: i.image,
      })),
    };

    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // If backend returns order_code use it (should match oc)
      const returnedCode = data?.order_code || oc;
      setOrderCode(returnedCode);

      if (paymentMethod === "momo") {
        // Call Momo payment API
        const paymentRes = await fetch(`${API_BASE}/payment/${returnedCode}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });
        if (!paymentRes.ok) throw new Error(`HTTP ${paymentRes.status}`);
        const paymentData = await paymentRes.json();
        setMomoPayUrl(paymentData.payUrl);
      }

      // begin fallback polling for both momo and vnpay
      startPolling(returnedCode, selectMail);
    } catch (e) {
      setPopupError(`Không tạo được đơn hàng: ${e.message}`);
      autoCreatedRef.current = false; // allow retry if user reopens popup
    }
  };

  // Trigger auto-create when popup opens for QR
  useEffect(() => {
    if (!showPaymentPopup) {
      stopPolling();
      setOrderCode("");
      setQrStatus("pending");
      setMomoPayUrl("");
      autoCreatedRef.current = false;
    } else if (showPaymentPopup && (paymentMethod === "momo" || paymentMethod === "vnpay")) {
      autoCreateQrOrder();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showPaymentPopup, paymentMethod]);


  useEffect(() => {
    if (orderCode) {
      startPolling(orderCode);
    }
    return () => stopPolling();
  }, [orderCode]);


  // ✅ Tạo URL QR Code dựa trên finalAmount + orderCode
  const qrCodeUrl =
    (paymentMethod === "vnpay") && orderCode
      ? `https://qr.sepay.vn/img?acc=962471GB35&bank=BIDV&amount=${finalAmount}&des=${orderCode}`
      : "";


  return (
    <div className="h-[680px] flex flex-col bg-slate-50 p-4">
      {/* Top bar */}
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
            onChange={(e) => {
              const v = e.target.value;
              setQuery(v);

              // Clear timer cũ
              if (typingTimer) clearTimeout(typingTimer);

              // Timer 50ms để xử lý input tự động
              typingTimer = setTimeout(() => handleAutoInput(v), 50);
            }}
            placeholder="Quét barcode hoặc nhập mã khách hàng…"
            className="flex-1 px-3 py-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-500"
          />


          <button
            className="px-3 py-2 rounded bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold"
            onClick={() => addByBarcodeLocal(query.trim())}
          >
            + Thêm
          </button>
        </div>
      </div>

      {loading && (
        <div className="mb-3 text-sm text-slate-500">Đang tải sản phẩm…</div>
      )}
      {error && <div className="mb-3 text-sm text-red-600">{error}</div>}


      <div className="flex-1 grid grid-cols-12 gap-4 overflow-hidden">
        {/* Cart */}
        <section className="col-span-12 md:col-span-4 bg-white rounded-xl shadow p-3 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <h2 className="font-semibold text-blue-700">Giỏ hàng</h2>
            <button
              className="text-sm text-red-600 hover:underline"
              onClick={clearCart}
            >
              Xóa giỏ
            </button>
          </div>

          <div className="border rounded overflow-y-auto flex-1">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="text-left p-2">Sản phẩm</th>
                  <th className="p-2">SL</th>
                  <th className="text-right p-2">Thành tiền</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="p-3 text-center text-slate-400"
                    >
                      Chưa có sản phẩm
                    </td>
                  </tr>
                )}
                {cart.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-slate-400">
                        {item.barcode}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.price.toLocaleString("vi-VN")} ₫
                      </div>
                    </td>
                    <td className="p-2 text-center">
                      <div className="inline-flex items-center gap-1">
                        <button
                          className="px-2 rounded bg-slate-200"
                          onClick={() => changeQty(item.id, -1)}
                        >
                          -
                        </button>
                        <span className="min-w-6 text-center">{item.cartQty}</span>
                        <button
                          className="px-2 rounded bg-slate-200"
                          onClick={() => changeQty(item.id, +1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td className="p-2 text-right font-semibold">
                      {(item.price * item.cartQty).toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="p-2 text-center">
                      <button
                        className="text-red-600"
                        onClick={() => removeItem(item.id)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Customer */}
          <div className="mt-3 flex-shrink-0">
            {customerId && (
              <p className="text-sm text-slate-700 mt-1">
                Mã: {customerId}
              </p>
            )}

            {customerName && (
              <p className="text-sm text-slate-700 mt-1">
                Tên khách hàng: {customerName}
              </p>
            )}
            {!!points && (
              <div className="mt-2">
                <p className="text-sm text-slate-700">
                  Điểm tích lũy: {points.toLocaleString("vi-VN")} điểm
                </p>

                {points >= 1000 ? (
                  <>
                    <input
                      type="number"
                      value={usedPoints === 0 ? "" : usedPoints}
                      min={0}
                      max={Math.min(points, subtotal)}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw === "") {
                          setUsedPoints(0); // giữ giá trị 0 trong state nhưng hiển thị rỗng
                          return;
                        }
                        const val = Math.max(
                          0,
                          Math.min(Number(raw) || 0, points, subtotal)
                        );
                        setUsedPoints(val);
                      }}
                      className="w-full mt-1 border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {usedPoints > 0 && (
                      <p className="text-sm text-green-700 mt-1">
                        Đã dùng {usedPoints.toLocaleString("vi-VN")} điểm (-{usedPoints.toLocaleString("vi-VN")} ₫)
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-xs text-red-500 mt-1">
                    Cần tối thiểu 1,000 điểm mới có thể sử dụng
                  </p>
                )}
              </div>
            )}


          </div>

          <div className="mt-3 bg-slate-50 rounded p-3 flex-shrink-0">
            <div className="flex justify-between text-sm">
              <span>Tạm tính</span>
              <span className="font-semibold bg-amber-300 h-8 min-w-24 px-2 flex items-center justify-center rounded">
                {subtotal.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>

          <div className="mt-3 flex gap-2 flex-shrink-0">
            <button
              className="flex-1 py-3 rounded bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-semibold"
              onClick={() => {
                if (cart.length === 0) {
                  showNotification("Không có sản phẩm trong giỏ hàng", "error");
                  return;
                }
                // Lọc promotion khả dụng (product type)
                const eligiblePromotions = (Array.isArray(promotions) ? promotions : []).filter((promo) => {
                  const endDate = new Date(promo.end_date).getTime();
                  if (
                    promo.promotion_type !== "product" ||
                    !Array.isArray(promo.items) ||
                    !promo.items.length ||
                    isNaN(endDate) ||  // nếu end_date không hợp lệ
                    endDate < Date.now() // hết hạn
                  ) return false;

                  return promo.items.every((pi) => {
                    const pid = pi.product_id ?? pi.productId;
                    const cartItem = cart.find(ci => String(ci.id) === String(pid));
                    const requiredQty = getPromoItemQty(pi);
                    return cartItem && (Number(cartItem.cartQty) || 0) >= requiredQty;
                  });
                });

                setAvailablePromotions(eligiblePromotions);
                setAppliedPromotion(null); // chưa chọn promotion nào
                setShowPaymentPopup(true);
                setPopupError("");
              }}


            >
              Thanh toán
            </button>

            <button
  className={`px-4 rounded text-white ${
    selectMail ? "bg-yellow-500 hover:bg-yellow-600" : "bg-blue-600 hover:bg-blue-700"
  }`}
  onClick={() => {
    if (!customerId) {
      showNotification("Chưa nhập thông tin khách hàng", "error");
      return;
    }
    setSelectMail(!selectMail);
    if (!selectMail) {
      showNotification("Hóa đơn sẽ được gửi", "success");
    } else {
      showNotification("Đã hủy gửi hóa đơn", "warning");
    }
  }}
>
  {selectMail ? "Bill" : "Bill"}
</button>
          </div>
        </section>

        {/* Product Grid */}
        <section className="col-span-12 md:col-span-8 bg-white rounded-xl shadow p-3 flex flex-col overflow-hidden">
          <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 py-1 rounded border ${category === c ? "bg-blue-600 text-white" : ""
                  }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto ">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg">
              {filtered.map((p) =>
                p.quantity > 0 ? (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="group rounded-xl overflow-hidden border hover:shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                    title={`${p.name} - ${p.price.toLocaleString("vi-VN")} ₫`}
                  >
                    <div className="aspect-square overflow-hidden bg-slate-100">
                      <img
                        src={p.image}
                        alt={p.name}
                        onError={(e) =>
                        (e.currentTarget.src =
                          "https://picsum.photos/seed/fallback/200/200")
                        }
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                    </div>
                    <div className="p-2 text-left">
                      <div className="font-medium leading-tight">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.barcode}</div>
                      <div className="mt-1 font-semibold text-blue-700">
                        {p.price.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  </button>
                ) : (
                  <div
                    key={p.id}
                    className="group rounded-xl overflow-hidden border bg-gray-300 opacity-70 cursor-not-allowed"
                    title={`${p.name} - Hết hàng`}
                  >
                    <div className="aspect-square overflow-hidden bg-slate-100 relative">
                      <img
                        src={p.image}
                        alt={p.name}
                        onError={(e) =>
                        (e.currentTarget.src =
                          "https://picsum.photos/seed/fallback/200/200")
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-2 text-left">
                      <div className="font-medium leading-tight">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.barcode}</div>
                      <div className="text-xs text-slate-400">Hết Hàng</div>
                      <div className="mt-1 font-semibold text-blue-700">
                        {p.price.toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  </div>
                )
              )}

            </div>
          </div>
        </section>
      </div>

      {/* Payment Popup */}
      {showPaymentPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-5 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Thanh toán</h2>

            <div className="mb-4">
              <p className="text-sm font-medium mb-2">Phương thức:</p>
              <div className="flex gap-4">
                <label className={`cursor-pointer border-2 ${paymentMethod === "cash" ? "border-blue-500" : "border-gray-300"} rounded p-2`}>
                  <input
                    type="radio"
                    value="cash"
                    checked={paymentMethod === "cash"}
                    onChange={() => setPaymentMethod("cash")}
                    className="hidden"
                  />
                  <img src={dollarImg} alt="Cash" className="w-12 h-12" />
                </label>
                <label className={`cursor-pointer border-2 ${paymentMethod === "momo" ? "border-blue-500" : "border-gray-300"} rounded p-2`}>
                  <input
                    type="radio"
                    value="momo"
                    checked={paymentMethod === "momo"}
                    onChange={() => setPaymentMethod("momo")}
                    className="hidden"
                  />
                  <img src={momoImg} alt="Momo" className="w-12 h-12" />
                </label>
                <label className={`cursor-pointer border-2 ${paymentMethod === "vnpay" ? "border-blue-500" : "border-gray-300"} rounded p-2`}>
                  <input
                    type="radio"
                    value="vnpay"
                    checked={paymentMethod === "vnpay"}
                    onChange={() => setPaymentMethod("vnpay")}
                    className="hidden"
                  />
                  <img src={vnpayImg} alt="VNPay" className="w-12 h-12" />
                </label>
              </div>
            </div>

            {paymentMethod === "cash" && (
              <div className="mb-3">
                <label className="block text-sm font-medium mb-1">
                  Số tiền khách đưa
                </label>
                <input
                  type="text"
                  value={customerCash}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    const num = parseInt(raw) || 0;
                    setRawCash(num);
                    setCustomerCash(
                      new Intl.NumberFormat("vi-VN").format(num)
                    );
                  }}
                  className="w-full border rounded px-2 py-1"
                />
                <p className="mt-1 text-sm text-green-700">
                  Tiền thối lại: {changeAmount.toLocaleString("vi-VN")} ₫
                </p>
                {/* Promotion chọn trong popup */}
                {availablePromotions.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-2">Chọn khuyến mãi:</p>
                    {availablePromotions.map((promo) => (
                      <label key={promo.promotion_id} className="flex items-center gap-2 mb-1">
                        <input
                          type="radio"
                          name="promotion"
                          checked={appliedPromotion?.promotion_id === promo.promotion_id}
                          onChange={() => {
                            setAppliedPromotion(promo);
                          }}
                        />
                        <span>
                          {promo.title} - Giảm {promo.discount_percent}%
                        </span>
                      </label>
                    ))}
                  </div>
                )}


                <div className="flex justify-between text-sm">
                  <span>Giảm giá khuyến mãi</span>
                  <span className="font-semibold text-red-600">
                    -{promoDiscount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

                <div className="flex justify-between text-sm mt-1">
                  <span>Tổng sau giảm</span>
                  <span className="font-semibold text-green-700">
                    {finalAmount.toLocaleString("vi-VN")} ₫
                  </span>
                </div>

              </div>
            )}
            {(paymentMethod === "momo") && (
              <div className="mb-3 text-center">
                <p className="text-sm mb-2">
                  {momoPayUrl
                    ? "Nhấn vào link để thanh toán"
                    : "Đang tạo link thanh toán…"}
                </p>
                {momoPayUrl && (
                  <>
                    <a
                      href={momoPayUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block px-4 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
                    >
                      Thanh toán qua MoMo
                    </a>
                    <p className="mt-2 text-sm font-medium">
                      Tổng sau giảm: {finalAmount.toLocaleString("vi-VN")} ₫
                    </p>
                  </>
                )}
              </div>
            )}

            {( paymentMethod === "vnpay") && (
              <div className="mb-3 text-center">
                <p className="text-sm mb-2">
                  {orderCode
                    ? "Quét mã QR để thanh toán"
                    : "Đang tạo mã QR…"}
                </p>
                {orderCode && (
                  <>
                    <img
                      src={qrCodeUrl}
                      alt="QR Code"
                      className="mx-auto w-48 h-48 border rounded"
                    />
                    <p className="mt-2 text-sm font-medium">
                      Tổng sau giảm: {finalAmount.toLocaleString("vi-VN")} ₫
                    </p>
                    <p
                      className={`mt-2 text-sm ${qrStatus === "paid"
                        ? "text-green-700 font-semibold"
                        : "text-orange-600"
                        }`}
                    >
                      Trạng thái:{" "}
                      {qrStatus === "paid"
                        ? "Thanh toán thành công ✅"
                        : "Đang chờ thanh toán…"}
                    </p>
                  </>
                )}
              </div>
            )}

            {popupError && (
              <p className="mb-3 text-sm text-red-600">{popupError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-300"
                onClick={async () => {
                  setShowPaymentPopup(false);
                  resetPopup();

                  try {
                    const res = await fetch(`${API_BASE}/orders/cancel/${orderCode}`, {
                      method: "POST",
                    });
                    const data = await res.json();
                    if (res.ok) {
                      console.log("Order cancelled:", data);
                    } else {
                      console.error("Failed to cancel order:", data);
                    }
                  } catch (err) {
                    console.error("Error cancelling order:", err);
                  }
                }}
              >
                Hủy
              </button>


              {/* Cash still has Confirm; QR has NO Confirm button */}
              {paymentMethod === "cash" && (
                <button
                  className="px-4 py-2 rounded bg-green-600 text-white"
                  onClick={handleCashCheckout}
                >
                  Xác nhận
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
