import { useEffect } from "react";

/**
 * Translation component.
 *
 * - Integrates Google Translate into the application for language translation functionality.
 * - Dynamically loads the Google Translate script and initializes the translation element.
 * - Renders a fixed Google Translate UI at the bottom of the page and wraps its children components.
 *
 * @component
 * @param {Object} props - The properties passed to the component.
 * @param {React.ReactNode} props.children - The children elements to render inside the component.
 * @returns {JSX.Element} The rendered Translation component.
 */
export const Translation = ({ children }: { children: React.ReactNode }) => {
  // export const Translation = () => {

  /**
   * Initializes the Google Translate element.
   *
   * - Configures Google Translate with the page's default language (`en`) and disables automatic display of the translation UI.
   * - Creates a translation element within the `google_translate_element` DOM container.
   *
   * @function googleTranslateElementInit
   * @returns {void}
   */
  const googleTranslateElementInit = () => {
    new window.google.translate.TranslateElement(
      {
        pageLanguage: "en",
        autoDisplay: false,
      },
      "google_translate_element"
    );
  };

  /**
   * Adds the Google Translate script to the DOM.
   *
   * - Appends a script element with the Google Translate library URL to the document body.
   * - Binds the `googleTranslateElementInit` function to the global `window` object for callback execution.
   *
   * @function useEffect
   * @returns {void}
   */
  useEffect(() => {
    const addScript = document.createElement("script");
    addScript.setAttribute(
      "src",
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
    );
    document.body.appendChild(addScript);
    window.googleTranslateElementInit = googleTranslateElementInit;
  }, []);

  return (
    <>
      <div
        id="google_translate_element"
        style={{ position: "fixed", bottom: "0", width: "100%", zIndex: "100" }}
      ></div>
      {children}
    </>
  );
};
