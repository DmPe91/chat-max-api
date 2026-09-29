import { useState } from "react";
import Login from "./components/Login";
import Chat from "./components/Chat";

export default function App() {
  const [credentials, setCredentials] = useState(null);

  const handleLogin = (idInstance, apiTokenInstance) => {
    setCredentials({ idInstance, apiTokenInstance });
  };

  const handleLogout = () => {
    setCredentials(null);
  };

  return (
    <>
      {credentials ? (
        <Chat credentials={credentials} onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}
