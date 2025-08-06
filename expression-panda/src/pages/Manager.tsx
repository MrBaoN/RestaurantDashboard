import { Container, Row, Col, Button } from "react-bootstrap";
import { useAuth } from "../components/AuthContext";
import "../styles/ManagerScreen.css"; // Import custom styles for additional styling
import { useNavigate, Navigate } from "react-router-dom";
import { useEffect } from "react";

/**
 * ManagerScreen component.
 *
 * - Displays a dashboard for authorized managers with navigation options to various management screens.
 * - Ensures only managers can access this screen, redirecting unauthorized users to the home page.
 * - Includes navigation buttons for features like Cashier, Inventory, Menu Adjustments, Reports, Employee Management, and Kitchen screens.
 * - Allows the manager to log out from their session.
 *
 * @component
 * @returns {JSX.Element} The rendered manager dashboard screen.
 */
const ManagerScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  /**
   * Ensures only authorized managers can access the ManagerScreen.
   *
   * - Redirects unauthorized users to the home page.
   * - Displays an alert to notify unauthorized access attempts.
   *
   * @function useEffect
   * @param {Array} dependencies - The list of dependencies for this effect, including `user` and `navigate`.
   * @returns {void}
   */
  useEffect(() => {
    if (!user || !user.isManager) {
      alert("You are not authorized to access the Manager screen.");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /**
   * Navigates to a specified path.
   *
   * - Uses the `useNavigate` hook from `react-router-dom` to programmatically navigate to different management screens.
   *
   * @function handleNavigation
   * @param {string} path - The path to navigate to.
   * @returns {void}
   */
  const handleNavigation = (path: string) => {
    navigate(path);
  };
  if (!user || !user.isManager) return <Navigate to="/" replace />;
  return (
    <Container
      fluid
      className="manager-screen text-center d-flex flex-column vh-100 p-0"
    >
      {/* Header */}
      <Row className="bg-danger py-3">
        <Col>
          <h1 className="text-white">Welcome {user?.firstName} </h1>
        </Col>
      </Row>

      {/* Background Image with Buttons */}
      <div className="background-container d-flex align-items-center justify-content-center flex-grow-1">
        <div className="button-grid">
          <Button
            className="manager-button"
            onClick={() => handleNavigation("/cashier")}
          >
            Cashier
          </Button>
          <Button
            className="manager-button"
            onClick={() => handleNavigation("/inventory")}
          >
            Inventory
          </Button>
          <Button
            className="manager-button"
            onClick={() => handleNavigation("/menu-adjust")}
          >
            Menu Adjust
          </Button>
          <Button
            className="manager-button"
            onClick={() => handleNavigation("/reports")}
          >
            Reports
          </Button>
          <Button
            className="manager-button"
            onClick={() => handleNavigation("/employee")}
          >
            Employee
          </Button>
          <Button
            variant="secondary"
            className="manager-button"
            onClick={() => handleNavigation("/kitchen")}
          >
            Kitchen
          </Button>
          <Button
            variant="secondary"
            className="manager-button"
            onClick={() => handleNavigation("/menu")}
          >
            Menu Board
          </Button>
          <Button className="manager-button" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </div>
    </Container>
  );
};

export default ManagerScreen;
