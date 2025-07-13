import React, { createContext, useContext, useState } from "react";

interface User {
  id: number;
  firstName: string;
  isEmployee: boolean;
  isManager: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  showLoginModal: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider component.
 *
 * - Provides authentication context to child components.
 * - Manages user state, login/logout functionality, and the visibility of a login modal.
 *
 * @component
 * @param {object} props - Component properties.
 * @param {React.ReactNode} props.children - Child components to render within the provider.
 *
 * @returns {JSX.Element} The AuthProvider component wrapping its children with authentication context.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setEmployee] = useState<User | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  /**
   * Logs in a user by setting the user state.
   *
   * @param {User} userData - The user data to set in the context.
   */
  const login = (userData: User) => {
    setEmployee(userData);
  };

  /**
   * Logs out the current user by clearing the user state.
   */
  const logout = () => {
    setEmployee(null);
  };

  /**
   * Opens the login modal by updating the modal visibility state.
   */
  const openLoginModal = () => setShowLoginModal(true);

  /**
   * Closes the login modal by updating the modal visibility state.
   */
  const closeLoginModal = () => setShowLoginModal(false);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        showLoginModal,
        openLoginModal,
        closeLoginModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to access the authentication context.
 *
 * - Provides access to authentication-related functionality and state.
 * - Must be used within a component wrapped by `AuthProvider`.
 *
 * @throws {Error} If used outside an `AuthProvider`.
 *
 * @returns {AuthContextType} The authentication context.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
