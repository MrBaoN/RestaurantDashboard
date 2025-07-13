import React, { useState, useEffect, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import {
  Navbar as BootstrapNavbar,
  Nav,
  NavDropdown,
  Container,
  Button,
  Modal,
  Offcanvas,
  ListGroup,
  FormControl, // <-- Import this for quantity input
} from "react-bootstrap";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useCart } from "./CartContext";

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

/**
 * Navbar component.
 *
 * - A responsive nav bar with:
 *   1) Weather info
 *   2) User login/logout
 *   3) Manager/Employee links (with confirm nav)
 *   4) Google login for customers
 *   5) Offcanvas Cart system (hidden if user.id != null)
 *   6) Quantity adjustment for each item
 */
export const Navbar: React.FC = () => {
  // --- Auth + Navigate ---
  const {
    user,
    login,
    logout,
    showLoginModal,
    openLoginModal,
    closeLoginModal,
  } = useAuth();
  const navigate = useNavigate();

  // --- Weather ---
  const [weather, setWeather] = useState<WeatherData | null>(null);

  // --- Navigation Confirm Modal ---
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [navigatePath, setNavigatePath] = useState("");

  // --- Login Form State ---
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // --- Cart Offcanvas ---
  const [showCart, setShowCart] = useState(false);

  // Cart actions from context, including setQuantity
  const {
    selectedItems,
    removeItem,
    clearOrder,
    setQuantity,
    subtotal,
    tax,
    total,
    placeOrder,
  } = useCart();

  /* =============================
   * FETCH WEATHER
   * ============================= */
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user location
        const getLocation = (): Promise<GeolocationPosition> =>
          new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("Geolocation is not supported."));
            }
            navigator.geolocation.getCurrentPosition(
              (position) => resolve(position),
              (error) => reject(error)
            );
          });

        const position = await getLocation();
        const { latitude, longitude } = position.coords;

        // Fetch weather data
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND}/api/weather`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude, longitude }),
          }
        );
        if (!response.ok) throw new Error("Failed to fetch weather data");
        const data = await response.json();

        setWeather({
          temperature: Number(data.temperature),
          description: data.description,
          icon: data.icon,
        });
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    };
    fetchWeather();
  }, []);

  /* ============================
   *  CONFIRM NAVIGATION MODAL
   * ============================ */
  const handleConfirmNavigation = (path: string) => {
    setNavigatePath(path);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    navigate(navigatePath);
  };

  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  /* ===============
   *  LOGIN LOGIC
   * =============== */
  const openLogin = () => {
    setUsername("");
    setPassword("");
    setError("");
    openLoginModal();
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND}/api/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );
      if (!response.ok) {
        throw new Error("Login failed. Please check your credentials.");
      }
      const employee = await response.json();
      console.log("Successful Login! Welcome " + employee.firstName);

      login(employee);
      closeLoginModal();
    } catch (error) {
      setError((error as Error).message);
    }
  };

  // Google login for customers
  const handleGoogleLoginSuccess = (response: any) => {
    console.log("Google Login Success:", response);
    const userData: any = jwtDecode(response.credential);
    const employeeData = {
      id: null, // indicates a "customer"
      firstName: userData.given_name,
      lastName: userData.family_name,
      isEmployee: false,
      isManager: false,
    };
    login(employeeData);
    closeLoginModal();
  };

  const handleGoogleLoginFailure = () => {
    setError("Google login failed. Please try again.");
  };

  /* ================
   * CART CHECKOUT
   * ================ */
  const handleCheckoutClick = async () => {
    // If no user, show login
    if (!user) {
      openLoginModal();
      return;
    }
    try {
      await placeOrder(user.id);
      alert("Order placed successfully!");
      setShowCart(false);
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <>
      <BootstrapNavbar bg="dark" variant="dark" expand="lg">
        <Container>
          <BootstrapNavbar.Brand as={Link} to="/home">
            <img
              src="/logo.png"
              alt="expression_panda"
              width={30}
              height={24}
              className="d-inline-block align-text-top"
            />
            {"  "}Expression Panda
          </BootstrapNavbar.Brand>

          <BootstrapNavbar.Toggle aria-controls="navbarSupportedContent" />
          <BootstrapNavbar.Collapse id="navbarSupportedContent">
            {/* Navigation Links */}
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/customer">
                Order
              </Nav.Link>
            </Nav>

            {/* Weather Display */}
            {weather && (
              <div className="d-flex align-items-center text-light me-4">
                <img
                  src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
                  alt={weather.description}
                  width={30}
                  height={30}
                  className="me-2"
                />
                <span>{Math.round(weather.temperature)}°F</span>
              </div>
            )}

            {/* 
              CART BUTTON -> OFFCANVAS 
              Only render if user is NOT logged in or user.id is null
            */}
            {(!user || user.id === null) && (
              <Nav>
                <Nav.Link
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowCart(true)}
                >
                  Cart ({selectedItems.length})
                </Nav.Link>
              </Nav>
            )}

            {/* USER DROPDOWN or LOGIN */}
            {user ? (
              <Nav>
                <NavDropdown
                  title={user.firstName}
                  id="userDropdown"
                  align="end"
                >
                  {user.isManager ? (
                    <NavDropdown.Item as={Link} to="/manager">
                      Manager
                    </NavDropdown.Item>
                  ) : user.isEmployee ? (
                    <>
                      <NavDropdown.Item as={Link} to="/cashier">
                        Cashier
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        onClick={() => handleConfirmNavigation("/kitchen")}
                      >
                        Kitchen
                      </NavDropdown.Item>
                      <NavDropdown.Item
                        onClick={() => handleConfirmNavigation("/menu")}
                      >
                        Menu Board
                      </NavDropdown.Item>
                    </>
                  ) : null}
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </Nav>
            ) : (
              <Nav>
                <Nav.Link onClick={openLogin}>Login</Nav.Link>
              </Nav>
            )}
          </BootstrapNavbar.Collapse>
        </Container>
      </BootstrapNavbar>

      {/* OFFCANVAS CART */}
      <Offcanvas
        show={showCart}
        onHide={() => setShowCart(false)}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Cart ({selectedItems.length})</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {selectedItems.length === 0 ? (
            <p>Your cart is empty.</p>
          ) : (
            <>
              <ListGroup variant="flush" className="mb-3">
                {selectedItems.map((item, index) => (
                  <ListGroup.Item
                    key={index}
                    className="d-flex justify-content-between align-items-center"
                  >
                    {/* Item Info */}
                    <div>
                      <strong>{item.name}</strong>
                      <br />${item.price.toFixed(2)}
                    </div>

                    {/* Controls: quantity input + remove button */}
                    <div className="d-flex align-items-center">
                      <FormControl
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => {
                          const newQty = parseInt(e.target.value, 10) || 1;
                          setQuantity(index, newQty);
                        }}
                        style={{
                          width: "60px",
                          textAlign: "center",
                          marginRight: "10px",
                        }}
                      />
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>

              <div className="mb-2">
                <p>Subtotal: ${subtotal.toFixed(2)}</p>
                <p>Tax: ${tax.toFixed(2)}</p>
                <h5>Total: ${total.toFixed(2)}</h5>
              </div>

              <div className="d-flex justify-content-between">
                <Button variant="secondary" onClick={clearOrder}>
                  Clear Cart
                </Button>
                <Button variant="primary" onClick={handleCheckoutClick}>
                  Checkout
                </Button>
              </div>
            </>
          )}
        </Offcanvas.Body>
      </Offcanvas>

      {/* CONFIRM NAVIGATION MODAL */}
      <Modal show={showConfirmModal} onHide={handleCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Navigation</Modal.Title>
        </Modal.Header>
        <Modal.Body>Are you sure you want to navigate to this page?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            No
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* LOGIN MODAL */}
      <Modal show={showLoginModal} onHide={closeLoginModal}>
        <Modal.Header closeButton>
          <Modal.Title>Login</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <h5>Employee Login</h5>
            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && <p className="text-danger">{error}</p>}
              <button type="submit" className="btn btn-success btn-block">
                Login
              </button>
            </form>

            <hr />
            <h5>Customer Login</h5>
            <div className="mt-3">
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginFailure}
              />
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default Navbar;
