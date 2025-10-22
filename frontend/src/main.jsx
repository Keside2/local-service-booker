import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import "@fortawesome/fontawesome-free/css/all.min.css";
import { CurrencyProvider } from "./context/CurrencyContext.jsx";



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CurrencyProvider>
    <App />
    </CurrencyProvider>
  </StrictMode>,
)
