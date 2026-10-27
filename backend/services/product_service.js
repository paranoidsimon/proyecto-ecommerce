import { getDependency } from '../dependency.js';
import { httpError } from '../utils/http_error.js';
import mongoose from 'mongoose';

const sortOptions = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  'name-asc': { name: 1 },
};

function priceFilter(value) {
  if (value === undefined || value === '')
    return undefined;
  if (typeof value !== 'string' && typeof value !== 'number')
    throw httpError(400, 'El filtro de precio no es válido');
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0)
    throw httpError(400, 'El filtro de precio debe ser un número mayor o igual a cero');
  return price;
}

function productData(data, partial = false) {
  if (!data || typeof data !== 'object' || Array.isArray(data))
    throw httpError(400, 'Los datos del producto no son válidos');

  const fields = ['name', 'description', 'category', 'price', 'stock', 'imageUrl', 'active'];
  const result = Object.fromEntries(fields
    .filter(field => Object.hasOwn(data, field))
    .map(field => [field, data[field]]));

  if (!partial && (!result.name || result.price === undefined))
    throw httpError(400, 'El nombre y el precio del producto son obligatorios');

  for (const field of ['name', 'description', 'category', 'imageUrl']) {
    if (result[field] !== undefined && typeof result[field] !== 'string')
      throw httpError(400, `El campo ${field} debe ser texto`);
  }
  if (result.name !== undefined && !String(result.name).trim())
    throw httpError(400, 'El nombre del producto no puede estar vacío');
  if (result.price !== undefined && (
    (typeof result.price !== 'number' && (typeof result.price !== 'string' || !result.price.trim()))
    || !Number.isFinite(Number(result.price))
    || Number(result.price) < 0
  ))
    throw httpError(400, 'El precio debe ser un número mayor o igual a cero');
  if (result.stock !== undefined && (
    (typeof result.stock !== 'number' && (typeof result.stock !== 'string' || !result.stock.trim()))
    || !Number.isInteger(Number(result.stock))
    || Number(result.stock) < 0
  ))
    throw httpError(400, 'El inventario debe ser un entero mayor o igual a cero');
  if (result.active !== undefined && typeof result.active !== 'boolean')
    throw httpError(400, 'El estado del producto no es válido');

  for (const field of ['price', 'stock']) {
    if (result[field] !== undefined)
      result[field] = Number(result[field]);
  }

  return result;
}

export class ProductService {
  constructor() {
    this.productRepo = getDependency('productRepo');
  }

  async getList({
    search = '',
    category = '',
    minPrice,
    maxPrice,
    inStock = false,
    sort = 'newest',
  } = {}, includeInactive = false) {
    const filter = includeInactive ? {} : { active: true };
    if (category)
      filter.category = category;
    if (search.trim()) {
      const escapedSearch = search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { name: { $regex: escapedSearch, $options: 'i' } },
        { description: { $regex: escapedSearch, $options: 'i' } },
        { category: { $regex: escapedSearch, $options: 'i' } },
      ];
    }

    const min = priceFilter(minPrice);
    const max = priceFilter(maxPrice);
    if (min !== undefined && max !== undefined && min > max)
      throw httpError(400, 'El precio mínimo no puede superar al máximo');
    if (min !== undefined || max !== undefined)
      filter.price = {
        ...(min !== undefined ? { $gte: min } : {}),
        ...(max !== undefined ? { $lte: max } : {}),
      };
    if (inStock === true || inStock === 'true')
      filter.stock = { $gt: 0 };

    if (!Object.hasOwn(sortOptions, sort))
      throw httpError(400, 'El orden solicitado no es válido');
    return this.productRepo.find(filter).sort(sortOptions[sort]);
  }

  async getCategories(includeInactive = false) {
    const filter = includeInactive ? {} : { active: true };
    const categories = await this.productRepo.distinct('category', filter);
    return categories.filter(category => typeof category === 'string' && category.trim())
      .sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }

  async getById(id, includeInactive = false) {
    if (!mongoose.isValidObjectId(id))
      throw httpError(404, 'El producto no existe');
    const filter = includeInactive ? { _id: id } : { _id: id, active: true };
    const product = await this.productRepo.findOne(filter);
    if (!product)
      throw httpError(404, 'El producto no existe');
    return product;
  }

  async add(data) {
    return this.productRepo.create(productData(data));
  }

  async update(id, data) {
    const updated = await this.productRepo.findByIdAndUpdate(
      id,
      { $set: productData(data, true) },
      { new: true, runValidators: true },
    );
    if (!updated)
      throw httpError(404, 'El producto no existe');
    return updated;
  }

  async delete(id) {
    const deleted = await this.productRepo.findByIdAndDelete(id);
    if (!deleted)
      throw httpError(404, 'El producto no existe');
  }
}
