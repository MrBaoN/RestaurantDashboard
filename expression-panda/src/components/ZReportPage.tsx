import React, { useState, useEffect } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import axios from "axios";

interface ZReportItem {
  date: string;
  totalOrders: number;
  totalSales: number;
}

interface ZReportModalProps {
  show: boolean;
  handleClose: () => void;
}

/**
 * ZReportModal component.
 *
 * - Displays a modal showing the Z Report, which summarizes total orders and sales for specific dates.
 * - Automatically fetches Z Report data from the API when the modal is shown.
 * - Handles errors and displays an error message or a fallback message if no data is available.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {boolean} props.show - Determines whether the modal is visible.
 * @param {function} props.handleClose - Callback function to close the modal.
 * @returns {JSX.Element} The rendered ZReportModal component.
 */
const ZReportModal: React.FC<ZReportModalProps> = ({ show, handleClose }) => {
  const [zReportData, setZReportData] = useState<ZReportItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches Z Report data from the API.
   *
   * - Sends a GET request to retrieve total orders and sales data for specific dates.
   * - Updates the state with the fetched Z Report data or an error message if the request fails.
   *
   * @async
   * @function fetchZReport
   * @returns {Promise<void>} Resolves when the Z Report data is fetched and set in state.
   * @throws {Error} If the API request fails, sets an error message in the state.
   */
  const fetchZReport = async () => {
    try {
      const response = await axios.get("https://middleware-04w7.onrender.com/api/getZReport");
      setZReportData(response.data);
      setError(null);
    } catch (err: any) {
      console.error("Error fetching Z Report:", err);
      setError("Failed to fetch Z Report. Please try again.");
    }
  };

  /**
   * Effect hook for fetching Z Report data.
   *
   * - Triggers the `fetchZReport` function whenever the `show` prop changes to `true`.
   *
   * @function useEffect
   * @param {Array} dependencies - The list of dependencies for this effect, including `show`.
   * @returns {void}
   */
  useEffect(() => {
    if (show) {
      fetchZReport();
    }
  }, [show]);

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>Z Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? (
          <p className="text-danger">{error}</p>
        ) : zReportData && zReportData.length > 0 ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Date</th>
                <th>Total Orders</th>
                <th>Total Sales ($)</th>
              </tr>
            </thead>
            <tbody>
              {zReportData.map((item, index) => (
                <tr key={index}>
                  <td>{item.date}</td>
                  <td>{item.totalOrders}</td>
                  <td>${item.totalSales}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p>No data available for the Z Report.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ZReportModal;
