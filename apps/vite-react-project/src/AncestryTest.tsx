// Standardized test components for ancestry chain testing
// This structure is replicated across all framework demos

export function AncestryTest() {
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

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="panel" style={{ padding: "15px", backgroundColor: "#f0f0f0", margin: "10px 0" }}>
      <span className="panel-title">Panel Component</span>
      {children}
    </div>
  );
}

function CommandBar({ id }: { id: string }) {
  return (
    <div id={id} style={{ backgroundColor: "#007bff", color: "white", padding: "10px" }}>
      <span>Command Bar Content</span>
      <button id="action-btn" style={{ marginLeft: "10px" }}>Action</button>
    </div>
  );
}

function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <nav className="sidebar" style={{ backgroundColor: "#333", color: "white", padding: "10px", margin: "10px 0" }}>
      <span className="sidebar-title">Sidebar</span>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {children}
      </ul>
    </nav>
  );
}

function NavItem({ id, label }: { id: string; label: string }) {
  return (
    <li id={id} style={{ padding: "5px 0" }}>
      <a href="#" style={{ color: "#fff" }}>{label}</a>
    </li>
  );
}
