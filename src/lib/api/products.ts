import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "./client";
import type { ApiProduct, InventoryRecord, Product } from "@/types/api";

export const CATEGORIES = [
  "Electronics",
  "Phones",
  "Computers",
  "Fashion",
  "Home",
  "Sports",
  "Beauty",
  "Gaming",
] as const;

/** Backend field names vary slightly per resource — normalise once here. */
export function normalizeProduct(raw: ApiProduct): Product {
  return {
    id: String(raw.id),
    name: raw.name ?? raw.title ?? "Untitled product",
    description: raw.description ?? "",
    price: Number(raw.price ?? raw.base_price ?? 0),
    currency: raw.currency ?? "USD",
    category: raw.category ?? "Uncategorised",
    brand: raw.brand ?? "",
    image: raw.image_url ?? raw.images?.[0] ?? null,
    sellerId: raw.seller_id ?? null,
    stock: raw.stock ?? raw.quantity_available ?? null,
    rating: raw.rating ?? null,
  };
}

export interface ProductFilters {
  query?: string | undefined;
  category?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
}

/** GET /products or GET /products/search when a query/min price is present. */
export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const useSearch = Boolean(filters.query?.trim()) || filters.minPrice !== undefined;
  const raw = useSearch
    ? await apiRequest<ApiProduct[]>("/products/search", {
        query: {
          query: filters.query?.trim(),
          category: filters.category,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
        },
      })
    : await apiRequest<ApiProduct[]>("/products", {
        query: { category: filters.category, max_price: filters.maxPrice },
      });
  return (raw ?? []).map(normalizeProduct);
}

export async function getProduct(productId: string): Promise<Product> {
  return normalizeProduct(await apiRequest<ApiProduct>(`/products/${productId}`));
}

export async function listSellerProducts(sellerId: string): Promise<Product[]> {
  const raw = await apiRequest<ApiProduct[]>(`/sellers/${sellerId}/products`);
  return (raw ?? []).map(normalizeProduct);
}

export function listSellerInventory(sellerId: string): Promise<InventoryRecord[]> {
  return apiRequest<InventoryRecord[]>(`/sellers/${sellerId}/inventory`);
}

export function createInventory(input: InventoryRecord): Promise<InventoryRecord> {
  return apiRequest<InventoryRecord>("/inventory", { method: "POST", json: input });
}

export const productsQuery = (filters: ProductFilters = {}) =>
  queryOptions({
    queryKey: ["products", filters],
    queryFn: () => listProducts(filters),
  });

export const productQuery = (productId: string) =>
  queryOptions({ queryKey: ["product", productId], queryFn: () => getProduct(productId) });

export const sellerProductsQuery = (sellerId: string) =>
  queryOptions({
    queryKey: ["seller-products", sellerId],
    queryFn: () => listSellerProducts(sellerId),
  });

export const sellerInventoryQuery = (sellerId: string) =>
  queryOptions({
    queryKey: ["seller-inventory", sellerId],
    queryFn: () => listSellerInventory(sellerId),
  });