import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import App from './App.jsx'
import { ThemeProvider } from './components/theme-provider'
import './styles/globals.css'

import { ToastProvider } from './context/ToastContext'
import { SoundProvider } from './context/SoundContext'
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <SoundProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </SoundProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
)
