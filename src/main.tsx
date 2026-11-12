import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

import MiApp from './MiApp'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <MiApp />
    </StrictMode>,
)
