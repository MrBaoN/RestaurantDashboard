import { createRoot } from "react-dom/client";
import "bootstrap/dist/css/bootstrap.css";
import { App } from "./App";
import { GoogleOAuthProvider } from "@react-oauth/google";
const clientId = import.meta.env.VITE_CLIENT_ID as string;
console.log(clientId);
createRoot(document.getElementById("root")!).render(
  <GoogleOAuthProvider clientId={clientId}>
    <App />
  </GoogleOAuthProvider>
);
