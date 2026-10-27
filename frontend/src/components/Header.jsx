import { useEffect, useState } from 'react';
import useGlobal from '../services/useGlobal';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Header({
  onClickMenu,
  menuVisible
}) {
  const { username, displayName } = useGlobal();
  const location = useLocation();
  const navigate = useNavigate();
  const search = new URLSearchParams(location.search).get('search') || '';
  const [searchValue, setSearchValue] = useState(search);

  useEffect(() => {
    setSearchValue(search);
  }, [search]);

  return <header className="app-header">
    <Link className="brand" to="/" aria-label="ecommerce, inicio">
      <span className="brand-name">ecommerce</span>
    </Link>
    <form
      className="header-search"
      role="search"
      onSubmit={event => {
        event.preventDefault();
        const term = searchValue.trim();
        const params = new URLSearchParams(location.search);
        if (term)
          params.set('search', term);
        else
          params.delete('search');
        const query = params.toString();
        navigate({ pathname: '/', search: query ? `?${query}` : '' });
      }}
    >
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m16 16 4.2 4.2" />
      </svg>
      <input
        aria-label="Buscar productos"
        name="search"
        placeholder="Buscar productos"
        value={searchValue}
        onChange={event => setSearchValue(event.target.value)}
      />
      <button type="submit">Buscar</button>
    </form>
    <Link className="header-cart" to="/cart" aria-label="Ver carrito">
      <svg aria-hidden="true" viewBox="0 0 24 24">
        <path d="M3 4h2l2.2 11.2a2 2 0 0 0 2 1.6h8.6a2 2 0 0 0 1.9-1.4L22 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>
    </Link>
    {username && <div className="header-account">
      Bienvenido, <strong>{displayName || username}</strong>
    </div>}
    <button
      className="menu-toggle"
      type="button"
      aria-label="Alternar menú"
      aria-expanded={menuVisible}
      onClick={onClickMenu}
    >
      <span aria-hidden="true">☰</span>
    </button>
  </header>;
}