import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Translation } from "../components/Translation";
import { MIDDLEWARE_URI } from "../config";

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

/**
 * Home component.
 *
 * - Serves as the landing page of the application.
 * - Displays a welcome message, featured entrée items, a call-to-action button for navigation, and a section detailing the restaurant's story.
 * - Dynamically fetches and displays three random featured entrée items from the menu.
 * - Integrates the Translation component for multi-language support.
 *
 * @component
 * @returns {JSX.Element} The rendered home page component.
 */
export const Home = () => {
  const navigate = useNavigate();
  const [featuredItems, setFeaturedItems] = useState<MenuItem[]>([]);

  /**
   * Navigates to a specified path.
   *
   * - Uses the `useNavigate` hook from `react-router-dom` to programmatically navigate to different pages.
   *
   * @function handleNavigation
   * @param {string} path - The path to navigate to.
   * @returns {void}
   */
  const handleNavigation = (path: string) => {
    navigate(path);
  };

  /**
   * Fetches the active menu items from the API.
   *
   * - Groups the items by category and selects three random entrée items for display.
   * - Updates the `featuredItems` state with the selected items.
   * - Handles and logs any errors that occur during the fetch operation.
   *
   * @async
   * @function getMenuItems
   * @returns {Promise<void>} Resolves when the menu items are successfully fetched and grouped.
   * @throws {Error} If the API request fails or the response is invalid.
   */
  async function getMenuItems() {
    try {
      const response = await fetch(
        `${MIDDLEWARE_URI}/api/active-items`
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
      );

      // Get only Entrée items and select 3 random ones
      const entreeItems = groupedItems["entree"] || [];
      const randomEntrees = entreeItems
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setFeaturedItems(randomEntrees);
    } catch (error) {
      console.error("Failed to fetch menu items:", error);
    }
  }

  /**
   * Effect hook to fetch menu items on component mount.
   *
   * - Calls `getMenuItems` when the component is first rendered.
   *
   * @function useEffect
   * @returns {void}
   */
  useEffect(() => {
    getMenuItems();
  }, []);

  return (
    <Translation>
      <div
        style={{
          height: "100vh",
          overflowY: "auto",
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 1), rgba(255, 255, 255, 1)), url(/logo.png)", // The only workaround to extend the white background behind orderNow button
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          position: "relative",
        }}
      >
        {/* Overlay div to create the faded effect */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.95)", // White overlay with 0.95 opacity
            zIndex: 1,
          }}
        />

        {/* Main content with higher z-index to appear above the overlay */}
        <div
          className="cover-container d-flex flex-column align-items-center w-100 p-3 mx-auto"
          style={{ position: "relative", zIndex: 2 }}
        >
          {/* Welcome Section */}
          <div className="welcome-section text-center">
            <h1 className="display-4 font-weight-bold">Welcome</h1>
            <h2 className="lead font-weight-bold">We are Expression Panda!</h2>
          </div>

          <div className="content-section w-100 mt-5 justify-content-center">
            <div className="featured-items text-center mb-5">
              <h2>Featured Entrées</h2>
              <div className="row justify-content-center">
                {featuredItems.map((item) => (
                  <div key={item.id} className="col-md-4">
                    <div className="card mb-4 h-100 shadow-sm">
                      <div className="card-body d-flex flex-column justify-content-between">
                        <div>
                          <p className="card-title fs-3">{item.name}</p>
                        </div>
                        <div
                          className="text-center my-3"
                          style={{ overflowY: "visible" }}
                        >
                          <img
                            src="/logo.png"
                            alt="Item"
                            style={{
                              width: "300px",
                              height: "300px",
                              objectFit: "contain",
                            }}
                          />
                        </div>
                        <div>
                          <p className="card-text">
                            <strong>${item.price.toFixed(2)}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={() => handleNavigation("/customer")}
                className="btn btn-primary mt-4"
                style={{
                  fontSize: "2rem",
                  padding: "1rem 3rem",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 1)",
                  backgroundColor: "#e31110",
                }}
              >
                Order Now!
              </Button>
            </div>

            {/* Our Story Section with full width and grey background */}
            <div
              className="our-story py-5"
              style={{
                backgroundColor: "#343a40",
                color: "white",
                width: "100vw",
                position: "relative",
                left: "50%",
                right: "50%",
                marginLeft: "-50vw",
                marginRight: "-50vw",
              }}
            >
              <div className="container">
                <h2 className="text-center mb-4">Our Story</h2>
                <div className="row align-items-center">
                  {/* Image Column */}
                  <div className="col-md-4">
                    <img
                      src="/bobo2.jpeg"
                      className="img-fluid rounded"
                      alt="Bobo the Panda"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  {/* Text Column */}
                  <div className="col-md-8">
                    <p>
                      Our story begins in Beijing, China, nearly 200 years ago,
                      with a young panda known as Little Performer. Bobo, as we
                      now call him, was captured by hunters and forced into a
                      life of hardship in a traveling circus. Alongside other
                      animals, he endured daily torment, performing tricks for
                      human amusement.
                    </p>
                    <p>
                      But Bobo's spirit was unyielding. In 1921, he seized an
                      opportunity to escape, sneaking aboard a boat bound for
                      Vietnam. From there, his journey continued across the seas
                      to the Port of Houston, where he caught his first glimpse
                      of America—a land of opportunity and innovation.
                      Fascinated by the marvels of modern technology,
                      particularly airplanes, Bobo embarked on an adventure
                      northward to Oshkosh, Wisconsin, home to the world's
                      largest airshow.
                    </p>
                    <p>
                      Inspired by the culture and flavors he encountered along
                      his journey, Bobo decided to put down roots in Oshkosh.
                      Drawing from the recipes he had cherished in China and
                      blending them with the culinary discoveries he made in
                      America, Bobo founded Expression Panda. His vision was
                      simple yet profound: to create dishes that celebrate both
                      tradition and innovation, using only the finest
                      ingredients to craft meals that are as rich in history as
                      they are in flavor.
                    </p>
                    <p>
                      Today, Bobo’s legacy lives on in every bite—a harmonious
                      blend of cultures, memories, and passion, brought together
                      in a way only Bobo could imagine.
                    </p>
                    <p>
                      Welcome to Expression Panda, where the past meets the
                      present to create a dining experience like no other.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Translation>
  );
};
