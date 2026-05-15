import * as React from "react";

function Card(props) {
  return (
    <section className="card">
      <header className="card-header">{props.title}</header>
      <div className="card-body">{props.children}</div>
    </section>
  );
}

let make = Card;

export { make };

//# sourceMappingURL=Card.res.js.map
