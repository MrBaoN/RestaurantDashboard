import React, { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import "../styles/ReportsPage.css";
import { useNavigate, Navigate } from "react-router-dom";
import ZReportModal from "../components/ZReportPage";
import XReportModal from "../components/XReport";
import OrderReportModal from "../components/OrderReport";
import InventoryReportModal from "../components/InventoryReport";
import { useAuth } from "../components/AuthContext";

/**
 * ReportsPage component.
 *
 * - Provides a centralized interface for accessing various business reports.
 * - Displays buttons for navigating to different report modals, including Z Report, X Report, Order Report, and Inventory Report.
 * - Ensures only authorized managers can access this screen, redirecting unauthorized users to the home page.
 *
 * @component
 * @returns {JSX.Element} The rendered ReportsPage interface.
 */
const ReportsPage: React.FC = () => {
  const navigate = useNavigate();

  // State for modals
  const [showZReportModal, setShowZReportModal] = useState(false);
  const [showXReportModal, setShowXReportModal] = useState(false);
  const [showOrderReportModal, setShowOrderReportModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const { user } = useAuth();

  /**
   * Ensures only authorized managers can access the ReportsPage.
   *
   * - Redirects unauthorized users to the home page and displays an alert.
   *
   * @function useEffect
   * @param {Array} dependencies - The list of dependencies for this effect, including `user` and `navigate`.
   * @returns {void}
   */
  useEffect(() => {
    if (!user || !user.isManager) {
      alert("You are not authorized to access the Reports screen.");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  /**
   * Navigates to the Manager page.
   *
   * - Uses the `useNavigate` hook to programmatically redirect to the Manager screen.
   *
   * @function goToManager
   * @returns {void}
   */
  const goToManager = () => {
    navigate("/manager");
  };

  /**
   * Opens the Z Report modal.
   *
   * - Updates the state to display the Z Report modal.
   *
   * @function handleOpenZReport
   * @returns {void}
   */
  const handleOpenZReport = () => {
    setShowZReportModal(true);
  };

  /**
   * Closes the Z Report modal.
   *
   * - Updates the state to hide the Z Report modal.
   *
   * @function handleCloseZReport
   * @returns {void}
   */
  const handleCloseZReport = () => {
    setShowZReportModal(false);
  };

  /**
   * Opens the X Report modal.
   *
   * - Updates the state to display the X Report modal.
   *
   * @function handleOpenXReport
   * @returns {void}
   */
  const handleOpenXReport = () => {
    setShowXReportModal(true);
  };

  /**
   * Closes the X Report modal.
   *
   * - Updates the state to hide the X Report modal.
   *
   * @function handleCloseXReport
   * @returns {void}
   */
  const handleCloseXReport = () => {
    setShowXReportModal(false);
  };

  /**
   * Opens the Order Report modal.
   *
   * - Updates the state to display the Order Report modal.
   *
   * @function handleOpenOrderReport
   * @returns {void}
   */
  const handleOpenOrderReport = () => {
    setShowOrderReportModal(true);
  };

  /**
   * Closes the Order Report modal.
   *
   * - Updates the state to hide the Order Report modal.
   *
   * @function handleCloseOrderReport
   * @returns {void}
   */
  const handleCloseOrderReport = () => {
    setShowOrderReportModal(false);
  };
  if (!user || !user.isManager) return <Navigate to="/" replace />;
  return (
    <Container fluid className="reports-page text-center vh-100 p-0">
      {/* Header */}
      <Row className="bg-danger py-3">
        <Col>
          <h1 className="text-white">Reports</h1>
        </Col>
      </Row>

      {/* Reports Buttons */}
      <Row className="reports-buttons d-flex justify-content-center align-items-center vh-75">
        <Col xs={12} md={6} lg={4} className="d-flex flex-column gap-3">
          <Button
            variant="secondary"
            className="reports-button"
            onClick={goToManager}
          >
            Manager
          </Button>
          <Button
            variant="secondary"
            className="reports-button"
            onClick={handleOpenOrderReport}
          >
            Order Report
          </Button>
          <Button
            variant="secondary"
            className="reports-button"
            onClick={() => setShowInventoryModal(true)}
          >
            Inventory Report
          </Button>
          <Button
            variant="secondary"
            className="reports-button"
            onClick={handleOpenXReport}
          >
            X Report
          </Button>
          <Button
            variant="secondary"
            className="reports-button"
            onClick={handleOpenZReport}
          >
            Z Report
          </Button>
        </Col>
      </Row>

      {/* Modals */}
      <XReportModal show={showXReportModal} handleClose={handleCloseXReport} />
      <ZReportModal show={showZReportModal} handleClose={handleCloseZReport} />
      <OrderReportModal
        show={showOrderReportModal}
        handleClose={handleCloseOrderReport}
      />
      <InventoryReportModal
        show={showInventoryModal}
        handleClose={() => setShowInventoryModal(false)}
      />
    </Container>
  );
};

export default ReportsPage;
