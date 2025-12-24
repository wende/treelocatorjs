import { useState } from "preact/hooks";
import preactLogo from "./assets/preact.svg";
import "./app.css";

// Standardized test components for ancestry chain testing
function AncestryTest() {
  return (
    <div id="ancestry-test" style={{ padding: "20px", border: "2px solid #333", margin: "10px" }}>
      <h2>Ancestry Chain Test</h2>
      <Panel>
        <CommandBar id="command-bar" />
      </Panel>
      <Sidebar>
        <NavItem id="nav-home" label="Home" />
        <NavItem id="nav-settings" label="Settings" />
      </Sidebar>
    </div>
  );
}

function Panel({ children }) {
  return (
    <div class="panel" style={{ padding: "15px", backgroundColor: "#f0f0f0", margin: "10px 0" }}>
      <span class="panel-title">Panel Component</span>
      {children}
    </div>
  );
}

function CommandBar({ id }) {
  return (
    <div id={id} style={{ backgroundColor: "#007bff", color: "white", padding: "10px" }}>
      <span>Command Bar Content</span>
      <button id="action-btn" style={{ marginLeft: "10px" }}>Action</button>
    </div>
  );
}

function Sidebar({ children }) {
  return (
    <nav class="sidebar" style={{ backgroundColor: "#333", color: "white", padding: "10px", margin: "10px 0" }}>
      <span class="sidebar-title">Sidebar</span>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {children}
      </ul>
    </nav>
  );
}

function NavItem({ id, label }) {
  return (
    <li id={id} style={{ padding: "5px 0" }}>
      <a href="#" style={{ color: "#fff" }}>{label}</a>
    </li>
  );
}

export function App() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <AncestryTest />
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src="/vite.svg" class="logo" alt="Vite logo" />
        </a>
        <a href="https://preactjs.com" target="_blank">
          <img src={preactLogo} class="logo preact" alt="Preact logo" />
        </a>
      </div>
      <h1>Vite + Preact</h1>
      <div class="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/app.jsx</code> and save to test HMR
        </p>
      </div>
      <p class="read-the-docs">
        Click on the Vite and Preact logos to learn more
      </p>
    </div>
  );
}
