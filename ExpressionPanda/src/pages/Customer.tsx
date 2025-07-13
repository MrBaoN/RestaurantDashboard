import { FC, useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import { Translation } from "../components/Translation";
// Use your CartContext for adding items
import { useCart } from "../components/CartContext";

// Types
interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

const CustomerScreen: FC = () => {
  // Collapsible sidebar
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Current selected category
  const [selectedCategory, setSelectedCategory] = useState<string>("Entree");

  // Fetched menu items
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // We only need addItem from the cart context
  const { addItem } = useCart();

  // Fetch menu items on mount
  useEffect(() => {
    async function getMenuItems() {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/active-items`
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

  // Auto-collapse on smaller screens (optional)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter by category
  const filteredMenuItems = menuItems.filter(
    (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  return (
    <Translation>
      <div className="text-bg-dark d-flex flex-column vh-100 p-0">
        <div className="d-flex flex-grow-1">
          {/* SIDEBAR: slides off-screen when collapsed */}
          <div
            className="position-relative"
            style={{
              // If collapsed, move it off screen, else show normally
              transform: isCollapsed ? "translateX(-100%)" : "translateX(0)",
              transition: "transform 0.3s ease",
              width: "200px", // Adjust to your liking
              backgroundColor: "red",
              boxShadow: "0px 0px 10px rgba(0,0,0,0.2)",
            }}
          >
            {/* Toggle button: fixed so user can always click it */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              style={{
                position: "absolute",
                top: 10,
                right: -40,
                width: 40,
                height: 40,
                borderRadius: "50%",
                border: "none",
                backgroundColor: "#6c757d",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {isCollapsed ? ">>" : "<<"}
            </button>

            {/* Category buttons (only visible if not collapsed) */}
            {!isCollapsed && (
              <div
                className="d-flex flex-column align-items-center mt-5"
                style={{ gap: "15px" }}
              >
                <button
                  className="btn btn-dark rounded-pill shadow-sm w-75"
                  onClick={() => setSelectedCategory("Entree")}
                >
                  Entree
                </button>
                <button
                  className="btn btn-dark rounded-pill shadow-sm w-75"
                  onClick={() => setSelectedCategory("Side")}
                >
                  Side
                </button>
                <button
                  className="btn btn-dark rounded-pill shadow-sm w-75"
                  onClick={() => setSelectedCategory("Drink")}
                >
                  Drink
                </button>
                <button
                  className="btn btn-dark rounded-pill shadow-sm w-75"
                  onClick={() => setSelectedCategory("Extra")}
                >
                  Extra
                </button>
              </div>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div className="flex-grow-1 p-4">
            <h2 className="text-center text-danger">{selectedCategory}</h2>
            <div
              className="d-flex flex-wrap justify-content-center"
              style={{ maxHeight: "80vh", overflowY: "auto" }}
            >
              {filteredMenuItems.map((item) => (
                <button
                  key={item.id}
                  className="btn btn-secondary m-2 d-flex flex-column align-items-center justify-content-between"
                  style={{
                    minHeight: "160px",
                    width: "130px",
                    padding: "10px",
                  }}
                  onClick={() => addItem(item)}
                >
                  <img
                    src="/logo.png"
                    alt={item.name}
                    style={{ width: "80px", height: "80px" }}
                  />
                  <span>{item.name}</span>
                  <span>${item.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Translation>
  );
};

export default CustomerScreen;
