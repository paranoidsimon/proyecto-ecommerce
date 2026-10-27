import useApi from './useApi';

export default function useCommerce() {
  const api = useApi();
  function getProducts(filters = {}) {
    const params = new URLSearchParams();
    if (typeof filters === 'string') {
      if (filters)
        params.set('search', filters);
    } else {
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined && value !== null && value !== '')
          params.set(key, String(value));
      }
    }
    const query = params.toString();
    return api.getJson(`/products${query ? `?${query}` : ''}`);
  }

  return {
    getProducts,
    getProduct: id => api.getJson(`/products/${encodeURIComponent(id)}`),
    getCategories: () => api.getJson('/categories'),
    addProduct: data => api.postJson('/products', data),
    updateProduct: (id, data) => api.patchJson(`/products/${id}`, data),
    deleteProduct: id => api.deleteJson(`/products/${id}`),
    getCart: () => api.getJson('/cart'),
    addCartItem: id => api.postJson(`/cart/${id}`, {}),
    setCartItem: (id, quantity) => api.putJson(`/cart/${id}`, { quantity }),
    removeCartItem: id => api.deleteJson(`/cart/${id}`),
    checkout: () => api.postJson('/checkout', {}),
    getOrders: () => api.getJson('/orders'),
    updateOrderStatus: (id, status) => api.patchJson(`/orders/${id}/status`, { status }),
  };
}
