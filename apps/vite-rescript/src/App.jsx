import { make as Button } from './Button.res.js'
import { make as Card } from './Card.res.js'

export default function App() {
  return (
    <div id="app-root" style={{ fontFamily: 'sans-serif', padding: '2rem' }}>
      <h1>ReScript demo</h1>
      <p>Alt+click any element below to copy its component ancestry.</p>
      <div id="card-container">
        <Card title="Hello">
          <Button label="Submit" />
          <Button label="Cancel" />
        </Card>
      </div>
    </div>
  )
}
