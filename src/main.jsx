import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import '../public/base.css'
import '../public/styles.css'
import '../public/animations.css'
// We'll import Tailwind via the index.html CDN for now to keep it simple, 
// or we can set up PostCSS later.

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
