// App.tsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Home } from "./pages/Home";
import Menu from "./pages/Menu";
import Kitchen from "./pages/Kitchen";
import Customer from "./pages/Customer";
import ManagerScreen from "./pages/Manager";
import EmployeeManagement from "./pages/Employee";
import { MenuAdjust } from "./pages/MenuAdjust";
import Inventory from "./pages/Inventory";
import { AuthProvider } from "./components/AuthContext";
import { CartProvider } from "./components/CartContext";
import ReportsPage from "./pages/Reports";
import MenuBoard from "./pages/MenuBoard";

const AppContent = () => {
  const location = useLocation();
  const noNavbarPaths = ["/kitchen", "/menu"];

  return (
    <>
      {!noNavbarPaths.includes(location.pathname) && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/cashier" element={<Menu />} />
        <Route path="/menu" element={<MenuBoard />} />
        <Route path="/manager" element={<ManagerScreen />} />
        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/customer" element={<Customer />} />
        <Route path="/employee" element={<EmployeeManagement />} />
        <Route path="/menu-adjust" element={<MenuAdjust />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Routes>
    </>
  );
};

export const App = () => {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
};
