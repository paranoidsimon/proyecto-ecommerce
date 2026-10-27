import { Outlet } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Users from './pages/Users';
import User from './pages/User';
import Register from './pages/Register';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';

const routes = [
  {
    path: '/',
    element: <MainLayout >
      <Outlet />
    </MainLayout>,
    children: [
      {
        path: '/',
        element: <Home />,
      },
      {
        path: '/about',
        element: <About />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        path: '/cart',
        element: <Cart />,
      },
      {
        path: '/orders',
        element: <Orders />,
      },
      {
        path: '/products/manage',
        element: <Products />,
      },
      {
        path: '/products/:productId',
        element: <ProductDetail />,
      },
      {
        path: '/users',
        element: <Users />,
      },
      {
        path: '/users/new',
        element: <User />,
      },
      {
        path: '/users/:username/edit',
        element: <User />,
      },
      {
        path: '*',
        element: <NotFound />,
      },
    ],
  },
];

export default routes;