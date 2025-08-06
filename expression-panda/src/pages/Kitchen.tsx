import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";
import "./kitchenScreen.css";

interface Ingredients {
  ingredientName: string;
  amount: number;
}
interface Item {
  name: string;
  amount: number;
  ingredient: Ingredients[];
}
interface Order {
  id: number;
  status: string;
  item: Item[];
}

/**
 * Kitchen component.
 *
 * - Displays and manages kitchen orders for employees.
 * - Fetches orders from the server and updates the order list every 5 seconds.
 * - Provides functionality to process the next order in the queue.
 * - Ensures only authorized employees can access the Kitchen screen, redirecting unauthorized users to the home page.
 *
 * @component
 * @returns {JSX.Element} The rendered kitchen order management interface.
 */
const Kitchen = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  /**
   * Redirects unauthorized users to the home page.
   *
   * - Ensures only employees can access the Kitchen screen.
   * - Displays an alert and navigates unauthorized users to the home page.
   *
   * @function useEffect
   * @param {Array} dependencies - The list of dependencies for this effect, including `user` and `navigate`.
   * @returns {void}
   */
  useEffect(() => {
    if (!user || !user.isEmployee) {
      alert("You are not authorized to access the Kitchen screen.");
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  /**
   * Fetches kitchen orders from the server.
   *
   * - Sends a GET request to the API to retrieve the current list of kitchen orders.
   * - Updates the `orders` state with the fetched data.
   * - Handles and logs errors if the request fails.
   *
   * @async
   * @function fetchOrders
   * @returns {Promise<void>} Resolves when the orders are successfully fetched and set in state.
   * @throws {Error} If the network request fails or the response is invalid.
   */
  const fetchOrders = async () => {
    try {
      const response = await fetch(
        "https://project3-team3-rf8c.onrender.com/api/kitchenOrders?source=kitchen"
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();

      setOrders(data);
      setLoading(false);
      console.log(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setLoading(false);
    }
  };

  /**
   * Processes the next order in the queue.
   *
   * - Sends a PUT request to the API to update the status of the current order.
   * - Updates the `orders` state to remove the processed order and mark the next order as "building."
   * - Displays an error if the request fails or the server responds with an error.
   *
   * @async
   * @function handleNextOrder
   * @returns {Promise<void>} Resolves when the next order is successfully processed.
   * @throws {Error} If the network request fails or the response is invalid.
   */
  const handleNextOrder = async () => {
    try {
      const response = await fetch(
        "https://project3-team3-rf8c.onrender.com/api/kitchenNext",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const content = await response.json();
      if (!response.ok) {
        alert(content.error);
        throw new Error(content.error || "Error processing order");
      }
      orders[1].status = "building";
      setOrders((prevOrders) => prevOrders.slice(1));
    } catch (error) {
      console.error("Error processing next order:", error);
    }
  };

  /**
   * Sets up a polling interval to fetch orders every 5 seconds.
   *
   * - Calls `fetchOrders` on component mount and at regular intervals.
   * - Cleans up the interval when the component unmounts.
   *
   * @function useEffect
   * @returns {void}
   */
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user || !user.isEmployee) return <Navigate to="/" replace />;
  return (
    <div>
      <h1>Kitchen Orders</h1>
      <div
        style={{
          display: "grid",
          gridTemplateAreas: `
                        "a b c d e"
                        "a b c d e"
                        "a b c d e"
                    `,
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr",
          gridTemplateRows: "auto auto auto",
          gap: "10px",
          height: "80vh",
          width: "100vw",
        }}
      >
        {Array.from({ length: 5 }, (_, index) => {
          const order = orders[index];

          let gridArea: string;
          if (index === 0) gridArea = "a";
          else if (index === 1) gridArea = "b";
          else if (index === 2) gridArea = "c";
          else if (index === 3) gridArea = "d";
          else if (index === 4) gridArea = "e";

          return (
            <div
              className="kitchenGrid"
              key={index}
              style={{
                border: "1px solid #ccc",
                padding: "10px",
                minHeight: "150px",
                gridArea: gridArea,
                fontSize: "1em",
                overflow: "auto",
              }}
            >
              {order ? (
                <>
                  <strong>
                    Order ID: {order.id}
                    <span
                      style={{
                        color: order.status === "building" ? "red" : "black",
                        marginLeft: "10px",
                        fontWeight: "normal",
                      }}
                    >
                      ({order.status})
                    </span>
                  </strong>
                  <ul>
                    {order.item.map((item, itemIndex) => (
                      <li key={itemIndex}>
                        <strong>
                          Item: {item.name}{" "}
                          {item.amount > 1 && ` (x${item.amount})`}
                        </strong>
                        {/* Only render ingredients if they exist */}
                        {item.ingredient[0].ingredientName &&
                          item.ingredient.length > 0 && (
                            <ul>
                              {item.ingredient.map((ingredient, i) => (
                                <li key={i}>
                                  {ingredient.ingredientName} (x
                                  {ingredient.amount})
                                </li>
                              ))}
                            </ul>
                          )}
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <em>No order</em>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button onClick={handleNextOrder} disabled={orders.length === 0}>
        Process Next Order
      </button>
    </div>
  );
};

export default Kitchen;
