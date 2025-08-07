import React, { useState } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import axios from "axios";

interface XReportModalProps {
  show: boolean;
  handleClose: () => void;
}

interface XReportData {
  salesHour: string;
  totalSales: number;
}

/**
 * XReportModal component.
 *
 * - Displays a modal showing the X Report, which summarizes total sales for each hour.
 * - Automatically fetches X Report data from the API when the modal is shown.
 * - Handles errors and displays an error message or a fallback message if no data is available.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {boolean} props.show - Determines whether the modal is visible.
 * @param {function} props.handleClose - Callback function to close the modal.
 * @returns {JSX.Element} The rendered XReportModal component.
 */
const XReportModal: React.FC<XReportModalProps> = ({ show, handleClose }) => {
  const [xReportData, setXReportData] = useState<XReportData[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches X Report data from the API.
   *
   * - Sends a GET request to retrieve hourly sales data.
   * - Transforms the API response to match the `XReportData` interface structure.
   * - Updates the state with the fetched X Report data or an error message if the request fails.
   *
   * @async
   * @function fetchXReport
   * @returns {Promise<void>} Resolves when the X Report data is fetched and set in state.
   * @throws {Error} If the API request fails, sets an error message in the state.
   */
  const fetchXReport = async () => {
    try {
      const response = await axios.get(
        "https://middleware-04w7.onrender.com/api/getXReport"
      );
      const transformedData = response.data.map((item: any) => ({
        salesHour: item.salesHour,
        totalSales: item.totalSales, // Rename and parse
      }));
      setXReportData(transformedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching X Report:", err);
      setError("Failed to fetch X Report. Please try again.");
    }
  };


  return (
    <Modal show={show} onHide={handleClose} onShow={fetchXReport}>
      <Modal.Header closeButton>
        <Modal.Title>X Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error ? (
          <p className="text-danger">{error}</p>
        ) : xReportData && xReportData.length > 0 ? (
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>Hour</th>
                <th>Total Sales ($)</th>
              </tr>
            </thead>
            <tbody>
              {xReportData.map((data, index) => (
                <tr key={index}>
                  <td>{data.salesHour}</td>
                  <td>${data.totalSales}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p>No sales data available for today.</p>
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

export default XReportModal;
