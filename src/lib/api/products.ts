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

interface ProductListResponse {
  results?: ApiProduct[];
  products?: ApiProduct[];
  items?: ApiProduct[];
}

function productRows(response: ApiProduct[] | ProductListResponse): ApiProduct[] {
  if (Array.isArray(response)) return response;
  return response.results ?? response.products ?? response.items ?? [];
}

/** GET /products or GET /products/search when a query/min price is present. */
export async function listProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const useSearch = Boolean(filters.query?.trim()) || filters.minPrice !== undefined;
  const raw = useSearch
    ? await apiRequest<ApiProduct[] | ProductListResponse>("/products/search", {
        query: {
          query: filters.query?.trim(),
          category: filters.category,
          min_price: filters.minPrice,
          max_price: filters.maxPrice,
        },
      })
    : await apiRequest<ApiProduct[] | ProductListResponse>("/products", {
        query: { category: filters.category, max_price: filters.maxPrice },
      });
  return productRows(raw).map(normalizeProduct);
}

/** Single-product responses come wrapped as { product: {...} }. */
function productRow(response: ApiProduct | { product?: ApiProduct }): ApiProduct {
  if (response && typeof response === "object" && "product" in response && response.product) {
    return response.product;
  }
  return response as ApiProduct;
}

export async function getProduct(productId: string): Promise<Product> {
  return normalizeProduct(
    productRow(await apiRequest<ApiProduct | { product?: ApiProduct }>(`/products/${productId}`)),
  );
}

export async function listSellerProducts(sellerId: string): Promise<Product[]> {
  const raw = await apiRequest<ApiProduct[] | ProductListResponse>(
    `/sellers/${sellerId}/products`,
  );
  return productRows(raw ?? []).map(normalizeProduct);
}

export interface CreateProductInput {
  name: string;
  description: string;
  price: number;
  seller_id: string;
  category: string;
  currency?: string;
  attributes?: Record<string, unknown>;
  status?: string;
}

/** POST /products — Create Product */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  return normalizeProduct(
    productRow(
      await apiRequest<ApiProduct | { product?: ApiProduct }>("/products", {
        method: "POST",
        json: input,
      }),
    ),
  );
}

export interface UpdateProductInput {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  currency?: string;
  attributes?: Record<string, unknown>;
  status?: string;
}

/** PUT /products/{product_id} — Update Product */
export async function updateProduct(
  productId: string,
  input: UpdateProductInput,
): Promise<Product> {
  return normalizeProduct(
    await apiRequest<ApiProduct>(`/products/${productId}`, { method: "PUT", json: input }),
  );
}

/** DELETE /products/{product_id} — Deactivate Product */
export function deactivateProduct(productId: string): Promise<void> {
  return apiRequest<void>(`/products/${productId}`, { method: "DELETE" });
}

export function listSellerInventory(sellerId: string): Promise<InventoryRecord[]> {
  return apiRequest<InventoryRecord[]>(`/sellers/${sellerId}/inventory`);
}

export interface CreateInventoryInput {
  product_id: string;
  seller_id: string;
  quantity: number;
}

export function createInventory(input: CreateInventoryInput): Promise<InventoryRecord> {
  return apiRequest<InventoryRecord>("/inventory", { method: "POST", json: input });
}

/** GET /inventory/{inventory_id} — Get Inventory */
export function getInventory(inventoryId: string): Promise<InventoryRecord> {
  return apiRequest<InventoryRecord>(`/inventory/${inventoryId}`);
}

/** PATCH /inventory/{inventory_id} — Update Inventory */
export function updateInventory(
  inventoryId: string,
  input: Partial<InventoryRecord>,
): Promise<InventoryRecord> {
  return apiRequest<InventoryRecord>(`/inventory/${inventoryId}`, { method: "PATCH", json: input });
}

/** POST /inventory/{inventory_id}/reserve — Reserve Inventory */
export function reserveInventory(inventoryId: string, quantity: number): Promise<InventoryRecord> {
  return apiRequest<InventoryRecord>(`/inventory/${inventoryId}/reserve`, {
    method: "POST",
    json: { quantity },
  });
}

/** POST /inventory/{inventory_id}/release — Release Inventory */
export function releaseInventory(inventoryId: string, quantity: number): Promise<InventoryRecord> {
  return apiRequest<InventoryRecord>(`/inventory/${inventoryId}/release`, {
    method: "POST",
    json: { quantity },
  });
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