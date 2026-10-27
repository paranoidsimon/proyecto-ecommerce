import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCommerce from '../services/useCommerce';
import useGlobal from '../services/useGlobal';

const money = value => new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'ARS',
}).format(value);

export default function ProductDetail() {
  const { productId } = useParams();
  const { getProduct, addCartItem } = useCommerce();
  const { role } = useGlobal();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setNotFound(false);
    getProduct(productId).then(result => {
      if (active)
        setProduct(result);
    }).catch(error => {
      if (active) {
        setNotFound(true);
        toast.error(error.message || 'No se pudo cargar el producto');
      }
    }).finally(() => {
      if (active)
        setLoading(false);
    });
    return () => {
      active = false;
    };
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function addToCart() {
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

  if (loading)
    return <p className="notice">Cargando producto...</p>;
  if (notFound || !product)
    return <p className="notice">No se encontró el producto. <Link to="/">Volver a la tienda</Link></p>;

  return <section className="store-page">
    <p className="product-breadcrumb"><Link to="/">Tienda</Link> / {product.category || 'Producto'}</p>
    <article className="product-detail">
      <div className="product-detail-image">
        {product.imageUrl
          ? <img src={product.imageUrl} alt={product.name} />
          : <span>Imagen no disponible</span>}
      </div>
      <div className="product-detail-content">
        {product.category && <Link
          className="product-category"
          to={`/?${new URLSearchParams({ category: product.category })}`}
        >{product.category}</Link>}
        <h1>{product.name}</h1>
        <strong className="product-detail-price">{money(product.price)}</strong>
        <p className="product-detail-stock">
          {product.stock > 0 ? `${product.stock} disponibles` : 'Sin stock'}
        </p>
        <p className="product-detail-description">
          {product.description || 'No hay una descripción disponible para este producto.'}
        </p>
        {role === 'customer'
          ? <button
            type="button"
            disabled={product.stock < 1}
            onClick={addToCart}
          >Agregar al carrito</button>
          : role === 'admin' || role === 'seller'
            ? <Link
              className="product-action-button"
              to={`/products/manage?edit=${encodeURIComponent(product._id)}`}
            >Editar producto</Link>
            : <Link className="product-action-button" to="/login">
              Iniciar sesión para comprar
            </Link>}
      </div>
    </article>
  </section>;
}
