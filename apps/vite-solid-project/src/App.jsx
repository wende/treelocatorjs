import logo from "./logo.svg";
import styles from "./App.module.css";
import { Inner2 } from "./Inner2";

function Inner() {
  return (
    <div
      style={{
        "background-color": "red",
        padding: "10px",
      }}
    >
      <Inner2 />
    </div>
  );
}

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

function Panel(props) {
  return (
    <div class="panel" style={{ padding: "15px", "background-color": "#f0f0f0", margin: "10px 0" }}>
      <span class="panel-title">Panel Component</span>
      {props.children}
    </div>
  );
}

function CommandBar(props) {
  return (
    <div id={props.id} style={{ "background-color": "#007bff", color: "white", padding: "10px" }}>
      <span>Command Bar Content</span>
      <button id="action-btn" style={{ "margin-left": "10px" }}>Action</button>
    </div>
  );
}

function Sidebar(props) {
  return (
    <nav class="sidebar" style={{ "background-color": "#333", color: "white", padding: "10px", margin: "10px 0" }}>
      <span class="sidebar-title">Sidebar</span>
      <ul style={{ "list-style": "none", padding: 0 }}>
        {props.children}
      </ul>
    </nav>
  );
}

function NavItem(props) {
  return (
    <li id={props.id} style={{ padding: "5px 0" }}>
      <a href="#" style={{ color: "#fff" }}>{props.label}</a>
    </li>
  );
}

function App() {
  return (
    <div class={styles.App}>
      <header class={styles.header}>
        <AncestryTest />
        <img src={logo} class={styles.logo} alt="logo" />
        <p>
          Edit <code>src/App.jsx</code> and save to reload.
        </p>
        <Inner />
        <a
          class={styles.link}
          href="https://github.com/solidjs/solid"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn Solid
        </a>
      </header>
    </div>
  );
}

export default App;
