import { useEffect, useState } from "react";
import { Button, Col, Form } from "react-bootstrap";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
interface InventoryItem {
  id?: number;
  name: string;
  stockLevel: number;
  cost: number;
}

/**
 * Inventory component.
 *
 * - Provides an interface for managing inventory items.
 * - Allows authorized managers to view, create, and update inventory items.
 * - Fetches inventory data on component mount and displays items in a scrollable list.
 * - Includes a form for creating or editing inventory items.
 * - Redirects unauthorized users to the home page.
 *
 * @component
 * @returns {JSX.Element} The rendered inventory management interface.
 */
const Inventory: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  /**
   * Redirects unauthorized users to the home page.
   *
   * - Ensures only authorized managers can access the inventory management interface.
   *
   * @function useEffect
   * @returns {void}
   */
  useEffect(() => {
    if (!user || !user.isManager) {
      alert("You are not authorized to access the Inventory screen.");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<InventoryItem>({
    name: "",
    stockLevel: 0,
    cost: 0,
  }); // Default to a new item

  useEffect(() => {
    getInventory();
  }, []);

  /**
   * Fetches inventory items from the server.
   *
   * - Sends a GET request to the API to retrieve the current inventory data.
   * - Updates the `inventoryItems` state with the fetched data.
   * - Logs errors if the request fails.
   *
   * @async
   * @function getInventory
   * @returns {Promise<void>} Resolves when the inventory data is successfully fetched and set in state.
   * @throws {Error} If the network request fails.
   */
  async function getInventory() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/inventory`
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const parsedData: InventoryItem[] = data.map((item) => ({
        id: Number(item.id),
        name: String(item.name),
        stockLevel: Number(item.stockLevel),
        cost: Number(item.cost),
      }));
      setInventoryItems(parsedData);
    } catch (error) {
      console.error("Error fetching inventory items:", error);
    }
  }

  /**
   * Sets the clicked inventory item as the selected item for editing.
   *
   * @function handleItemClick
   * @param {InventoryItem} item - The inventory item that was clicked.
   * @returns {void}
   */
  const handleItemClick = (item: InventoryItem) => {
    setSelectedItem(item); // Set selected item to the clicked one for editing
  };

  /**
   * Handles changes in the form inputs for creating or editing an inventory item.
   *
   * - Updates the `selectedItem` state with the new values.
   *
   * @function handleFormChange
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   * @returns {void}
   */
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSelectedItem((prevItem) =>
      prevItem
        ? {
            ...prevItem,
            [name]:
              name === "stockLevel" || name === "cost" ? Number(value) : value,
          }
        : null
    );
  };

  /**
   * Handles form submission for creating or updating an inventory item.
   *
   * - Validates form inputs to ensure all required fields are filled and no negative values are present.
   * - Calls `addInventory` for new items or `updateInventory` for existing items.
   * - Resets the form and fetches the updated inventory data.
   *
   * @function handleSubmit
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>} Resolves when the form submission is successfully processed.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItem) {
      console.log(
        selectedItem.cost,
        selectedItem.name,
        selectedItem.stockLevel
      );
      if (!selectedItem.name || !selectedItem.stockLevel) {
        alert("Please fill out all the required field");
        return;
      }
      if (selectedItem.cost < 0 || selectedItem.stockLevel < 0) {
        alert("Cannot have negative number!");
        return;
      }
      if (selectedItem.id) {
        await updateInventory(selectedItem);
      } else {
        await addInventory(selectedItem);
      }

      getInventory();
      setSelectedItem({ name: "", stockLevel: 0, cost: 0 }); // Reset to a new item
    }
  };

  /**
   * Updates an existing inventory item in the database.
   *
   * - Sends a PUT request to the API with the updated item data.
   * - Displays a success message upon successful update.
   * - Logs errors if the request fails.
   *
   * @async
   * @function updateInventory
   * @param {InventoryItem} item - The inventory item to update.
   * @returns {Promise<void>} Resolves when the item is successfully updated.
   * @throws {Error} If the network request fails.
   */
  async function updateInventory(item: InventoryItem) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/update-inventory`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }
      );
      const content = await response.json();
      if (!response.ok) throw new Error(content.error);
      alert(content.message);
    } catch (error) {
      console.error("Error updating inventory item:", error);
    }
  }

  /**
   * Adds a new inventory item to the database.
   *
   * - Sends a POST request to the API with the new item data.
   * - Displays a success message upon successful creation.
   * - Logs errors if the request fails.
   *
   * @async
   * @function addInventory
   * @param {InventoryItem} item - The new inventory item to add.
   * @returns {Promise<void>} Resolves when the item is successfully added.
   * @throws {Error} If the network request fails.
   */
  async function addInventory(item: InventoryItem) {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/add-inventory`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }
      );
      const content = await response.json();
      if (!response.ok) throw new Error(content.error);
      alert(content.message);
    } catch (error) {
      console.error("Error adding new inventory item:", error);
    }
  }

  /**
   * Clears the form inputs and resets the `selectedItem` state to a new item.
   *
   * @function handleClear
   * @returns {void}
   */
  function handleClear() {
    setSelectedItem({ name: "", stockLevel: 0, cost: 0 }); // Clear to a new item
  }

  /**
   * Navigates to the specified page.
   *
   * - Uses the `useNavigate` hook from `react-router-dom` to navigate to different routes.
   *
   * @function handleNavigation
   * @param {string} page - The path to navigate to.
   * @returns {void}
   */
  function handleNavigation(page: string) {
    navigate(page);
  }
  if (!user || !user.isManager) return <Navigate to="/" replace />;
  return (
    <div className="container-fluid vh-100 d-flex p-0">
      <div
        className="col-9"
        style={{
          backgroundColor: "grey",
          overflowY: "scroll",
          alignItems: "center",
        }}
      >
        <Col
          md={9}
          className="d-flex flex-wrap p-3"
          style={{ gap: "10px", alignItems: "center" }}
        >
          {inventoryItems.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              className="menu-item-btn m-2"
              onClick={() => handleItemClick(item)}
            >
              {item.name}
            </Button>
          ))}
        </Col>
      </div>

      <div className="col-3 p-3" style={{ backgroundColor: "white" }}>
        <h5>
          {selectedItem && selectedItem.id ? "Edit Item" : "Create New Item"}
        </h5>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={selectedItem?.name}
              onChange={handleFormChange}
              placeholder="Enter item name"
            />
          </Form.Group>

          <Form.Group controlId="formCost">
            <Form.Label>Cost</Form.Label>
            <Form.Control
              type="number"
              name="cost"
              value={selectedItem?.cost}
              onChange={handleFormChange}
              placeholder="Enter item cost"
            />
          </Form.Group>

          <Form.Group controlId="formStockLevel">
            <Form.Label>Stock Level</Form.Label>
            <div className="d-flex align-items-center">
              <Form.Control
                type="number"
                name="stockLevel"
                value={selectedItem?.stockLevel}
                onChange={handleFormChange}
                placeholder="Enter stock level"
              />
            </div>
          </Form.Group>

          <Button
            variant="primary"
            type="submit"
            className="w-100 mt-3 text-center"
          >
            {selectedItem && selectedItem.id ? "Update Item" : "Create Item"}
          </Button>

          <Button
            variant="danger"
            className="w-100 mt-3 text-center"
            onClick={handleClear}
          >
            Clear
          </Button>

          <Button
            variant="secondary"
            className="w-100 mt-3 text-center"
            onClick={() => handleNavigation("/manager")}
          >
            Back
          </Button>
        </Form>
      </div>
    </div>
  );
};

export default Inventory;
