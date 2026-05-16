@react.component
let make = (~title, ~children) => {
  <section className="card">
    <header className="card-header">{React.string(title)}</header>
    <div className="card-body">{children}</div>
  </section>
}
