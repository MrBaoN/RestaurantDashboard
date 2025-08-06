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
import ReportsPage from "./pages/Reports";
import MenuBoard from "./pages/MenuBoard";

/**
 * Main application content and routing logic.
 *
 * - Renders the appropriate page components based on the current route.
 * - Includes a Navbar across all pages, except those defined in `noNavbarPaths`.
 * - Routes include Home, Menu, Kitchen, Manager, and more.
 *
 * @returns {JSX.Element} The rendered application routes wrapped with a conditional Navbar.
 */
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

/**
 * Root application component.
 *
 * - Wraps the application content in the `AuthProvider` to manage user authentication state.
 * - Uses `Router` to enable client-side routing.
 *
 * @returns {JSX.Element} The root application wrapped with `AuthProvider` and `Router`.
 */
export const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};
