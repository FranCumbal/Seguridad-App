import { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import AppRouter from './routes/AppRouter';

export default function App() {
  const restore = useAuthStore((s) => s.restore);
  useEffect(() => { restore(); }, [restore]);
  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}
