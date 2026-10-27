import { createContext, useContext, useState } from 'react';

export const GlobalContext = createContext();

export function GlobalProvider({ children }) {
  const [username, setUsername] = useState(null);
  const [displayName, setDisplayName] = useState(null);
  const [role, setRole] = useState(null);
  const clearSession = () => {
    setUsername(null);
    setDisplayName(null);
    setRole(null);
  };

  return <GlobalContext.Provider
    value={{
      username, setUsername,
      displayName, setDisplayName,
      role, setRole,
      clearSession,
    }}
  >
    {children}
  </GlobalContext.Provider>;
}

export default function useGlobal() {
  return useContext(GlobalContext);
}