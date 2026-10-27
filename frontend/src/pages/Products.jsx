import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import useCommerce from '../services/useCommerce';
import useGlobal from '../services/useGlobal';

const emptyProduct = {
  name: '',
  description: '',
  category: '',
  price: '',
  stock: '',
  imageUrl: '',
  active: true,
};

export default function Products() {
  const { role } = useGlobal();
  const { getProducts, getCategories, addProduct, updateProduct, deleteProduct } = useCommerce();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedEditId = searchParams.get('edit');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function loadProducts() {
    try {
      const result = await getProducts();
      setProducts(result);
      return result;
    } catch (error) {
      toast.error(error.message || 'No se pudieron cargar los productos');
      return [];
    }
  }

  useEffect(() => {
    if (role === 'admin' || role === 'seller') {
      loadProducts().then(loadedProducts => {
        if (!requestedEditId)
          return;
        const product = loadedProducts.find(item => item._id === requestedEditId);
        if (product)
          edit(product);
        else
          toast.error('No se encontró el producto que quieres editar');
      });
      getCategories().then(setCategories).catch(error => {
        toast.error(error.message || 'No se pudieron cargar las categorías');
      });
    }
  // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [role, requestedEditId]);

  if (!['admin', 'seller'].includes(role))
    return <p className="notice">Esta sección es solo para vendedores y administradores.</p>;

  function change(field, value) {
    setForm(current => ({ ...current, [field]: value }));
  }

  function edit(product) {
    setEditingId(product._id);
    setForm({
      name: product.name,
      description: product.description || '',
      category: product.category || '',
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.imageUrl || '',
      active: product.active,
    });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    try {
      if (editingId)
        await updateProduct(editingId, payload);
      else
        await addProduct(payload);
      toast.success(editingId ? 'Producto actualizado' : 'Producto creado');
      setForm(emptyProduct);
      setEditingId(null);
      if (requestedEditId)
        setSearchParams(current => {
          current.delete('edit');
          return current;
        }, { replace: true });
      await loadProducts();
    } catch (error) {
      toast.error(error.message || 'No se pudo guardar el producto');
    } finally {
      setSaving(false);
    }
  }

  async function remove(product) {
    if (!window.confirm(`¿Eliminar "${product.name}"?`))
      return;
    try {
      await deleteProduct(product._id);
      toast.success('Producto eliminado');
      await loadProducts();
    } catch (error) {
      toast.error(error.message || 'No se pudo eliminar el producto');
    }
  }

  return <section className="store-page">
    <h1>Gestionar productos</h1>
    <form className="product-form" onSubmit={submit}>
      <h2>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
      <label>Nombre<input value={form.name} required onChange={event => change('name', event.target.value)} /></label>
      <label>Descripción<textarea value={form.description} onChange={event => change('description', event.target.value)} /></label>
      <label>Categoría
        <input list="product-categories" value={form.category} onChange={event => change('category', event.target.value)} />
        <datalist id="product-categories">
          {categories.map(category => <option key={category} value={category} />)}
        </datalist>
      </label>
      <label>Precio<input type="number" min="0" step="0.01" value={form.price} required onChange={event => change('price', event.target.value)} /></label>
      <label>Inventario<input type="number" min="0" step="1" value={form.stock} required onChange={event => change('stock', event.target.value)} /></label>
      <label>URL de imagen<input type="url" value={form.imageUrl} onChange={event => change('imageUrl', event.target.value)} /></label>
      {editingId && <label className="checkbox-label">
        <input type="checkbox" checked={form.active} onChange={event => change('active', event.target.checked)} />
        Disponible en la tienda
      </label>}
      <div className="button-row">
        <button type="submit" disabled={saving}>{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear producto'}</button>
        {editingId && <button type="button" onClick={() => {
          setForm(emptyProduct);
          setEditingId(null);
          if (requestedEditId)
            setSearchParams(current => {
              current.delete('edit');
              return current;
            }, { replace: true });
        }}>Cancelar edición</button>}
      </div>
    </form>
    <h2>Productos del catálogo</h2>
    <div className="management-list">
      {products.map(product => <article key={product._id} className="management-item">
        <div>
          <strong>{product.name}</strong>
          <span>{product.category || 'Sin categoría'} · ${product.price} · Stock: {product.stock} · {product.active ? 'Activo' : 'Inactivo'}</span>
        </div>
        <div className="button-row">
          <button onClick={() => edit(product)}>Editar</button>
          <button className="danger-button" onClick={() => remove(product)}>Eliminar</button>
        </div>
      </article>)}
    </div>
  </section>;
}
