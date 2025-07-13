import React, { useEffect, useState } from "react";
import {
  Container,
  Row,
  Col,
  Table,
  Button,
  Modal,
  Form,
} from "react-bootstrap";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
interface Employee {
  password: string;
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  isManager: boolean;
  isActive: boolean;
  // password: string;
}

/**
 * EmployeeManagement component.
 *
 * - Provides a management interface for employee data.
 * - Allows authorized managers to view, add, edit, and update employee records.
 * - Includes modals for adding and editing employees, and a table displaying employee details.
 * - Redirects unauthorized users to the home page.
 *
 * @component
 * @returns {JSX.Element} The rendered employee management interface.
 */
const EmployeeManagement: React.FC = () => {
  const [users, setEmployees] = useState<Employee[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [newEmployee, setNewEmployee] = useState({
    firstName: "",
    lastName: "",
    username: "",
    password: "",
    isManager: false,
    isActive: true,
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Redirects unauthorized users to the home page.
   *
   * - Checks if the logged-in user is authorized to access the Employee Management screen.
   * - Redirects unauthorized users and displays an alert message.
   *
   * @function useEffect
   * @returns {void}
   */
  useEffect(() => {
    if (!user || !user.isManager) {
      alert("You are not authorized to access the Employee screen.");
      navigate("/", { replace: true });
    } else {
      fetchEmployees();
    }
  }, [user, navigate]);

  /**
   * Fetches the list of employees from the server.
   *
   * - Sends a GET request to the API to retrieve employee data.
   * - Updates the `users` state with the fetched employee data.
   * - Handles errors by logging them to the console.
   *
   * @async
   * @function fetchEmployees
   * @returns {Promise<void>} Resolves when the employee data is fetched and set in state.
   * @throws {Error} If the network request fails.
   */
  async function fetchEmployees() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/employees`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      const data = await response.json();
      setEmployees(data);
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Adds a new employee to the system.
   *
   * - Sends a POST request to the API with the new employee data.
   * - Displays an alert with the API response message.
   * - Fetches the updated employee list and hides the add employee modal.
   * - Handles errors by logging them to the console.
   *
   * @async
   * @function handleAddEmployee
   * @returns {Promise<void>} Resolves when the new employee is successfully added.
   * @throws {Error} If the network request fails.
   */
  const handleAddEmployee = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/add-employee`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newEmployee),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to add new user");
      }
      alert((await response.json()).message);
      fetchEmployees();
      setShowAddModal(false);
    } catch (error) {
      console.error("Error adding user: ", error);
    }
  };

  /**
   * Updates the selected employee's details.
   *
   * - Sends a PUT request to the API with the updated employee data.
   * - Displays an alert with the API response message.
   * - Fetches the updated employee list and hides the edit employee modal.
   * - Handles errors by logging them to the console.
   *
   * @async
   * @function handleEditEmployee
   * @returns {Promise<void>} Resolves when the employee details are successfully updated.
   * @throws {Error} If the network request fails.
   */
  const handleEditEmployee = async () => {
    if (!selectedEmployee) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/update-employee`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectedEmployee),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      alert((await response.json()).message);
      fetchEmployees();
      setShowEditModal(false);
    } catch (error) {
      console.error("Error updating user", error);
    }
  };

  /**
   * Handles input changes for the new employee form.
   *
   * - Updates the `newEmployee` state with the entered values.
   * - Supports both text and checkbox inputs.
   *
   * @function handleInputChange
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   * @returns {void}
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setNewEmployee((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  /**
   * Handles input changes for the edit employee form.
   *
   * - Updates the `selectedEmployee` state with the entered values.
   * - Supports both text and checkbox inputs.
   *
   * @function handleEditChange
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   * @returns {void}
   */
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedEmployee) {
      const { name, value, type, checked } = e.target;
      setSelectedEmployee({
        ...selectedEmployee,
        [name]: type === "checkbox" ? checked : value,
      });
    }
  };
  if (!user || !user.isManager) return <Navigate to="/" replace />;
  return (
    <Container fluid className="user-management text-center vh-100 p-0">
      {/* Header */}
      <Row className="bg-danger py-3">
        <Col>
          <h1 className="text-white">Employee Management</h1>
        </Col>
      </Row>

      {/* Employee Table*/}
      <Row
        className="flex-grow-1"
        style={{ overflowY: "auto", maxHeight: "70vh" }}
      >
        <Col className="p-3">
          <Table bordered hover className="table-responsive">
            <thead className="bg-danger text-white">
              <tr>
                <th>Employee ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Username</th>
                <th>Is Manager</th>
                <th>Is Active</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => setSelectedEmployee(user)}
                  style={{
                    cursor: "pointer",
                    backgroundColor:
                      selectedEmployee?.id === user.id ? "#f0f8ff" : "",
                  }}
                >
                  <td>{user.id}</td>
                  <td>{user.firstName}</td>
                  <td>{user.lastName}</td>
                  <td>{user.username}</td>
                  <td>{user.isManager ? "true" : "false"}</td>
                  <td>{user.isActive ? "true" : "false"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
      {/* Action Buttons */}
      <Row className="bg-light py-3 fixed-bottom">
        <Col className="d-flex justify-content-around">
          <Button variant="secondary" onClick={() => navigate("/manager")}>
            Manager
          </Button>
          <Button variant="secondary" onClick={() => setShowAddModal(true)}>
            Add Employee
          </Button>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(true)}
            disabled={!selectedEmployee}
          >
            Edit Selected Employee
          </Button>
        </Col>
      </Row>

      {/* Add Employee Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Add New Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="firstName">
              <Form.Label>First Name</Form.Label>
              <Form.Control
                type="text"
                name="firstName"
                value={newEmployee.firstName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="lastName">
              <Form.Label>Last Name</Form.Label>
              <Form.Control
                type="text"
                name="lastName"
                value={newEmployee.lastName}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={newEmployee.username}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="password">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={newEmployee.password}
                onChange={handleInputChange}
                required
              />
            </Form.Group>
            <Form.Group controlId="isManager">
              <Form.Check
                type="checkbox"
                label="Is Manager"
                name="isManager"
                checked={newEmployee.isManager}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group controlId="isActive">
              <Form.Check
                type="checkbox"
                label="Is Active"
                name="isActive"
                checked={newEmployee.isActive}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddEmployee}>
            Add Employee
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Employee</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedEmployee && (
            <Form>
              <Form.Group controlId="editFirstName">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={selectedEmployee.firstName}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group controlId="editLastName">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={selectedEmployee.lastName}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group controlId="editUsername">
                <Form.Label>Username</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={selectedEmployee.username}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group controlId="editPassword">
                <Form.Label>Password</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={selectedEmployee.password || ""}
                  onChange={handleEditChange}
                  placeholder="Enter new password"
                />
              </Form.Group>
              <Form.Group controlId="editIsManager">
                <Form.Check
                  type="checkbox"
                  label="Is Manager"
                  name="isManager"
                  checked={selectedEmployee.isManager}
                  onChange={handleEditChange}
                />
              </Form.Group>
              <Form.Group controlId="editIsActive">
                <Form.Check
                  type="checkbox"
                  label="Is Active"
                  name="isActive"
                  checked={selectedEmployee.isActive}
                  onChange={handleEditChange}
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleEditEmployee}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default EmployeeManagement;
