// App.jsx
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Link, useLocation, useNavigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import POS from "./pages/POS.jsx";
import Inventory from "./pages/Inventory";
import ImportGoods from "./pages/ImportGoods";
import ReceiveGoods from "./pages/ReceiveGoods";
import Staff from "./pages/Staff";
import Reports from "./pages/Reports";
import Sale from "./pages/Sale";
import Profile from "./pages/Profile";
import CustomerPage from "./pages/CustomerPage";
import Login from "./pages/Login";
import OpenShift from "./pages/OpenShift";
import CloseShift from "./pages/CloseShift";
import Promotion from "./pages/Promotion";
import logo from "./assets/logo.png";
import PrivateRoute from "./Components/PrivateRoute";
import { NavLink } from "react-router-dom";
import { NotificationProvider, useNotification } from "./Components/NotificationContext";

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const hideSidebar = location.pathname === "/login";
  const { showNotification } = useNotification();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const handleStorage = () => {
      try {
        setUser(JSON.parse(localStorage.getItem("user")));
      } catch {
        setUser(null);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleLogout = async () => {
    const shiftId = localStorage.getItem("shift_id");
    if (shiftId) {
      // Có ca đang mở → yêu cầu đóng ca
      showNotification("Vui lòng đóng ca trước khi đăng xuất!", "error");
      navigate("/closeshift");
      return;
    }

    // Không có ca → logout bình thường
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("shift_id");
    localStorage.removeItem("currentShift");
    showNotification("Đăng xuất thành công!", "success");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {!hideSidebar && (
        <nav className="fixed top-0 left-0 w-64 h-screen bg-gradient-to-b from-blue-600 to-blue-800 text-white shadow-xl overflow-y-auto z-50">
          <div className="p-6">
            <img src={logo} alt="Logo" className="w-20 h-20 mx-auto mb-6 rounded-full shadow-lg border-4 border-white" />
            <ul className="space-y-2">
              <li>
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  📊 Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/pos"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  🛒 Hệ thống POS
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/inventory"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  📦 Hàng hóa
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/import-goods"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  📥 Nhập hàng
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/receive-goods"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  📦 Nhận hàng
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/staff"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  👥 Nhân viên
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/reports"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  📈 Báo cáo
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/sale"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  💰 Doanh thu
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/promotion"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400"
                    }`
                  }
                >
                  🎉 Khuyến mãi
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/customers"
                  className={({ isActive }) =>
                    `block px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? "bg-yellow-400 text-blue-900 shadow-lg transform scale-105"
                        : "hover:bg-white hover:bg-opacity-20 hover:shadow-md hover:text-yellow-400 "
                    }`
                  }
                >
                  👤 Khách hàng
                </NavLink>
              </li>
              <li>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 rounded-lg transition-all duration-200 hover:bg-red-500 hover:bg-opacity-80 hover:shadow-md bg-red-600 text-white"
                >
                  🚪 Đăng xuất
                </button>
              </li>
            </ul>
          </div>
        </nav>
      )}

      <div className={`flex-1 ${!hideSidebar ? "ml-64" : ""}`}>
       
        <main className="p-6 bg-gray-50 min-h-screen">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Dashboard chỉ admin được vào */}
            <Route
              path="/"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <Dashboard />
                </PrivateRoute>
              }
            />

            {/* POS cho admin + cashier */}
            <Route
              path="/pos"
              element={
                <PrivateRoute allowedRoles={["admin", "cashier"]} requiresShift={true}>
                  <POS currentUser={user} />
                </PrivateRoute>
              }
            />

            <Route
              path="/inventory"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <Inventory />
                </PrivateRoute>
              }
            />

            <Route
              path="/import-goods"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <ImportGoods />
                </PrivateRoute>
              }
            />

            <Route
              path="/receive-goods"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <ReceiveGoods />
                </PrivateRoute>
              }
            />

            <Route
              path="/staff"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <Staff />
                </PrivateRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <Reports />
                </PrivateRoute>
              }
            />

            <Route
              path="/sale"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <Sale />
                </PrivateRoute>
              }
            />

            <Route
              path="/promotion"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <Promotion />
                </PrivateRoute>
              }
            />

            {/* Profile: tất cả roles đều vào được */}
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            <Route
              path="/customers"
              element={
                <PrivateRoute allowedRoles={["admin"]}>
                  <CustomerPage />
                </PrivateRoute>
              }
            />
            <Route path="/openshift" element={<OpenShift />} />
            <Route path="/closeshift" element={<CloseShift />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <NotificationProvider>
        <AppLayout />
      </NotificationProvider>
    </Router>
  );
}

export default App;
