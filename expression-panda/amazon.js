/**
 * Express application for managing a restaurant system.
 *
 * - Handles endpoints for orders, menu management, inventory, employees, and reports.
 * - Integrates with PostgreSQL for database operations using `pg` module.
 * - Uses environment variables for configuration with `dotenv`.
 * - Supports cross-origin requests with `cors`.
 *
 * @module RestaurantSystem
 */

import express from "express";
import pg from "pg";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const { Pool } = pg;
const app = express();
app.use(cors());
app.use(express.json()); // Middleware to parse JSON bodies

const pool = new Pool({
  host: process.env.DB_HOST,
  database: process.env.DB_DATABASE,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
});
/**
 * Fetch orders for the kitchen or menu board.
 *
 * - `source=kitchen`: Returns orders with detailed item and ingredient information.
 * - `source=menu`: Returns basic order information for display on a menu board.
 *
 * @route GET /api/kitchenOrders
 * @query {string} source - The source requesting the orders (e.g., `kitchen`, `menu`).
 */
app.get("/api/kitchenOrders", async (req, res) => {
  try {
    const source = req.query.source || "";
    let orders = [];

    if (source === "kitchen") {
      const query = `
          SELECT 
            o.order_id AS order_id,
            o.order_status AS order_status,
            m.menu_item_name AS item_name,
            om.quantity_ordered AS item_quantity,
            inv.item_name AS ingredient_name,
            mi.quantity_needed AS ingredient_amount
          FROM orders o
          LEFT JOIN order_menu om ON o.order_id = om.order_id
          LEFT JOIN menu m ON om.menu_item_id = m.menu_item_id
          LEFT JOIN menu_ingredients mi ON om.menu_item_id = mi.menu_item_id
          LEFT JOIN inventory inv ON mi.inventory_id = inv.inventory_id
          WHERE o.order_status IN ('building', 'waiting')
          ORDER BY o.order_status ASC, o.order_id ASC`;

      const result = await pool.query(query);

      const ordersMap = {};

      result.rows.forEach((row) => {
        const {
          order_id,
          order_status,
          item_name,
          item_quantity,
          ingredient_name,
          ingredient_amount,
        } = row;

        if (!ordersMap[order_id]) {
          ordersMap[order_id] = {
            id: order_id,
            status: order_status,
            item: [],
          };
        }

        let item = ordersMap[order_id].item.find((i) => i.name === item_name);
        if (!item) {
          item = {
            name: item_name,
            amount: item_quantity,
            ingredient: [],
          };
          ordersMap[order_id].item.push(item);
        }

        item.ingredient.push({
          ingredientName: ingredient_name,
          amount: ingredient_amount,
        });
      });

      orders = Object.values(ordersMap);

      res.json(orders);
    } else if (source === "menu") {
      const query = `
          SELECT o.order_id, o.order_status
          FROM orders o
          WHERE o.order_status IN ('building', 'waiting')
            OR (o.order_status = 'complete' AND o.order_id = (
              SELECT MAX(order_id) FROM orders WHERE order_status = 'complete'
            ))
          ORDER BY
            CASE
              WHEN o.order_status = 'complete' AND o.order_id = (
                SELECT MAX(order_id) FROM orders WHERE order_status = 'complete'
              ) THEN 0
              ELSE 1
            END,
            o.order_status ASC,
            o.order_id ASC`;

      const result = await pool.query(query);

      orders = result.rows.map((row) => ({
        id: row.order_id,
        status: row.order_status,
      }));

      res.json(orders);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fetch active menu items.
 *
 * - Only includes items marked as `is_active`.
 *
 * @route GET /api/active-items
 */
app.get("/api/active-items", async (req, res) => {
  try {
    const query_res = await pool.query(
      "SELECT menu_item_id, menu_item_name, sales_price, menu_category FROM menu WHERE is_active = true;"
    );
    const activeItems = query_res.rows.map((row) => ({
      id: row.menu_item_id,
      name: row.menu_item_name,
      price: row.sales_price,
      category: row.menu_category,
    }));

    res.json(activeItems);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

/**
 * Fetch inventory usage for a date range.
 *
 * - Computes the total quantity of ingredients used between `startDate` and `endDate`.
 *
 * @route GET /api/getInventoryUsed
 * @query {string} startDate - The start date for the report.
 * @query {string} endDate - The end date for the report.
 */
app.get("/api/getInventoryUsed", async (req, res) => {
  const { startDate, endDate } = req.query;

  // Validate that startDate and endDate are provided
  if (!startDate || !endDate) {
    return res
      .status(400)
      .json({ error: "Start date and end date are required." });
  }

  const client = await pool.connect();

  try {
    const query = `
            SELECT 
                inventory.item_name, 
                SUM(order_menu.quantity_ordered * menu_ingredients.quantity_needed) AS total_quantity_used
            FROM orders
            JOIN order_menu ON orders.order_id = order_menu.order_id
            JOIN menu_ingredients ON order_menu.menu_item_id = menu_ingredients.menu_item_id
            JOIN inventory ON menu_ingredients.inventory_id = inventory.inventory_id
            WHERE orders.order_time BETWEEN $1 AND $2
            GROUP BY inventory.item_name
            ORDER BY total_quantity_used DESC;
        `;

    const result = await client.query(query, [startDate, endDate]);

    // Transform results into a usable format
    const inventoryItemsUsed = result.rows.map((row) => ({
      itemName: row.item_name,
      totalQuantityUsed: row.total_quantity_used,
    }));

    res.json(inventoryItemsUsed);
  } catch (error) {
    console.error("Error fetching inventory used:", error);
    res.status(500).json({ error: "Failed to fetch inventory usage report." });
  } finally {
    client.release();
  }
});

/**
 * Fetch all menu items with their ingredients.
 *
 * - Groups ingredients by menu item.
 *
 * @route GET /api/all-items
 */
app.get("/api/all-items", async (req, res) => {
  try {
    const query = `
            SELECT 
                m.menu_item_id, 
                m.menu_item_name, 
                m.sales_price, 
                m.menu_category,
                m.description,
                m.is_active,
                i.inventory_id,
                i.item_name,
                mi.quantity_needed
            FROM menu m
            LEFT JOIN menu_ingredients mi ON m.menu_item_id = mi.menu_item_id
            LEFT JOIN inventory i ON mi.inventory_id = i.inventory_id
        `;

    const query_res = await pool.query(query);

    // Grouping menu items with their ingredients
    const itemsMap = new Map();
    query_res.rows.forEach((row) => {
      if (!itemsMap.has(row.menu_item_id)) {
        itemsMap.set(row.menu_item_id, {
          id: row.menu_item_id,
          name: row.menu_item_name,
          price: row.sales_price,
          category: row.menu_category,
          description: row.description,
          isActive: row.is_active,
          ingredients: [],
        });
      }

      if (row.inventory_id) {
        itemsMap.get(row.menu_item_id).ingredients.push({
          id: row.inventory_id,
          name: row.item_name,
          quantity_used: row.quantity_needed,
        });
      }
    });

    const allItems = Array.from(itemsMap.values());
    console.log(allItems);
    res.json(allItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Fetch a range of orders based on date.
 *
 * - Filters orders between the provided `startDate` and `endDate`.
 *
 * @route GET /api/getRange
 * @query {string} startDate - The start date for the query.
 * @query {string} endDate - The end date for the query.
 */
app.get("/api/getRange", async (req, res) => {
  const { startDate, endDate } = req.query;

  const client = await pool.connect();

  // let orders;
  try {
    const ordersQuery = `SELECT * FROM orders WHERE order_time >= $1 AND order_time <= $2`;
    const orders = await client.query(ordersQuery, [startDate, endDate]);
    const allOrders = orders.rows.map((row) => ({
      orderID: row.order_id,
      employeeID: row.employee_id,
      orderTime: row.order_time,
      orderTotal: row.order_total,
    }));
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ error: "Failed to get Order Date Range" });
  } finally {
    client.release();
  }
});

/**
 * Fetch sales reports (X Report).
 *
 * - Aggregates sales by hour for the current day.
 *
 * @route GET /api/getXReport
 */
app.get("/api/getXReport", async (req, res) => {
  try {
    const query_res =
      await pool.query(`SELECT DATE_TRUNC('hour', order_time) AS sales_hour, SUM(order_total) 
            AS total_sales FROM orders WHERE order_time >= CURRENT_DATE AND order_time < CURRENT_DATE + INTERVAL '1 day' 
            GROUP BY DATE_TRUNC('hour', order_time) ORDER BY sales_hour`);
    // const orders = await client.query(ordersQuery, [startDate, endDate]);
    const allOrders = query_res.rows.map((row) => ({
      salesHour: row.sales_hour,
      totalSales: row.total_sales,
    }));
    res.json(allOrders);
  } catch (error) {
    res.status(500).json({ error: "Failed to get X Report" });
  }
});

/**
 * Fetch sales reports (Z Report).
 *
 * - Retrieves the total orders and sales for the current day.
 *
 * @route GET /api/getZReport
 */
app.get("/api/getZReport", async (req, res) => {
  // const { startDate, endDate } = req.query;

  const client = await pool.connect();

  // let orders;
  try {
    const query_res = await client.query(
      "SELECT date, total_orders, total_sales FROM daily_totals WHERE date = CURRENT_DATE"
    );

    const zReportItems = query_res.rows.map((row) => ({
      date: row.date,
      totalOrders: row.total_orders,
      totalSales: row.total_sales,
    }));

    res.json(zReportItems);


    await client.query("TRUNCATE TABLE daily_totals");


  } catch (error) {
    res.status(500).json({ error: "Failed to get or truncate Z Report" });


  } finally {
    client.release();
  }
});

/**
 * Add a new menu item.
 *
 * - Inserts the menu item and its ingredients into the database.
 *
 * @route POST /api/add-menu
 * @body {object} menuItem - The menu item to add.
 */
app.post("/api/add-menu", async (req, res) => {
  const { name, price, category, description, isActive, ingredientList } =
    req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    let menuResult;
    if (!description) {
      const menuQuery = `INSERT INTO menu (menu_item_name, sales_price, menu_category, is_active) VALUES ($1, $2, $3, $4) RETURNING menu_item_id`;
      menuResult = await client.query(menuQuery, [
        String(name),
        Number(price),
        String(category),
        Boolean(isActive),
      ]);
    } else {
      const menuQuery = `INSERT INTO menu (menu_item_name, sales_price, description, menu_category, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING menu_item_id`;
      menuResult = await client.query(menuQuery, [
        String(name),
        Number(price),
        String(description),
        String(category),
        Boolean(isActive),
      ]);
    }

    const itemId = menuResult.rows[0].menu_item_id;
    const ingredientQuery =
      "INSERT INTO menu_ingredients (menu_item_id, inventory_id, quantity_needed) VALUES ($1, $2, $3)";

    for (const ingredient of ingredientList) {
      if (ingredient.quantity > 0)
        await client.query(ingredientQuery, [
          Number(itemId),
          Number(ingredient.id),
          Number(ingredient.quantity),
        ]);
    }

    await client.query("COMMIT");
    res
      .status(200)
      .json({ message: "Menu item and ingredients added successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to add menu item and ingredients" });
  } finally {
    client.release();
  }
});

/**
 * Update a menu item and its ingredients.
 *
 * - Updates the details of an existing menu item, such as name, price, description, category, and active status.
 * - Modifies or replaces the ingredients associated with the menu item.
 *
 * @route PUT /api/update-menu
 * @body {object} menuToChange - The menu item details to update.
 * @body {number} menuToChange.id - The ID of the menu item to update.
 * @body {string} [menuToChange.name] - The updated name of the menu item.
 * @body {number} [menuToChange.price] - The updated sales price of the menu item.
 * @body {string} [menuToChange.category] - The updated category of the menu item.
 * @body {string} [menuToChange.description] - The updated description of the menu item.
 * @body {boolean} [menuToChange.isActive] - Whether the menu item is active.
 * @body {Array} menuToChange.ingredientList - The updated list of ingredients.
 * @body {number} menuToChange.ingredientList.id - The ID of the ingredient.
 * @body {number} menuToChange.ingredientList.quantity - The required quantity of the ingredient.
 */
app.put("/api/update-menu", async (req, res) => {
  const menuToChange = req.body;
  let i = 1;
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    let updateMenu = "UPDATE menu SET ";
    const parameters = [];

    if (menuToChange.name != null) {
      updateMenu += "menu_item_name = $" + (i++).toString();
      parameters.push(String(menuToChange.name));
    }

    if (menuToChange.price != null) {
      updateMenu +=
        (i === 1 ? "" : ", ") + "sales_price = $" + (i++).toString();
      parameters.push(Number(menuToChange.price).toFixed(2));
    }

    if (menuToChange.category != null) {
      updateMenu +=
        (i === 1 ? "" : ", ") + "menu_category = $" + (i++).toString();
      parameters.push(String(menuToChange.category));
    }

    if (menuToChange.description !== undefined) {
      updateMenu +=
        (i === 1 ? "" : ", ") + "description = $" + (i++).toString();
      parameters.push(String(menuToChange.description));
    }

    if (menuToChange.isActive !== undefined) {
      updateMenu += (i === 1 ? "" : ", ") + "is_active = $" + (i++).toString();
      parameters.push(Boolean(menuToChange.isActive));
    }

    updateMenu += " WHERE menu_item_id = $" + i;
    parameters.push(Number(menuToChange.id));

    await client.query(updateMenu, parameters);

    if (menuToChange.ingredientList.length > 0) {
      await client.query(
        "DELETE FROM menu_ingredients WHERE menu_item_id = $1",
        [menuToChange.id]
      );

      const ingredientQuery =
        "INSERT INTO menu_ingredients (menu_item_id, inventory_id, quantity_needed) VALUES ($1, $2, $3)";
      for (const ingredient of menuToChange.ingredientList) {
        if (ingredient.quantity === 0) continue;
        await client.query(ingredientQuery, [
          menuToChange.id,
          ingredient.id,
          ingredient.quantity,
        ]);
      }
    }

    await client.query("COMMIT");
    res
      .status(201)
      .json({ message: "Successfully updated menu item and ingredients" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: error });
  } finally {
    client.release();
  }
});

/**
 * Login endpoint for employee authentication.
 *
 * - Verifies employee credentials and returns employee data if valid.
 * - Only active employees are allowed to log in.
 *
 * @route POST /api/login
 * @body {string} username - The employee's username.
 * @body {string} password - The employee's password.
 */
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const query =
      "SELECT * FROM employees WHERE username = $1 AND password_hash = $2 AND is_active = true";
    const values = [String(username), String(password)];

    const result = await pool.query(query, values);
    if (result.rows.length > 0) {
      const employee = result.rows[0];
      // Return employee data if login is successful
      return res.status(200).json({
        id: employee.employee_id,
        firstName: employee.first_name,
        isEmployee: true,
        isManager: employee.is_manager,
      });
    } else {
      res.status(401).json({ message: "Invalid credentials" }); // Unauthorized
    }
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error });
  }
});

app.post("/api/google-login", async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Missing token" });
  }

  try {
    const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
    if (!googleRes.ok) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const googleUser = await googleRes.json();
    const client = await pool.connect();

    try {
      const checkUserQuery = `SELECT * FROM employees WHERE username = $1 AND is_active = true`;
      const values = [googleUser.email];
      const result = await client.query(checkUserQuery, values);

      let employeeData;

      if (result.rows.length > 0) {
        const employee = result.rows[0];
        employeeData = {
          id: employee.employee_id,
          firstName: employee.first_name,
          lastName: employee.last_name,
          isEmployee: employee.is_employee,
          isManager: employee.is_manager,
        };
      } else {
        const insertQuery = `
          INSERT INTO employees (first_name, last_name, username, password_hash, is_manager, is_active, is_employee)
          VALUES ($1, $2, $3, $4, false, true, false)
          RETURNING employee_id
        `;

        const insertValues = [
          googleUser.given_name,
          googleUser.family_name,
          googleUser.email,
          null
        ];

        const insertResult = await client.query(insertQuery, insertValues);

        employeeData = {
          id: insertResult.rows[0].employee_id,
          firstName: googleUser.given_name,
          lastName: googleUser.family_name,
          isEmployee: false,
          isManager: false,
        };
      }

      return res.status(200).json(employeeData);
    } catch (error) {
      console.error("DB error:", error);
      res.status(500).json({ error: "Database error" });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Google login error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * Place a new order.
 *
 * - Checks if sufficient inventory exists before placing the order.
 * - Adds the order and its items to the database.
 *
 * @route POST /api/placeOrder
 * @body {object} order - The order details, including employee ID and item amounts.
 * @throws {Error} If inventory is insufficient or another issue occurs.
 */
app.post("/api/placeOrder", async (req, res) => {
  const order = req.body;
  const itemOrdered = order.itemAmount;

  const client = await pool.connect();
  try {
    const itemLowOrIngredient = await checkSufficientIngredients(itemOrdered); // name of item low or list of ingredient if no low
    if (!itemLowOrIngredient.low) {
      await client.query("BEGIN");

      const addOrderStatement =
        "INSERT INTO orders (employee_id, order_time, order_total, order_status) VALUES ($1, $2, $3, $4) RETURNING order_id";
      const addOrderMenu =
        "INSERT INTO order_menu (order_id, menu_item_id, quantity_ordered) VALUES ($1, $2, $3)";
      const checkBuilding = await client.query(
        "SELECT * FROM orders WHERE order_status = 'building'"
      );
      const employeeId =
        order.emID;

      const resOrder = await client.query(addOrderStatement, [
        Number(employeeId),
        new Date(),
        Number(order.total),
        checkBuilding.rows.length > 0 ? "waiting" : "building",
      ]);
      const orderID = resOrder.rows[0].order_id;

      for (const selectedItem of itemOrdered) {
        await client.query(addOrderMenu, [
          Number(orderID),
          Number(selectedItem.id),
          Number(selectedItem.quantity),
        ]);
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Order placed successfully, your number is: " + orderID,
      });
    } else {
      res.status(400).json({
        error: `Low Stock Alert: The ingredient ${itemLowOrIngredient.second.ingredientName
          } is being ordered in ${itemLowOrIngredient.second.menuItemsUsing.join(
            ", "
          )}, which uses total of ${itemLowOrIngredient.second.neededStock
          }, and there is ${itemLowOrIngredient.second.currStock} available.`,
      });
    }
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Error placing order:", error);
    res.status(500).json({ error: error });
  } finally {
    client.release();
  }
});

/**
 * Check inventory for sufficient ingredients.
 *
 * - Cross-checks ordered items against inventory stock levels.
 * - If sufficient, returns the ingredient list for the kitchen.
 * - If insufficient, returns the item or ingredient causing the shortage.
 *
 * @function checkSufficientIngredients
 * @param {Array} itemOrdered - The items being ordered.
 * @returns {object} Result containing either sufficient ingredients or a low stock alert.
 */
async function checkSufficientIngredients(itemOrdered) {
  // Prepare data for SQL query
  const itemIds = itemOrdered.map((item) => Number(item.id));
  const itemNames = itemOrdered.map((item) => String(item.name));
  const itemQuantities = itemOrdered.map((item) => Number(item.quantity));

  // SQL query to retrieve ingredients, their quantities, and stock levels
  const query = `
    WITH oi AS (
        SELECT 
            item_id,
            menu_name, 
            quantity
        FROM 
            unnest($1::int[], $2::text[], $3::int[]) AS t(item_id, menu_name, quantity)
    )
    SELECT 
        mi.menu_item_id,
        mi.inventory_id,
        mi.quantity_needed * oi.quantity AS total_quantity_needed,
        i.item_name,
        i.stock_level,
        oi.item_id,
        oi.menu_name,
        oi.quantity
    FROM 
        menu_ingredients mi
    JOIN 
        inventory i ON mi.inventory_id = i.inventory_id
    JOIN 
        oi ON mi.menu_item_id = oi.item_id;
    `;

  const res = await pool.query(query, [itemIds, itemNames, itemQuantities]);

  // Maps for tracking low stock ingredients and ingredient usage per item
  let allIngredientsUsed = new Map();
  let itemToIngredientMap = new Map();

  // Initialize itemToIngredientMap with ordered items
  itemOrdered.forEach((selectedItem) => {
    itemToIngredientMap.set(selectedItem.id, {
      name: selectedItem.name,
      amount: selectedItem.quantity,
      ingredient: [],
    });
  });

  // Process the query result
  res.rows.forEach((row) => {
    const {
      menu_item_id,
      inventory_id,
      total_quantity_needed,
      item_name,
      menu_name,
      quantity,
    } = row;
    const temp = allIngredientsUsed.get(item_name) || {
      total: 0,
      itemUsed: [],
    };
    allIngredientsUsed.set(item_name, {
      total: temp.total + total_quantity_needed,
      itemUsed: [...temp.itemUsed, menu_name + " x" + quantity.toString()], // Add the new menu_name to itemUsed
    });

    // Update the itemToIngredientMap to send to kitchen
    itemToIngredientMap.get(menu_item_id).ingredient.push({
      ingredientName: item_name,
      amount: total_quantity_needed,
    });
  });

  for (const row of res.rows) {
    const { item_name, stock_level } = row;
    // Check if stock is less than the needed quantity
    if (stock_level < allIngredientsUsed.get(item_name).total) {
      // Return the low stock info and exit the loop
      return {
        low: true,
        second: {
          ingredientName: item_name,
          currStock: stock_level,
          neededStock: allIngredientsUsed.get(item_name).total,
          menuItemsUsing: allIngredientsUsed.get(item_name).itemUsed,
        },
      };
    }
  }
  // If no ingredients are low on stock, return the itemToIngredientMap as a list
  return { low: false, second: Array.from(itemToIngredientMap.values()) };
}

/**
 * Get all inventory items.
 *
 * - Fetches a list of all inventory items, including stock levels and costs.
 *
 * @route GET /api/inventory
 * @returns {Array} inventory - A list of inventory items.
 * @returns {number} inventory.id - The inventory item ID.
 * @returns {string} inventory.name - The name of the inventory item.
 * @returns {number} inventory.stockLevel - The current stock level.
 * @returns {number} inventory.cost - The purchase price of the inventory item.
 */
app.get("/api/inventory", async (req, res) => {
  const query_res = await pool.query("SELECT * FROM inventory");

  const ingredients = query_res.rows.map((row) => ({
    id: row.inventory_id,
    name: row.item_name,
    stockLevel: row.stock_level,
    cost: row.purchase_price,
  }));

  res.status(200).json(ingredients);
});

/**
 * Update inventory details.
 *
 * - Allows updating the name, stock level, and cost of inventory items.
 *
 * @route PUT /api/update-inventory
 * @body {object} itemToChange - The inventory item with updated details.
 */
app.put("/api/update-inventory", async (req, res) => {
  const itemToChange = req.body;
  let i = 1;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let updateInventory = "UPDATE inventory SET ";
    const parameter = [];

    if (itemToChange.name != null) {
      updateInventory += "item_name = $" + (i++).toString();
      parameter.push(String(itemToChange.name));
    }

    if (itemToChange.stockLevel != null) {
      updateInventory +=
        (i == 1 ? "" : ", ") + "stock_level = $" + (i++).toString();
      parameter.push(Number(itemToChange.stockLevel));
    }

    if (itemToChange.cost != null) {
      updateInventory +=
        (i == 1 ? "" : ", ") +
        "purchase_price = $" +
        (i++).toString().toString();
      parameter.push(Number(itemToChange.cost).toFixed(2));
    }

    updateInventory += " WHERE inventory_id = $" + i;
    parameter.push(Number(itemToChange.id));

    await client.query(updateInventory, parameter);
    await client.query("COMMIT");

    res.status(201).json({ message: "Successfully update inventory" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ error: error });
  } finally {
    client.release();
  }
});

/**
 * Add a new inventory item.
 *
 * - Inserts a new inventory item with its details.
 *
 * @route POST /api/add-inventory
 * @body {object} newInventory - The inventory item to add.
 */
app.post("/api/add-inventory", async (req, res) => {
  const { name, stockLevel, cost } = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const addInventory =
      "INSERT INTO inventory (item_name, stock_level, purchase_price) VALUES ($1, $2, $3)";
    const parameter = [
      String(name),
      Number(stockLevel),
      Number(cost).toFixed(2),
    ];

    await client.query(addInventory, parameter);
    await client.query("COMMIT");

    res.status(201).json({ message: "Successfully add item." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ error: error });
  }
});

/**
 * Get a list of employees.
 *
 * - Fetches all employees with their basic details.
 *
 * @route GET /api/employees
 */
app.get("/api/employees", async (req, res) => {
  const query_res = await pool.query(
    "SELECT employee_id, first_name, last_name, username, is_manager, is_active FROM employees WHERE is_employee = true"
  );

  const employees = query_res.rows.map((row) => ({
    id: row.employee_id,
    firstName: row.first_name,
    lastName: row.last_name,
    username: row.username,
    isManager: row.is_manager,
    isActive: row.is_active,
  }));

  res.status(200).json(employees);
});

/**
 * Add a new employee.
 *
 * - Adds a new employee to the system with details like name, username, and role.
 *
 * @route POST /api/add-employee
 * @body {object} employee - The employee details.
 * @body {string} employee.firstName - The first name of the employee.
 * @body {string} employee.lastName - The last name of the employee.
 * @body {string} employee.username - The username for the employee.
 * @body {string} employee.password - The hashed password for the employee.
 * @body {boolean} employee.isManager - Whether the employee has a managerial role.
 * @body {boolean} employee.isActive - Whether the employee is currently active.
 */
app.post("/api/add-employee", async (req, res) => {
  const employee = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const addEmployee =
      "INSERT INTO employees (first_name, last_name, username, password_hash, is_manager, is_active, is_employee) VALUES ($1, $2, $3, $4, $5, $6, true)";
    const parameter = [
      String(employee.firstName),
      String(employee.lastName),
      String(employee.username),
      String(employee.password),
      Boolean(employee.isManager),
      Boolean(employee.isActive),
    ];
    await client.query(addEmployee, parameter);
    await client.query("COMMIT");

    res.status(201).json({ message: "Successfully add employee." });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ error: error });
  } finally {
    client.release();
  }
});

