import React, { useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { MIDDLEWARE_URI } from "../config";

interface Order {
  orderID: number;
  employeeID: number;
  orderTime: string;
  orderTotal: number;
}

interface OrderReportModalProps {
  show: boolean;
  handleClose: () => void;
}

/**
 * OrderReportModal component.
 *
 * - Displays a modal for generating order reports within a specified date range.
 * - Allows users to select a start date and end date, fetch orders from the API, and display them in a table.
 * - Handles error states such as invalid date ranges and API request failures.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {boolean} props.show - Determines whether the modal is visible.
 * @param {function} props.handleClose - Callback function to close the modal.
 * @returns {JSX.Element} The rendered OrderReportModal component.
 */
const OrderReportModal: React.FC<OrderReportModalProps> = ({show, handleClose}) => {
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetches order data from the API based on the selected date range.
   *
   * - Validates the selected dates to ensure they are not in the future and that the end date is not earlier than the start date.
   * - Sends a GET request to the API with `startDate` and `endDate` as parameters.
   * - Updates the state with the fetched order data or displays an error message if the request fails.
   *
   * @async
   * @function fetchOrders
   * @returns {Promise<void>} Resolves when the order data is fetched and set in state.
   * @throws {Error} If the API request fails, sets an error message in the state.
   */
  const fetchOrders = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }
  
    const now = new Date();
  
    // Validate dates
    if (startDate > now) {
      setError("Start date cannot be in the future.");
      return;
    }
    if (endDate < startDate) {
      setError("End date cannot be earlier than the start date.");
      return;
    }
  
    try {
      setError(null); // Clear previous errors
  
      // Check if the startDate and endDate are the same
      let params = {
        startDate: startDate.toISOString().split("T")[0],
        endDate: endDate.toISOString().split("T")[0],
      };
  
      if (startDate.toISOString().split("T")[0] === endDate.toISOString().split("T")[0]) {
        params = {
          startDate: `${startDate.toISOString().split("T")[0]} 00:00:00`,
          endDate: `${endDate.toISOString().split("T")[0]} 23:59:59`,
        };
      }
  
      const response = await axios.get(
        `${MIDDLEWARE_URI}/api/getRange`,
        { params }
      );
      setOrders(response.data);
    } catch (err: any) {
      console.error("Error fetching orders:", err);
      setError("Failed to fetch orders. Please try again.");
    }
  };
  
  

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Order Report</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Date Selection */}
        <Form>
          <div className="d-flex gap-3 mb-3">
            <div>
              <Form.Label>Start Date</Form.Label>
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select start date"
              />
            </div>
            <div>
              <Form.Label>End Date</Form.Label>
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                className="form-control"
                dateFormat="yyyy-MM-dd"
                placeholderText="Select end date"
              />
            </div>
          </div>
        </Form>

        {/* Error Message */}
        {error && <p className="text-danger">{error}</p>}

        {/* Orders Table */}
        {orders.length > 0 ? (
          <Table bordered hover responsive>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Employee ID</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.orderID}>
                  <td>{order.orderID}</td>
                  <td>{new Date(order.orderTime).toLocaleDateString()}</td>
                  <td>{order.employeeID}</td>
                  <td>${order.orderTotal}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p>No orders available in the selected date range.</p>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={fetchOrders}>
          Get Orders
        </Button>
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default OrderReportModal;
