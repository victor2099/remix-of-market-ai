import { queryOptions } from "@tanstack/react-query";
import { ApiError, mockDelay } from "./client";
import { buildInitialNegotiation, categories, products } from "./mock-data";
import type { Negotiation, Product } from "@/types/marketplace";

/* Service layer: swap the mock bodies for `apiRequest(...)` calls when the backend lands. */

export async function listProducts(search?: string): Promise<Product[]> {
  const q = search?.trim().toLowerCase();
  const result = q
    ? products.filter(
        (p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
      )
    : products;
  return mockDelay(result, 350);
}

export async function getProduct(id: string): Promise<Product> {
  const product = products.find((p) => p.id === id || p.slug === id);
  if (!product) throw new ApiError("Product not found", 404);
  return mockDelay(product, 350);
}

export async function getSimilarProducts(id: string): Promise<Product[]> {
  const product = products.find((p) => p.id === id);
  const similar = products.filter(
    (p) => p.id !== id && (!product || p.category === product.category || true),
  );
  return mockDelay(similar.slice(0, 4), 350);
}

export async function getNegotiation(productId: string): Promise<Negotiation> {
  const product = await getProduct(productId);
  return mockDelay(buildInitialNegotiation(product), 350);
}

export async function listCategories() {
  return mockDelay(categories, 200);
}

export interface SignUpInput {
  fullName: string;
  email: string;
  password: string;
}

export async function signUp(input: SignUpInput): Promise<{ id: string; email: string }> {
  if (input.email.endsWith("@taken.com")) throw new ApiError("That email is already in use", 409);
  return mockDelay({ id: "u_1", email: input.email }, 900);
}

export const productsQuery = (search?: string) =>
  queryOptions({ queryKey: ["products", search ?? ""], queryFn: () => listProducts(search) });

export const productQuery = (id: string) =>
  queryOptions({ queryKey: ["product", id], queryFn: () => getProduct(id) });

export const similarProductsQuery = (id: string) =>
  queryOptions({ queryKey: ["similar", id], queryFn: () => getSimilarProducts(id) });

export const negotiationQuery = (productId: string) =>
  queryOptions({ queryKey: ["negotiation", productId], queryFn: () => getNegotiation(productId) });

export const categoriesQuery = () =>
  queryOptions({ queryKey: ["categories"], queryFn: listCategories });