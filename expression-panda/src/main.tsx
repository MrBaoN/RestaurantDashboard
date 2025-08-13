import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import { App } from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { clientId } from "./config";

createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>
);
