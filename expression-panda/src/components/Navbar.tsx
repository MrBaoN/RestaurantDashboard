import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from './AuthContext';
import { Navbar as BootstrapNavbar, Nav, NavDropdown, Container, Button, Modal } from 'react-bootstrap';
import { GoogleLogin } from '@react-oauth/google';
import {jwtDecode} from 'jwt-decode';

interface WeatherData {
  temperature: number;
  description: string;
  icon: string;
}

/**
 * Navbar component.
 *
 * - A responsive navigation bar that includes links, weather information, and user authentication functionality.
 * - Provides conditional rendering of navigation options and dropdowns based on the user's role.
 * - Displays modals for login and navigation confirmation.
 *
 * @component
 * @returns {JSX.Element} The rendered navigation bar with weather, user authentication, and navigation modals.
 */
export const Navbar: React.FC = () => {
  const { user, login, logout, openLoginModal, showLoginModal, closeLoginModal } = useAuth();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const navigate = useNavigate();

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [navigatePath, setNavigatePath] = useState('');

  /**
   * Opens the login modal and resets login form states.
   *
   * @function openLogin
   * @returns {void}
   */
  const openLogin = () => {
    setUsername('');
    setPassword('');
    setError('');
    openLoginModal();
  };

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  /**
   * Fetches weather data and updates the weather state.
   *
   * - Makes an API call to retrieve current weather details.
   * - Updates the weather state with temperature, description, and icon.
   * - Logs errors if the fetch operation fails.
   *
   * @function fetchWeather
   * @returns {Promise<void>} Resolves when the weather data is fetched and set in state.
   */
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Get user's current location
        const getLocation = (): Promise<GeolocationPosition> =>
          new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
              reject(new Error("Geolocation is not supported by your browser."));
            }
            navigator.geolocation.getCurrentPosition(
              (position) => resolve(position),
              (error) => reject(error)
            );
          });
    
        const position = await getLocation();
        console.log(position);
        const { latitude, longitude } = position.coords;
    
        // Fetch weather data for the user's location
        const response = await fetch("https://middleware-04w7.onrender.com/api/weather", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude,
            longitude,
          }),
        });
    
        if (response.ok) {
          const data = await response.json();
          console.log("Weather data:", data);
          setWeather({
            temperature: Number(data.temperature),
            description: data.description,
            icon: data.icon,
          });
        } else {
          console.error("Failed to fetch weather data");
        }
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    };
    fetchWeather();
  }, []);

  /**
   * Handles navigation that requires confirmation.
   *
   * - Opens a confirmation modal before navigating to a specified path.
   *
   * @function handleConfirmNavigation
   * @param {string} path - The path to navigate to after confirmation.
   * @returns {void}
   */
  const handleConfirmNavigation = (path: string) => {
    setNavigatePath(path);
    setShowConfirmModal(true);
  };

  /**
   * Confirms navigation and redirects the user to the specified path.
   *
   * - Closes the confirmation modal.
   * - Navigates to the previously specified path.
   *
   * @function handleConfirm
   * @returns {void}
   */
  const handleConfirm = () => {
    setShowConfirmModal(false);
    navigate(navigatePath);
  };

  /**
   * Cancels the navigation action and closes the confirmation modal.
   *
   * @function handleCancel
   * @returns {void}
   */
  const handleCancel = () => {
    setShowConfirmModal(false);
  };

  /**
   * Handles the submission of the login form.
   *
   * - Sends login credentials to the server for authentication.
   * - Updates the user state and closes the login modal upon successful login.
   * - Displays an error message if the login fails.
   *
   * @function handleLoginSubmit
   * @param {React.FormEvent} e - The form submission event.
   * @returns {Promise<void>} Resolves when the login process completes.
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('https://middleware-04w7.onrender.com/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

        if (!response.ok) {
          throw new Error('Login failed. Please check your credentials.');
        }

        const employee = await response.json();
        console.log("Successful Login! Welcome " + employee.firstName);

        login(employee);
        closeLoginModal();
      } catch (error) {
        setError((error as Error).message);
    }
  };

  /**
   * Handles a successful Google login.
   *
   * - Decodes the Google credential to retrieve user data.
   * - Logs in the user and updates the user state.
   * - Closes the login modal upon successful login.
   *
   * @function handleGoogleLoginSuccess
   * @param {any} response - The response object returned by the Google Login API.
   * @returns {void}
   */
  const handleGoogleLoginSuccess = (response: any) => {
    console.log("Google Login Success:", response);
    const userData: any = jwtDecode(response.credential);
    const employeeData = {
      id: null,
      firstName: userData.given_name,
      lastName: userData.family_name,
      isEmployee: false,
      isManager: false,
    };

    login(employeeData);
    closeLoginModal();
  };

  /**
   * Handles a failed Google login attempt.
   *
   * - Updates the error state with a failure message.
   *
   * @function handleGoogleLoginFailure
   * @returns {void}
   */
  const handleGoogleLoginFailure = () => {
    setError("Google login failed. Please try again.");
  };

  return (
    <>
      <BootstrapNavbar bg="dark" variant="dark" expand="lg">
        <Container>
          <BootstrapNavbar.Brand as={Link} to="/home">
            <img src="/logo.png" alt="expression_panda" width={30} height={24} className="d-inline-block align-text-top" />
            Expression Panda
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
                <img src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`} alt={weather.description} width={30} height={30} className="me-2" />
                <span>{Math.round(weather.temperature)}°F</span>
              </div>
            )}
            {/* Dropdown and Login */}
            {user ? (
              <Nav>
                <NavDropdown title={user.firstName} id="userDropdown" align="end">
                  {user.isManager ? (
                    <NavDropdown.Item as={Link} to="/manager">Manager</NavDropdown.Item>
                  ) : user.isEmployee ? (
                    <>
                      <NavDropdown.Item as={Link} to="/cashier">Cashier</NavDropdown.Item>
                      <NavDropdown.Item onClick={() => handleConfirmNavigation('/kitchen')}>Kitchen</NavDropdown.Item>
                      <NavDropdown.Item onClick={() => handleConfirmNavigation('/menu')}>Menu Board</NavDropdown.Item>
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

      {/* Confirmation */}
      <Modal show={showConfirmModal} onHide={handleCancel}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Navigation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to navigate to this page?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCancel}>
            No
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            Yes
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Login */}
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
