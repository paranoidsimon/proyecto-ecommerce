import { useEffect } from 'react';
import './App.css';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import routes from './routes';
import { toast } from 'react-toastify';
import useApi from './services/useApi';
import useGlobal from './services/useGlobal';

const router = createBrowserRouter(routes);

export default function App() {
  const { setAuthorization } = useApi();
  const { setUsername, setDisplayName, setRole } = useGlobal();

  useEffect(() => {
    let session;
    try {
      session = JSON.parse(localStorage.getItem('session'));
    } catch (error) {
      console.error('No se pudo recuperar la sesión guardada', error);
      localStorage.removeItem('session');
      return;
    }
    if (!session)
      return;
    
    setAuthorization('Bearer ' + session.authorizationToken);
    setUsername(session.username);
    setDisplayName(session.displayName || session.username);
    setRole(session.role);
    toast.success('Sesión iniciada correctamente.');
  }, [setAuthorization, setDisplayName, setRole, setUsername]);

  return <RouterProvider
    router={router}
  />;
}
