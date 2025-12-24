import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { setup } from '@treelocator/runtime'

// Initialize TreeLocatorJS
setup()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
