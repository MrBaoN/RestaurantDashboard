import React, { useState } from "react";
import { Modal, Button, Form, Table } from "react-bootstrap";
import axios from "axios";

interface InventoryItem {
    itemName: string;
    totalQuantityUsed: number;
}

interface InventoryReportModalProps {
    show: boolean;
    handleClose: () => void;
}

/**
 * InventoryReportModal component.
 *
 * - A modal that allows users to fetch and view an inventory usage report for a specified date range.
 * - Displays fetched inventory data in a table and provides error handling for invalid inputs or failed API requests.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {boolean} props.show - Determines whether the modal is visible.
 * @param {function} props.handleClose - Callback function to close the modal.
 * @returns {JSX.Element} The rendered modal component.
 */
const InventoryReportModal: React.FC<InventoryReportModalProps> = ({ show, handleClose }) => {
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
    const [error, setError] = useState<string>("");

    /**
     * Fetches inventory data from the API based on the selected date range.
     *
     * - Sends a GET request with `startDate` and `endDate` as query parameters.
     * - Updates the inventory data in the state or sets an error message if the request fails.
     *
     * @async
     * @function fetchInventoryData
     * @returns {Promise<void>} Resolves when the inventory data is successfully fetched and set in state.
     * @throws {Error} If the API request fails, an error message is displayed.
     */
    const fetchInventoryData = async () => {
        setError(""); // Clear previous errors
        try {
            const response = await axios.get(
                "https://middleware-04w7.onrender.com/api/getInventoryUsed",
                {
                    params: { startDate, endDate },
                }
            );
            setInventoryData(response.data);
        } catch (err) {
            setError("Failed to fetch inventory data. Please check your dates and try again.");
            console.error(err);
        }
    };

    /**
     * Handles the "Get Inventory Report" button click event.
     *
     * - Validates that both `startDate` and `endDate` are provided.
     * - If valid, triggers the `fetchInventoryData` function.
     * - If invalid, sets an error message in the state.
     *
     * @function handleFetch
     * @returns {void}
     */
    const handleFetch = () => {
        if (!startDate || !endDate) {
            setError("Start Date and End Date are required.");
            return;
        }
        fetchInventoryData();
    };

    return (
        <Modal show={show} onHide={handleClose} size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Inventory Report</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="startDate">
                        <Form.Label>Start Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group controlId="endDate" className="mt-3">
                        <Form.Label>End Date</Form.Label>
                        <Form.Control
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </Form.Group>
                </Form>
                <Button className="mt-3" variant="primary" onClick={handleFetch}>
                    Get Inventory Report
                </Button>
                {error && <p className="text-danger mt-3">{error}</p>}

                {inventoryData.length > 0 && (
                    <Table striped bordered hover className="mt-4">
                        <thead>
                            <tr>
                                <th>Item Name</th>
                                <th>Total Quantity Used</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventoryData.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.itemName}</td>
                                    <td>{item.totalQuantityUsed}</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
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

export default InventoryReportModal;
