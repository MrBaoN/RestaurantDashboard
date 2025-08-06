import React, { useState, useEffect, useRef } from "react";
import { Button, Col, Row, Form } from "react-bootstrap";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../components/AuthContext";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  isActive: boolean;
  ingredientList: IngredientQuantity[];
}

interface Ingredients {
  id: number;
  name: string;
}

interface IngredientQuantity {
  id: number;
  name: string;
  quantity: number;
}

/**
 * MenuAdjust component.
 *
 * - Provides an interface for managers to create, edit, and manage menu items.
 * - Allows users to assign ingredients and quantities to menu items.
 * - Includes functionality to fetch, add, and update menu items and their associated ingredients.
 * - Ensures only authorized managers can access this screen.
 *
 * @component
 * @returns {JSX.Element} The rendered menu adjustment interface.
 */
export const MenuAdjust = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("Entree");
  const [selectedItem, setSelectedItem] = useState<MenuItem>({
    id: "",
    name: "",
    price: 0,
    category: "",
    description: "",
    isActive: false,
    ingredientList: [],
  });
  const [ingredientList, setIngredientList] = useState<Ingredients[]>([]);
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const ingredientListRef = useRef<Ingredients[]>([]);
  const { user } = useAuth();

  /**
   * Ensures only authorized managers can access the Menu Adjust screen.
   *
   * - Redirects unauthorized users to the home page and displays an alert.
   *
   * @function useEffect
   * @param {Array} dependencies - The list of dependencies for this effect, including `user` and `navigate`.
   * @returns {void}
   */
  useEffect(() => {
    if (!user || !user.isManager) {
      alert("You are not authorized to access the Menu Adjust screen.");
      navigate("/", { replace: true });
    }
    getMenuItems();
    getIngredients();
  }, [user, navigate]);

  useEffect(() => {
    if (!selectedItem.id && ingredientList.length > 0 && selectedItem.ingredientList.length === 0) {
      setSelectedItem((prevItem) => ({
        ...prevItem,
        ingredientList: ingredientList.map((ingredient) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: 0,
        })),
      }));
    }
  }, [ingredientList, selectedItem.id, selectedItem.ingredientList.length]);
  /**
   * Fetches all menu items from the server.
   *
   * - Sends a GET request to the API to retrieve the current list of menu items.
   * - Maps the response data to the `MenuItem` type and updates the `menuItems` state.
   * - Logs errors if the request fails.
   *
   * @async
   * @function getMenuItems
   * @returns {Promise<void>} Resolves when the menu items are successfully fetched and set in state.
   * @throws {Error} If the network request fails.
   */
  async function getMenuItems() {
    try {
      const response = await fetch(
        "https://project3-team3-rf8c.onrender.com/api/all-items"
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      console.log(data);
      const parsedData: MenuItem[] = data.map((item) => ({
        id: item.id.toString(),
        name: item.name,
        price: Number(item.price),
        category: item.category,
        description: item.description || "",
        isActive: Boolean(item.isActive),
        ingredientList: item.ingredients.map((ingredient: any) => ({
          id: ingredient.id,
          name: ingredient.name,
          quantity: ingredient.quantity_used,
        })),
      }));

      setMenuItems(parsedData);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  }

  /**
   * Fetches all available ingredients from the server.
   *
   * - Sends a GET request to the API to retrieve the current list of ingredients.
   * - Maps the response data to the `Ingredients` type and updates the `ingredientList` state.
   * - Logs errors if the request fails.
   *
   * @async
   * @function getIngredients
   * @returns {Promise<void>} Resolves when the ingredients are successfully fetched and set in state.
   * @throws {Error} If the network request fails.
   */
  async function getIngredients() {
    try {
      const response = await fetch(
        "https://project3-team3-rf8c.onrender.com/api/inventory"
      );
      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const parsedData: Ingredients[] = data.map((item) => ({
        id: Number(item.id),
        name: String(item.name),
      }));
      setIngredientList(parsedData);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  }

  /**
   * Adds a new menu item to the server.
   *
   * - Sends a POST request to the API with the new menu item data.
   * - Refreshes the menu items and ingredients after successful addition.
   * - Displays an alert with the server's response or logs errors if the request fails.
   *
   * @async
   * @function addMenu
   * @param {MenuItem} addItem - The menu item to add.
   * @returns {Promise<void>} Resolves when the menu item is successfully added.
   * @throws {Error} If the network request fails.
   */
  async function addMenu(addItem: MenuItem) {
    console.log("Payload being sent to the server:", addItem);
    try {
      const response = await fetch(
        "https://project3-team3-rf8c.onrender.com/api/add-menu",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(addItem),
        }
      );

      const content = await response.json();

      if (!response.ok) {
        alert(content.error);
        throw new Error(content.error);
      }

      alert(content.message);
      getMenuItems();
      getIngredients();
    } catch (error) {
      console.error(error);
    }
  }

  /**
   * Updates an existing menu item on the server.
   *
   * - Sends a PUT request to the API with the updated menu item data.
   * - Refreshes the menu items and ingredients after successful update.
   * - Displays an alert with the server's response or logs errors if the request fails.
   *
   * @async
   * @function editMenu
   * @param {MenuItem} selectItem - The menu item to update.
   * @returns {Promise<void>} Resolves when the menu item is successfully updated.
   * @throws {Error} If the network request fails.
   */
  async function editMenu(selectItem: MenuItem) {
    try {
      const response = await fetch(
        "https://project3-team3-rf8c.onrender.com/api/update-menu",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(selectItem),
        }
      );

      const content = await response.json();

      if (!response.ok) {
        alert(content.error);
        throw new Error(content.error);
      }
      alert(content.message);
      getMenuItems();
      getIngredients();
    } catch (error) {
      console.error(error);
    }
  }

  const filteredMenuItems = menuItems.filter(
    (item) => item.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  /**
   * Updates the ingredient quantities for the selected menu item.
   *
   * - Modifies the quantity of the specified ingredient in the `selectedItem` state.
   *
   * @function handleIngredientChange
   * @param {number} ingredientId - The ID of the ingredient to update.
   * @param {number} change - The change in quantity (+1 or -1).
   * @returns {void}
   */
  const handleIngredientChange = (ingredientId: number, change: number) => {
    setSelectedItem((prevItem) => {
      const updatedIngredientList = prevItem.ingredientList.map(
        (ingredient) => {
          if (ingredient.id === ingredientId) {
            const newQuantity = Math.max(
              0,
              (ingredient.quantity || 0) + change
            );
            return { ...ingredient, quantity: newQuantity };
          }
          return ingredient;
        }
      );
      return { ...prevItem, ingredientList: updatedIngredientList };
    });
  };

  /**
   * Populates the form with the data of the selected menu item.
   *
   * - Combines the item's ingredient list with the full list of available ingredients.
   *
   * @function handleItemClick
   * @param {MenuItem} item - The menu item that was clicked.
   * @returns {void}
   */
  const handleItemClick = (item: MenuItem) => {
    const fullIngredientList = ingredientList.map((ingredient) => {
      const matchingIngredient = item.ingredientList.find(
        (i) => i.id === ingredient.id
      );
      return {
        ...ingredient,
        quantity: matchingIngredient ? matchingIngredient.quantity : 0,
      };
    });

    setSelectedItem({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      description: item.description,
      isActive: item.isActive,
      ingredientList: fullIngredientList,
    });
  };

  /**
   * Handles form input changes for the selected menu item.
   *
   * - Updates the `selectedItem` state with the changed value.
   * - Ensures price and other numeric fields cannot be negative.
   *
   * @function handleFormChange
   * @param {React.ChangeEvent<HTMLInputElement>} e - The input change event.
   * @returns {void}
   */
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setSelectedItem((prevItem) => {
      let newValue: any;

      if (type === "checkbox") {
        newValue = checked;
      } else if (name === "price") {
        newValue = parseFloat(value);

        if (newValue < 0) {
          alert("Price cannot be negative!");
          return prevItem;
        }
      } else {
        newValue = value;
      }

      return {
        ...prevItem,
        [name]: newValue,
      };
    });
  };

  /**
   * Submits the menu item form.
   *
   * - Validates required fields and ensures valid categories and non-negative values.
   * - Calls `addMenu` for new items or `editMenu` for existing items.
   *
   * @function handleSubmit
   * @returns {void}
   */
  const handleSubmit = () => {
    console.log("handleSubmit called");

    if (!selectedItem.name || !selectedItem.category) {
      alert("Please fill in all required fields");
      return;
    }

    if (selectedItem.price < 0) {
      alert("Number cannot be negative!");
      return;
    }

    selectedItem.category = selectedItem.category.toLowerCase();
    const validCategories = ["entree", "drink", "side", "extra"];
    if (!validCategories.includes(selectedItem.category)) {
      alert(
        "Invalid category. Please enter one of the following categories: Entree, Drink, Side, Extra."
      );
      return;
    }

    if (selectedItem.id) {
      editMenu(selectedItem);
    } else {
      addMenu(selectedItem);
    }
  };

  /**
   * Resets the form to its default state.
   *
   * - Clears the `selectedItem` state and resets the ingredient list quantities to 0.
   *
   * @function handleClear
   * @returns {void}
   */

  function handleClear() {
    setSelectedItem({
      id: "",
      name: "",
      price: 0,
      category: "",
      description: "",
      isActive: false,
      ingredientList: ingredientListRef.current.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: 0,
      })),
    });
    console.log(ingredientListRef.current);
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        !target.closest(".sidebar") &&
        !target.closest(".menu-item-btn") &&
        !target.closest(".category-button")
      ) {
        handleClear();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  if (!user || !user.isManager) return <Navigate to="/" replace />;
  return (
    <div className="container-fluid vh-100 d-flex p-0">
      <div
        className="col-9 justify-content-center"
        style={{ backgroundColor: "grey" }}
      >
        <Row className="d-flex justify-content-center mb-3">
          {/* Category Buttons */}
          <Button
            variant="secondary"
            onClick={() => setSelectedCategory("Entree")}
            className="category-button me-2"
            style={{ background: "#df2322" }}
          >
            Entree
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSelectedCategory("Side")}
            className="category-button me-2"
            style={{ background: "#df2322" }}
          >
            Side
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSelectedCategory("Drink")}
            className="category-button me-2"
            style={{ background: "#df2322" }}
          >
            Drink
          </Button>
          <Button
            variant="secondary"
            onClick={() => setSelectedCategory("Extra")}
            className="category-button me-2"
            style={{ background: "#df2322" }}
          >
            Extra
          </Button>
        </Row>

        <Col
          md={9}
          className="d-flex flex-wrap justify-content-center p-3"
          style={{ gap: "10px" }}
        >
          {filteredMenuItems.map((item) => (
            <Button
              key={item.id}
              variant="secondary"
              className="menu-item-btn m-2"
              onClick={() => handleItemClick(item)}
            >
              <div className="item-content">
                <span className="item-name">{item.name}</span>
                <span className="item-price">${item.price.toFixed(2)}</span>
              </div>
            </Button>
          ))}
        </Col>
      </div>

      <div
        ref={sidebarRef}
        className="sidebar col-3 p-3"
        style={{ backgroundColor: "white", overflowY: "scroll" }}
      >
        <h5>{selectedItem.id ? "Edit Menu Item" : "Create New Menu Item"}</h5>
        <Form>
          <Form.Group controlId="formName">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={selectedItem.name}
              onChange={handleFormChange}
              placeholder="Enter item name"
            />
          </Form.Group>

          <Form.Group controlId="formPrice">
            <Form.Label>Price</Form.Label>
            <Form.Control
              type="number"
              name="price"
              value={selectedItem.price}
              onChange={handleFormChange}
              placeholder="Enter item price"
            />
          </Form.Group>

          <Form.Group controlId="formDescription">
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={selectedItem.description}
              onChange={handleFormChange}
              placeholder="Enter item description"
            />
          </Form.Group>

          <Form.Group controlId="formCategory">
            <Form.Label>Category</Form.Label>
            <Form.Control
              type="text"
              name="category"
              value={selectedItem.category}
              onChange={handleFormChange}
              placeholder="Enter category"
            />
          </Form.Group>

          {/* Checkbox for Active Status */}
          <Form.Group controlId="formIsActive">
            <Form.Check
              type="checkbox"
              name="isActive"
              label="Active"
              checked={selectedItem.isActive}
              onChange={handleFormChange}
            />
          </Form.Group>

          {/* Ingredients Section */}
          <div
            className="mt-2 border border-secondary"
            style={{ maxHeight: "200px", overflowY: "scroll" }}
          >
            <div className="p-1">
              {selectedItem.ingredientList.length > 0 ? (
                selectedItem.ingredientList.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="d-flex justify-content-between align-items-center mb-2"
                  >
                    <span>
                      {ingredient.name} ({ingredient.quantity})
                    </span>
                    <div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleIngredientChange(ingredient.id, 1)}
                      >
                        +
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          handleIngredientChange(ingredient.id, -1)
                        }
                      >
                        -
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p>No ingredients available</p>
              )}
            </div>
          </div>

          <Button
            variant="primary"
            className="mt-3 w-100"
            onClick={handleSubmit}
          >
            {selectedItem.id ? "Update Item" : "Create Item"}
          </Button>
          <Button variant="danger" className="mt-3 w-100" onClick={handleClear}>
            Clear
          </Button>

          <Button
            variant="secondary"
            className="mt-3 w-100"
            onClick={() => navigate("/manager")}
          >
            Back
          </Button>
        </Form>
      </div>
    </div>
  );
};
