import { ChangeEvent, FC, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import { useAuth } from "../components/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Button,
  ListGroup,
  FormControl,
  Modal,
} from "react-bootstrap";

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
 * - Increases the quantity if the item already exists, or adds it as a new item with a quantity of 1.
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
 * - Provides a cashier interface for selecting menu items, managing orders, and calculating totals.
 * - Allows employees to view menu items by category, adjust quantities, and place or delete orders.
 * - Ensures only authorized employees can access this screen.
 * - Displays a confirmation modal before finalizing an order.
 *
 * @component
 * @returns {JSX.Element} The rendered cashier interface.
 */
const CashierScreen: FC = () => {
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Entree");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  /**
   * Redirects unauthorized users to the home page.
   *
   * - Ensures only employees can access the Cashier screen.
   * - Displays an alert to notify unauthorized access attempts.
   *
   * @function useEffect
   * @param {Array} dependencies - The list of dependencies for this effect, including `user` and `navigate`.
   * @returns {void}
   */
  useEffect(() => {
    if (!user || !user.isEmployee) {
      alert("You are not authorized to access the Cashier screen.");
      navigate("/", { replace: true });
    } else {
      getMenuItems();
    }
  }, [user, navigate]);

  /**
   * Fetches active menu items from the API.
   *
   * - Retrieves menu items and maps the data to the `MenuItem` type.
   * - Updates the `menuItems` state with the fetched data.
   * - Logs errors if the request fails.
   *
   * @async
   * @function getMenuItems
   * @returns {Promise<void>} Resolves when the menu items are successfully fetched and set in state.
   * @throws {Error} If the network request fails.
   */
  async function getMenuItems() {
    return (
      fetch("https://project3-team3-rf8c.onrender.com/api/active-items")
        .then((response) => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })

        // Map to MenuItem type
        .then((data) => {
          const parsedData: MenuItem[] = data.map(
            (item: {
              id: number;
              name: string;
              price: number;
              category: string;
            }) => ({
              id: item.id,
              name: item.name,
              price: Number(item.price),
              category: item.category,
            })
          );

          console.log("Fetched Menu Items:", parsedData);
          setMenuItems(parsedData);
        })
    );
  }

  const subtotal = selectedItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );
  const tax = subtotal * 0.0825;
  const total = subtotal + tax;

  /**
   * Clears all selected items from the order.
   *
   * @function clearOrder
   * @returns {void}
   */
  const clearOrder = () => {
    setSelectedItems([]);
  };

  /**
   * Updates the quantity of a selected item.
   *
   * - Ensures the quantity cannot be negative.
   *
   * @function handleQuantityChange
   * @param {number} index - The index of the item to update.
   * @param {ChangeEvent<HTMLInputElement>} event - The input change event.
   * @returns {void}
   */
  const handleQuantityChange = (index: number, event: ChangeEvent<any>) => {
    const newQuantity = Math.max(
      0,
      Number((event.target as HTMLInputElement).value)
    ); // Ensure no negative quantities
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
   * Initiates the order placement process.
   *
   * - Ensures the order is not empty before proceeding.
   * - Displays a confirmation modal if validation passes.
   *
   * @function handlePlaceOrder
   * @returns {void}
   */
  const handlePlaceOrder = () => {
    if (selectedItems.length === 0) {
      alert("Your order is empty. Please add items to your order.");
      return;
    }
    setShowConfirmation(true);
  };

  /**
   * Confirms and places the order by sending it to the server.
   *
   * - Constructs an `Order` object with the selected items and totals.
   * - Sends a POST request to the API with the order details.
   * - Clears the current order and hides the confirmation modal upon success.
   * - Handles errors by displaying an alert and logging the error.
   *
   * @async
   * @function handleConfirmOrder
   * @returns {Promise<void>} Resolves when the order is successfully placed.
   * @throws {Error} If the network request fails or the server responds with an error.
   */
  const handleConfirmOrder = async () => {
    const order: Order = {
      itemAmount: selectedItems,
      total: total,
      emID: user?.id as number,
    };

    try {
      const response = await fetch(
        "https://project3-team3-rf8c.onrender.com/api/placeOrder",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(order),
        }
      );

      const content = await response.json();
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
   * Cancels the order confirmation process.
   *
   * - Closes the confirmation modal.
   *
   * @function handleCancelOrder
   * @returns {void}
   */
  const handleCancelOrder = () => {
    setShowConfirmation(false);
  };

  /**
   * Filters menu items by the selected category.
   *
   * - Returns only the items that match the currently selected category.
   *
   * @function filteredMenuItems
   * @returns {MenuItem[]} The list of menu items in the selected category.
   */
  const filteredMenuItems = menuItems.filter(
    (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  if (!user || !user.isEmployee) return <Navigate to="/" replace />;
  return (
    <Container fluid className="text-bg-dark flex-column d-flex vh-100 p-0">
      {/* Header Row */}
      <Row
        className="bg-danger text-center py-2 w-100"
        style={{ position: "sticky", bottom: 0, left: 0 }}
      >
        <Col>
          <Button
            style={{
              backgroundColor: selectedCategory === "Entree" ? "white" : "grey",
              color: selectedCategory === "Entree" ? "black" : "white",
            }}
            onClick={() => setSelectedCategory("Entree")}
          >
            Entree
          </Button>
        </Col>
        <Col>
          <Button
            style={{
              backgroundColor: selectedCategory === "Side" ? "white" : "grey",
              color: selectedCategory === "Side" ? "black" : "white",
            }}
            onClick={() => setSelectedCategory("Side")}
          >
            Side
          </Button>
        </Col>
        <Col>
          <Button
            style={{
              backgroundColor: selectedCategory === "Drink" ? "white" : "grey",
              color: selectedCategory === "Drink" ? "black" : "white",
            }}
            onClick={() => setSelectedCategory("Drink")}
          >
            Drink
          </Button>
        </Col>
        <Col>
          <Button
            style={{
              backgroundColor: selectedCategory === "Extra" ? "white" : "grey",
              color: selectedCategory === "Extra" ? "black" : "white",
            }}
            onClick={() => setSelectedCategory("Extra")}
          >
            Extra
          </Button>
        </Col>
      </Row>

      {/* Main Content Row */}
      <Row className="flex-grow-1 d-flex">
        {/* Menu Items */}
        <Col
          md={9}
          className="d-flex flex-wrap p-3"
          style={{ gap: "10px", overflowY: "auto" }}
        >
          {filteredMenuItems.map((item) => (
            <Button
              key={item.name}
              variant="secondary"
              className="menu-item-btn m-2"
              onClick={() => addItem(item, selectedItems, setSelectedItems)}
            >
              <div className="item-content">
                <span className="item-name">{item.name}</span>
                <span className="item-price">${item.price.toFixed(2)}</span>
              </div>
            </Button>
          ))}
        </Col>

        {/* Order Summary */}
        <Col
          md={3}
          className="bg-light p-3 d-flex flex-column"
          style={{ maxHeight: "calc(100vh - 110px)" }}
        >
          <div style={{ flex: 1, overflowY: "auto", marginBlock: "10px" }}>
            <ListGroup className="mb-3">
              {selectedItems.map((item, index) => (
                <ListGroup.Item
                  key={item.name}
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

          <div className="text-danger">
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
          <Button variant="secondary" className="w-100" onClick={clearOrder}>
            Delete
          </Button>
        </Col>
      </Row>

      <Modal show={showConfirmation} onHide={handleCancelOrder}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Are you sure you want to place this order?</p>
          <div style={{ maxHeight: "150px", overflowY: "auto" }}>
            <ListGroup>
              {selectedItems.map((item) => (
                <ListGroup.Item key={item.name}>
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

      {/* Footer Row with Category Buttons */}
    </Container>
  );
};

export default CashierScreen;
