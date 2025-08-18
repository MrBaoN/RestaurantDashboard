import { ChangeEvent, FC, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import { useAuth } from "../components/AuthContext";
import { MIDDLEWARE_URI } from "../config";
import {
  Container,
  Row,
  Col,
  Button,
  ListGroup,
  FormControl,
  Modal,
} from "react-bootstrap";
import { Translation } from "../components/Translation";

// Define types for menu items and selected items
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface SelectedItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  itemAmount: SelectedItem[];
  total: number;
  emID: number;
}

/**
 * Adds an item to the selected items list.
 *
 * - Increases the quantity if the item already exists in the list, or adds a new item with a quantity of 1.
 *
 * @function addItem
 * @param {MenuItem} item - The menu item to add.
 * @param {SelectedItem[]} selectedItems - The current list of selected items.
 * @param {React.Dispatch<React.SetStateAction<SelectedItem[]>>} setSelectedItems - The state setter for the selected items.
 * @returns {void}
 */
const addItem = (
  item: MenuItem,
  selectedItems: SelectedItem[],
  setSelectedItems: React.Dispatch<React.SetStateAction<SelectedItem[]>>
) => {
  const existingItemIndex = selectedItems.findIndex(
    (selectedItem) => selectedItem.name === item.name
  );
  if (existingItemIndex >= 0) {
    const updatedItems = [...selectedItems];
    updatedItems[existingItemIndex].quantity += 1;
    setSelectedItems(updatedItems);
  } else {
    setSelectedItems([
      ...selectedItems,
      { id: item.id, name: item.name, price: item.price, quantity: 1 },
    ]);
  }
};

/**
 * CashierScreen component.
 *
 * - A cashier interface for managing customer orders.
 * - Allows users to view menu items, select items by category, adjust quantities, and place orders.
 * - Calculates the subtotal, tax, and total for the current order and provides functionality to clear or confirm the order.
 * - Includes a sidebar for category selection, a menu grid for items, and an order summary with adjustable quantities.
 * - Handles user authentication for placing orders.
 *
 * @component
 * @returns {JSX.Element} The rendered cashier interface component.
 */
