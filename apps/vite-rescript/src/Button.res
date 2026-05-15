@react.component
let make = (~label) => {
  <button className="submit-button">
    {React.string(label)}
  </button>
}
