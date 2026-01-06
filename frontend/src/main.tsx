import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { WebSocketProvider } from './contexts/WebSocketContext.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <WebSocketProvider>
        <App />
    </WebSocketProvider>
)
