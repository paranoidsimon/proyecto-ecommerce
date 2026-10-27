import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCommerce from '../services/useCommerce';
import useGlobal from '../services/useGlobal';

const money = value => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
}).format(value);

export default function Home() {
  const { getProducts, getCategories, addCartItem } = useCommerce();
  const { role } = useGlobal();
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.toString();
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadProducts(filters = {}) {
    setLoading(true);
    try {
      setProducts(await getProducts(filters));
    } catch (error) {
      toast.error(error.message || 'No se pudo cargar el catálogo');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProducts(Object.fromEntries(new URLSearchParams(query)));
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    getCategories().then(setCategories).catch(error => {
      toast.error(error.message || 'No se pudieron cargar las categorías');
    });
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function addToCart(product) {
    if (role !== 'customer') {
      toast.info('Inicia sesión o crea una cuenta de cliente para comprar.');
      return;
    }
    try {
      await addCartItem(product._id);
      toast.success(`${product.name} se agregó al carrito`);
    } catch (error) {
      toast.error(error.message || 'No se pudo agregar el producto');
    }
  }

  return <section className="store-page">
    <h1>Tienda</h1>
    <p>Encuentra tus productos favoritos.</p>
    <div className="catalog-layout">
      <form
        className="catalog-filters"
        key={query}
        onSubmit={event => {
          event.preventDefault();
          const values = new FormData(event.currentTarget);
          const params = new URLSearchParams(searchParams);
          for (const key of ['category', 'minPrice', 'maxPrice', 'sort']) {
            const value = String(values.get(key) || '');
            if (value)
              params.set(key, value);
            else
              params.delete(key);
          }
          if (values.get('inStock'))
            params.set('inStock', 'true');
          else
            params.delete('inStock');
          setSearchParams(params);
        }}
      >
        <h2>Filtros</h2>
        <label>
          Categoría
          <select name="category" defaultValue={searchParams.get('category') || ''}>
            <option value="">Todas las categorías</option>
            {categories.map(category => <option key={category} value={category}>{category}</option>)}
          </select>
        </label>
        <label>
          Precio mínimo
          <input name="minPrice" type="number" min="0" step="0.01" defaultValue={searchParams.get('minPrice') || ''} />
        </label>
        <label>
          Precio máximo
          <input name="maxPrice" type="number" min="0" step="0.01" defaultValue={searchParams.get('maxPrice') || ''} />
        </label>
        <label>
          Ordenar por
          <select name="sort" defaultValue={searchParams.get('sort') || 'newest'}>
            <option value="newest">Más recientes</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
            <option value="name-asc">Nombre: A-Z</option>
          </select>
        </label>
        <label className="stock-filter">
          <input
            name="inStock"
            type="checkbox"
            defaultChecked={searchParams.get('inStock') === 'true'}
          />
          Solo disponibles
        </label>
        <button type="submit">Aplicar filtros</button>
      </form>
      <div className="catalog-results">
        {loading ? <p>Cargando productos...</p> : products.length === 0
          ? <p>No hay productos disponibles.</p>
          : <div className="product-grid">
            {products.map(product => <article className="product-card" key={product._id}>
              <Link className="product-card-image" to={`/products/${product._id}`} aria-label={`Ver ficha de ${product.name}`}>
                {product.imageUrl
                  ? <img src={product.imageUrl} alt={product.name} />
                  : <span>Imagen no disponible</span>}
              </Link>
              <div className="product-card-content">
                <h2>
                  <Link to={`/products/${product._id}`}>{product.name}</Link>
                </h2>
                <strong>{money(product.price)}</strong>
                {role === 'customer'
                  ? <button
                    disabled={product.stock < 1}
                    onClick={() => addToCart(product)}
                  >Agregar al carrito</button>
                  : role === 'admin' || role === 'seller'
                    ? <Link
                      className="product-action-button"
                      to={`/products/manage?edit=${encodeURIComponent(product._id)}`}
                    >Editar producto</Link>
                    : <Link className="product-action-button" to="/login">Iniciar sesión para comprar</Link>}
              </div>
            </article>)}
          </div>}
      </div>
    </div>
  </section>;
}