const CashierScreen: FC = () => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Entree");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false); // Sidebar collapse state
  const { user, openLoginModal } = useAuth();

  /**
   * Fetches menu items from the API.
   *
   * - Retrieves active menu items and parses the response into the `MenuItem` structure.
   * - Updates the `menuItems` state with the fetched data.
   *
   * @async
   * @function getMenuItems
   * @returns {Promise<void>} Resolves when the menu items are fetched and set in state.
   * @throws {Error} If the network request fails or the response is invalid.
   */
  useEffect(() => {
    async function getMenuItems() {
      const response = await fetch(
        `${MIDDLEWARE_URI}/api/active-items`
      );
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      const parsedData: MenuItem[] = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        price: Number(item.price),
        category: item.category,
      }));
      setMenuItems(parsedData);
    }
    getMenuItems();
  }, []);

  const subtotal = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  /**
   * Clears all selected items from the current order.
   *
   * @function clearOrder
   * @returns {void}
   */
  const clearOrder = () => setSelectedItems([]);

  /**
   * Updates the quantity of a selected item.
   *
   * - Adjusts the quantity of the item at the specified index in the selected items list.
   * - Ensures that the quantity cannot be negative.
   *
   * @function handleQuantityChange
   * @param {number} index - The index of the item to update.
   * @param {ChangeEvent<HTMLInputElement>} event - The input change event containing the new quantity.
   * @returns {void}
   */
  const handleQuantityChange = (index: number, event: ChangeEvent<any>) => {
    const newQuantity = Math.max(0, Number(event.target.value)); // No negative quantities
    setSelectedItems((prevItems) => {
      const updatedItems = [...prevItems];
      updatedItems[index] = { ...updatedItems[index], quantity: newQuantity };
      return updatedItems;
    });
  };

  /**
   * Removes an item from the selected items list.
   *
   * @function handleRemoveItem
   * @param {number} index - The index of the item to remove.
   * @returns {void}
   */
  const handleRemoveItem = (index: number) => {
    setSelectedItems((prevItems) => prevItems.filter((_, i) => i !== index));
  };

  /**
   * Initiates the process to place an order.
   *
   * - Validates that the user is authenticated and that the order is not empty.
   * - Displays a confirmation modal if validations pass.
   *
   * @function handlePlaceOrder
   * @returns {void}
   */
  const handlePlaceOrder = () => {
    if (selectedItems.length === 0) {
      alert("Your order is empty. Please add items to your order.");
      return;
    }

    if (!user) {
      alert("You are not logged in!");
      openLoginModal();
      return;
    }
    setShowConfirmation(true);
  };

  /**
   * Confirms the order and sends it to the server.
   *
   * - Constructs the order object and sends a POST request to the API.
   * - Clears the current order and hides the confirmation modal upon success.
   * - Handles errors by displaying an alert and logging the error.
   *
   * @async
   * @function handleConfirmOrder
   * @returns {Promise<void>} Resolves when the order is successfully placed.
   * @throws {Error} If the server returns an error or the request fails.
   */
  const handleConfirmOrder = async () => {
    const order: Order = {
      itemAmount: selectedItems,
      total,
      emID: user.id as number,
    };
    try {
      const response = await fetch(
        `${MIDDLEWARE_URI}/api/placeOrder`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(order),
        }
      );
      const content = await response.json();
      console.log(content);
      if (!response.ok) {
        alert(content.error);
        throw new Error(content.error);
      }
      setSelectedItems([]);
      setShowConfirmation(false);
      alert(content.message);
    } catch (error) {
      console.error(error);
    }
  };

  /**
   * Cancels the order confirmation process and hides the confirmation modal.
   *
   * @function handleCancelOrder
   * @returns {void}
   */
  const handleCancelOrder = () => setShowConfirmation(false);

  /**
   * Filters menu items by the selected category.
   *
   * - Returns only the items that match the currently selected category.
   *
   * @function filteredMenuItems
   * @returns {MenuItem[]} The list of menu items matching the selected category.
   */
  const filteredMenuItems = menuItems.filter(
    (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <Translation>
      <Container fluid className="text-bg-dark flex-column d-flex vh-100 p-0">
        <Row className="vh-100">
          {/* Sidebar */}
          <Col
            md={isCollapsed ? 1 : 2}
            className={`d-flex flex-column bg-danger text-center py-4 ${
              isCollapsed ? "sidebar-collapsed" : "sidebar-expanded"
            }`}
            style={{
              height: "100vh",
              transition: "width 0.3s",
              boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
              position: "relative",
              borderTopRightRadius: isCollapsed ? "0" : "10px",
              borderBottomRightRadius: isCollapsed ? "0" : "10px",
            }}
          >
            <Button
              variant="secondary"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="mb-3 rounded-circle p-2 position-absolute"
              style={{
                top: "10px",
                left: isCollapsed ? "10px" : "90%",
                zIndex: 1,
                transition: "left 0.3s",
              }}
            >
              {isCollapsed ? ">>" : "<<"}
            </Button>
            <div
              className="d-flex flex-column align-items-center"
              style={{ gap: "15px", marginTop: "60px" }}
            >
              <Button
                variant="dark"
                className="w-75 rounded-pill shadow-sm"
                onClick={() => setSelectedCategory("Entree")}
              >
                Entree
              </Button>
              <Button
                variant="dark"
                className="w-75 rounded-pill shadow-sm"
                onClick={() => setSelectedCategory("Side")}
              >
                Side
              </Button>
              <Button
                variant="dark"
                className="w-75 rounded-pill shadow-sm"
                onClick={() => setSelectedCategory("Drink")}
              >
                Drink
              </Button>
              <Button
                variant="dark"
                className="w-75 rounded-pill shadow-sm"
                onClick={() => setSelectedCategory("Extra")}
              >
                Extra
              </Button>
            </div>
          </Col>

          {/* Main Content */}
          <Col md={isCollapsed ? 8 : 7} className="p-4">
            <h2 className="text-center text-danger">{selectedCategory}</h2>
            <div
              className="menu-grid d-flex flex-wrap justify-content-center"
              style={{ maxHeight: "70vh", overflowY: "auto" }} // Add this style to enable scrolling
            >
              {filteredMenuItems.map((item) => (
                <Button
                  key={item.id}
                  variant="secondary"
                  className="menu-item-btn m-1"
                  onClick={() => addItem(item, selectedItems, setSelectedItems)}
                  style={{
                    minHeight: "160px",
                    width: "130px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px",
                  }}
                >
                  <img
                    src="/logo.png"
                    alt={item.name}
                    className="item-image"
                    style={{ width: "80px", height: "80px" }}
                  />
                  <span className="item-name">{item.name}</span>
                  <span className="item-price">${item.price.toFixed(2)}</span>
                </Button>
              ))}
            </div>
          </Col>

          {/* Order Summary */}
          <Col
            md={3}
            className="bg-light p-3 d-flex flex-column"
            style={{ height: "90vh" }}
          >
            <div style={{ flex: 1, overflowY: "auto", marginBlock: "10px" }}>
              <ListGroup className="mb-3">
                {selectedItems.map((item, index) => (
                  <ListGroup.Item
                    key={item.id}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <div>
                      {item.name} - ${item.price.toFixed(2)}
                    </div>
                    <FormControl
                      type="number"
                      value={item.quantity}
                      min={0}
                      onChange={(e) => handleQuantityChange(index, e)}
                      style={{ width: "60px", textAlign: "center" }}
                    />
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      X
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
            <div className="text-danger" style={{ marginTop: "auto" }}>
              <p>Subtotal: ${subtotal.toFixed(2)}</p>
              <p>Tax: ${tax.toFixed(2)}</p>
              <h4>Total: ${total.toFixed(2)}</h4>
            </div>
            <Button
              variant="danger"
              className="w-100 mb-2"
              onClick={handlePlaceOrder}
            >
              Place Order
            </Button>
            <Button
              variant="secondary"
              className="w-100 mb-2"
              onClick={clearOrder}
            >
              Delete
            </Button>
          </Col>
        </Row>

        {/* Confirmation Modal */}
        <Modal show={showConfirmation} onHide={handleCancelOrder}>
          <Modal.Header closeButton>
            <Modal.Title>Confirm Order</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Are you sure you want to place this order?</p>
            <div style={{ maxHeight: "150px", overflowY: "auto" }}>
              <ListGroup>
                {selectedItems.map((item) => (
                  <ListGroup.Item key={item.id}>
                    {item.name} x {item.quantity} - $
                    {(item.price * item.quantity).toFixed(2)}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </div>
            <hr />
            <p>
              <strong>Subtotal: ${subtotal.toFixed(2)}</strong>
            </p>
            <p>
              <strong>Tax: ${tax.toFixed(2)}</strong>
            </p>
            <p>
              <strong>Total: ${total.toFixed(2)}</strong>
            </p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCancelOrder}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmOrder}>
              Confirm
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </Translation>
  );
};

export default CashierScreen;
