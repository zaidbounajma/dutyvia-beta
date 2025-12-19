import { createContext, useContext } from "react";

// on simule un utilisateur connecté
const FakeAuthContext = createContext({
  user: {
    id: "demo-user-123",
    email: "demo@dutyfree.test",
  },
  loading: false,
  signOut: () => {},
  signIn: () => {},
  signUp: () => {},
});

export function FakeAuthProvider({ children }) {
  return (
    <FakeAuthContext.Provider
      value={{
        user: {
          id: "demo-user-123",
          email: "demo@dutyfree.test",
        },
        loading: false,
        signOut: () => {},
        signIn: () => {},
        signUp: () => {},
      }}
    >
      {children}
    </FakeAuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(FakeAuthContext);
}
