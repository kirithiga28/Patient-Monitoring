import { useState } from "react";

function App() {
  const [loggedIn, setLoggedIn] = useState(false);

  if (!loggedIn) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>Patient Monitoring</h1>

        <button onClick={() => setLoggedIn(true)}>
          Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px" }}>
      <h1>Patient Monitoring Dashboard</h1>

      <button onClick={() => setLoggedIn(false)}>
        Logout
      </button>
    </div>
  );
}

export default App;