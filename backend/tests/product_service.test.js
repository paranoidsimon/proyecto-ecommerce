import assert from 'node:assert/strict';
import test from 'node:test';
import { addDependency } from '../dependency.js';
import { ProductService } from '../services/product_service.js';

const products = [
  {
    _id: '64b000000000000000000001',
    name: 'Cámara',
    description: 'Cámara digital',
    category: 'Electrónica',
    price: 20,
    stock: 3,
    active: true,
    createdAt: new Date('2026-01-02'),
  },
  {
    _id: '64b000000000000000000002',
    name: 'Auriculares',
    description: '',
    category: 'Electrónica',
    price: 10,
    stock: 0,
    active: true,
    createdAt: new Date('2026-01-01'),
  },
  {
    _id: '64b000000000000000000003',
    name: 'Libro',
    description: '',
    category: 'Libros',
    price: 15,
    stock: 5,
    active: false,
    createdAt: new Date('2025-12-01'),
  },
];

function matches(product, filter) {
  if (filter.active === true && !product.active)
    return false;
  if (filter.category && product.category !== filter.category)
    return false;
  if (filter.stock?.$gt !== undefined && product.stock <= filter.stock.$gt)
    return false;
  if (filter.price?.$gte !== undefined && product.price < filter.price.$gte)
    return false;
  if (filter.price?.$lte !== undefined && product.price > filter.price.$lte)
    return false;
  if (filter.$or && !filter.$or.some(condition => {
    const [field, matcher] = Object.entries(condition)[0];
    return matcher.$regex.test(product[field] || '');
  }))
    return false;
  return true;
}

addDependency('productRepo', {
  find(filter) {
    return {
      sort: async order => {
        const [field, direction] = Object.entries(order)[0];
        return products.filter(product => matches(product, filter))
          .sort((a, b) => direction * (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0));
      },
    };
  },
  async distinct(field, filter) {
    return [...new Set(products.filter(product => matches(product, filter)).map(product => product[field]))];
  },
  async findOne(filter) {
    return products.find(product => product._id === String(filter._id)
      && (filter.active !== true || product.active)) || null;
  },
});

const service = new ProductService();

test('filtra catálogo por categoría, precio y stock y respeta el orden', async () => {
  const result = await service.getList({
    category: 'Electrónica',
    minPrice: '10',
    maxPrice: '20',
    inStock: true,
    sort: 'price-asc',
  });

  assert.deepEqual(result.map(product => product.name), ['Cámara']);
});

test('las categorías públicas excluyen categorías solo inactivas', async () => {
  assert.deepEqual(await service.getCategories(), ['Electrónica']);
  assert.deepEqual(await service.getCategories(true), ['Electrónica', 'Libros']);
});

test('la ficha pública oculta productos inactivos y devuelve 404 para IDs inválidos', async () => {
  await assert.rejects(service.getById(products[2]._id), error => error.statusCode === 404);
  assert.equal((await service.getById(products[2]._id, true)).name, 'Libro');
  await assert.rejects(service.getById('no-es-un-id'), error => error.statusCode === 404);
});

test('rechaza filtros de precio y orden inválidos', async () => {
  await assert.rejects(
    service.getList({ minPrice: '30', maxPrice: '20' }),
    error => error.statusCode === 400,
  );
  await assert.rejects(
    service.getList({ sort: 'random' }),
    error => error.statusCode === 400,
  );
});
