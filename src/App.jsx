import React from 'react'
import AppRouter from './router/AppRouter'
import useTableGrabScroll from './hooks/useTableGrabScroll'

function App() {
  useTableGrabScroll()
  return (
    <AppRouter />
  )
}

export default App
