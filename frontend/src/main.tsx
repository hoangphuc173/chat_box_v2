import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { ThemeProvider } from './components/providers/ThemeProvider.tsx'
import { WebSocketProvider } from './contexts/WebSocketContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <ThemeProvider>
        <WebSocketProvider>
            <App />
        </WebSocketProvider>
    </ThemeProvider>
)
