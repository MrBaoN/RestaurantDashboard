import { FC, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { Container, Col, Row, Card } from "react-bootstrap";
import { useAuth } from "../components/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface Order {
  id: number;
  status: string;
}

/**
 * MenuBoard component.
 *
 * - Displays the menu categorized by types (Entrees, Drinks, Sides, Extras) in a responsive layout.
 * - Shows a real-time feed of orders fetched from the server.
 * - Updates menu items and orders periodically.
 * - Ensures only authorized employees can access the MenuBoard screen, redirecting unauthorized users to the home page.
 *
 * @component
 * @returns {JSX.Element} The rendered MenuBoard interface.
 */
const MenuBoard: FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /**
   * Ensures only authorized employees can access the MenuBoard screen.
   *
   * - Redirects unauthorized users to the home page and displays an alert.
   *
   * @function useEffect
   * @param {Array} dependencies - The list of dependencies for this effect, including `user` and `navigate`.
   * @returns {void}
   */
  useEffect(() => {
    if (!user || !user.isEmployee) {
      alert("You are not authorized to access the Inventory screen.");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const [menuItemsByCategory, setMenuItemsByCategory] = useState<{
    [key: string]: MenuItem[];
  }>({});
  let [orders, setOrders] = useState<Order[]>([]);
  if (!user || !user.isEmployee) return <Navigate to="/" replace />;

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    /**
     * Fetches active menu items from the server.
     *
     * - Sends a GET request to the API to retrieve the current list of active menu items.
     * - Groups items by category (e.g., Entrees, Drinks, Sides, Extras) and updates the `menuItemsByCategory` state.
     * - Logs errors if the request fails.
     *
     * @async
     * @function getMenuItems
     * @returns {Promise<void>} Resolves when the menu items are successfully fetched and categorized.
     * @throws {Error} If the network request fails.
     */
    async function getMenuItems() {
      try {
        const response = await fetch(
          "https://middleware-04w7.onrender.com/api/active-items"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();

        const groupedItems: { [key: string]: MenuItem[] } = {};

        data.forEach(
          (item: {
            id: string;
            name: string;
            price: number;
            category: string;
          }) => {
            const category = item.category.toLowerCase();
            if (category !== 'drinks') {  // Exclude drinks
              if (!groupedItems[category]) {
                groupedItems[category] = [];
              }
              groupedItems[category].push({
                id: item.id,
                name: item.name,
                price: Number(item.price),
                category: item.category,
              });
            }
          }
        );

        // Ensure entrees come first, then sides
        const orderedCategories: { [key: string]: MenuItem[] } = {};
        if (groupedItems['entree']) {
          orderedCategories['entree'] = groupedItems['entree'];
        }
        if (groupedItems['side']) {
          orderedCategories['side'] = groupedItems['side'];
        }

        setMenuItemsByCategory(orderedCategories);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
      }
    }
    getMenuItems();

    intervalId = setInterval(getMenuItems, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  /**
   * Sets up periodic polling to refresh menu items and orders.
   *
   * - Calls `getMenuItems` and `fetchOrders` every 5 seconds to keep data up-to-date.
   * - Clears the polling interval when the component unmounts.
   *
   * @function useEffect
   * @returns {void}
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    /**
     * Fetches real-time orders from the server.
     *
     * - Sends a GET request to the API to retrieve the current list of orders.
     * - Limits the displayed orders to the most recent 6.
     * - Updates the `orders` state with the fetched data.
     * - Logs errors if the request fails.
     *
     * @async
     * @function fetchOrders
     * @returns {Promise<void>} Resolves when the orders are successfully fetched and set in state.
     * @throws {Error} If the network request fails.
     */
    async function fetchOrders() {
      try {
        const response = await fetch(
          "https://middleware-04w7.onrender.com/api/kitchenOrders?source=menu"
        );
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();

        setOrders(data.slice(0, 6) as Order[]);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      }
    }

    fetchOrders();

    intervalId = setInterval(fetchOrders, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  // If not an employee, redirect
  if (!user || !user.isEmployee) return <Navigate to="/" replace />;

  return (
    <Container fluid className="p-0">
      {/* Background Image */}
      <div
        style={{
          backgroundImage: 'url("/logo.png")',
          backgroundSize: "cover",
          backgroundPosition: "center",
          height: "100vh",
          width: "100vw",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: "-1",
          opacity: 0.5,
        }}
      />

      <Row style={{ height: "100vh" }}>
        {/* Menu Items Section */}
        <Col xs={8} className="p-2">
          {Object.keys(menuItemsByCategory).map((category) => (
            <Card key={category} className="mb-2" style={{ maxWidth: "90%", margin: "0 auto" }}>
              <Card.Body>
                <h2 className="text-center" style={{ fontSize: "1.5rem" }}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}s
                </h2>
                <hr />
                <Row className="g-2">
                  {menuItemsByCategory[category]?.map((item) => (
                    <Col key={item.id} xs={6} sm={4} lg={3}>
                      <div
                        className="d-flex justify-content-between align-items-center px-2 py-1"
                        style={{
                          backgroundColor: "#f8f9fa",
                          border: "1px solid #ccc",
                          borderRadius: "5px",
                          fontSize: "0.9rem",
                          fontWeight: "500",
                          height: "10vh",
                        }}
                      >
                        <span>{item.name}</span>
                        <span>${item.price.toFixed(2)}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          ))}
        </Col>

        {/* Orders Section */}
        <Col
          xs={4}
          className="p-2 d-flex flex-column"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            height: "100vh",
            overflowY: "auto",
            borderLeft: "1px solid lightgray",
          }}
        >
          <h4 className="text-center" style={{ fontSize: "1.5rem" }}>
            Orders
          </h4>
          <div className="mt-2">
            {orders.map((order, index) => (
              <div
                key={order.id}
                className="m-1 p-2"
                style={{
                  textAlign: "center",
                  backgroundColor: index === 0 ? "red" : "lightgray",
                  color: index === 0 ? "white" : "black",
                  borderRadius: "5px",
                }}
              >
                <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                  Order #{order.id}
                </div>
                <div style={{ fontSize: "1rem" }}>{order.status}</div>
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default MenuBoard;