/**
 * Update an employee's details.
 *
 * - Modifies details such as name, username, password, role, and active status of an existing employee.
 *
 * @route PUT /api/update-employee
 * @body {object} employee - The employee details to update.
 * @body {number} employee.id - The ID of the employee to update.
 * @body {string} [employee.firstName] - The updated first name of the employee.
 * @body {string} [employee.lastName] - The updated last name of the employee.
 * @body {string} [employee.username] - The updated username for the employee.
 * @body {string} [employee.password] - The updated hashed password for the employee.
 * @body {boolean} [employee.isManager] - Whether the employee is a manager.
 * @body {boolean} [employee.isActive] - Whether the employee is currently active.
 */
app.put("/api/update-employee", async (req, res) => {
  const employee = req.body;
  let i = 1;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let updateEmployee = "UPDATE employees SET ";
    const parameter = [];

    if (employee.firstName != null) {
      updateEmployee += "first_name = $" + (i++).toString();
      parameter.push(String(employee.firstName));
    }

    if (employee.lastName != null) {
      updateEmployee +=
        (i == 1 ? "" : ", ") + "last_name = $" + (i++).toString();
      parameter.push(String(employee.lastName));
    }

    if (employee.username != null) {
      updateEmployee +=
        (i == 1 ? "" : ", ") + "username = $" + (i++).toString();
      parameter.push(String(employee.username));
    }

    if (employee.password != null) {
      updateEmployee +=
        (i == 1 ? "" : ", ") + "password_hash = $" + (i++).toString();
      parameter.push(String(employee.password));
    }

    if (employee.isManager != null) {
      updateEmployee +=
        (i == 1 ? "" : ", ") + "is_manager = $" + (i++).toString();
      parameter.push(Boolean(employee.isManager));
    }

    if (employee.isActive != null) {
      updateEmployee +=
        (i == 1 ? "" : ", ") + "is_active = $" + (i++).toString();
      parameter.push(Boolean(employee.isActive));
    }

    updateEmployee += " WHERE employee_id = $" + i;
    parameter.push(Number(employee.id));

    await client.query(updateEmployee, parameter);
    await client.query("COMMIT");

    res.status(201).json({ message: "Successfully update employee" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.log(error);
    res.status(500).json({ error: error });
  } finally {
    client.release();
  }
});

/**
 * Update order statuses in the kitchen.
 *
 * - Sets the current "building" order to "complete" and the next "waiting" order to "building".
 *
 * @route PUT /api/kitchenNext
 */
app.put("/api/kitchenNext", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Combined query to handle both the 'complete' and 'building' updates
    const updateOrderQuery = `
            WITH next_order AS (
            SELECT order_id
            FROM orders
            WHERE order_status = 'waiting'
            ORDER BY order_id ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED  -- Lock the row to avoid race conditions
        ), building_order AS (
            SELECT order_id
            FROM orders
            WHERE order_status = 'building'
            ORDER BY order_id ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED  -- Lock the row to avoid race conditions
        )
        UPDATE orders
        SET order_status = CASE
            WHEN order_id = (SELECT order_id FROM building_order) THEN 'complete'
            WHEN order_id = (SELECT order_id FROM next_order) THEN 'building'
            ELSE order_status  -- Keep the status unchanged for other orders
        END
        WHERE order_id IN (SELECT order_id FROM building_order UNION SELECT order_id FROM next_order);  
        `;

    // Execute the combined update query
    await client.query(updateOrderQuery);

    await client.query("COMMIT");
    res.status(200).send({ message: "Order status updated successfully" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    res.status(500).json({ error: "Failed to update order statuses" });
  } finally {
    client.release();
  }
});

/**
 * Fetch current weather information.
 *
 * - Integrates with the OpenWeather API to fetch weather details.
 *
 * @route GET /api/weather
 */
app.post("/api/weather", async (req, res) => {
  try {
    // Retrieve latitude and longitude from the request body
    const { latitude, longitude } = req.body;

    // Fetch weather data from OpenWeather API
    const weatherURL = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.WEATHER_API}&units=imperial`;
    const response = await fetch(weatherURL);

    if (!response.ok) {
      return res
        .status(response.status)
        .json({ error: "Failed to fetch weather data" });
    }

    const weatherData = await response.json();

    // Format and send the result
    const result = {
      location: weatherData.name,
      temperature: weatherData.main.temp,
      feelsLike: weatherData.main.feels_like,
      description: weatherData.weather[0].description,
      humidity: weatherData.main.humidity,
      windSpeed: weatherData.wind.speed,
      icon: weatherData.weather[0].icon,
    };

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await pool.end();
  console.log("Application successfully shutdown");
  process.exit(0);
});

app.listen(8080, "0.0.0.0", () => {
  console.log("Server running on localhost:" + 8080);
});
