/** DTOs mirroring the FastAPI backend. Optional fields keep us tolerant to naming drift. */

export type Role = "buyer" | "seller" | "admin";

export interface ApiUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: Role;
  is_active?: boolean;
  created_at?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user?: ApiUser;
}

export interface UserPreferences {
  currency: string;
  preferred_categories: string[];
  preferred_brands: string[];
  default_max_budget: number | null;
}

export interface ApiProduct {
  id: string;
  name?: string;
  title?: string;
  description?: string | null;
  price?: number;
  base_price?: number;
  currency?: string;
  category?: string | null;
  brand?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  seller_id?: string;
  stock?: number;
  quantity_available?: number;
  rating?: number;
  is_active?: boolean;
}

/** Normalised product used by the UI. */
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  brand: string;
  image: string | null;
  sellerId: string | null;
  stock: number | null;
  rating: number | null;
}

export interface SellerProfile {
  id: string;
  user_id?: string;
  business_name?: string;
  store_name?: string;
  description?: string | null;
  contact_email?: string | null;
  phone?: string | null;
  rating?: number | null;
  is_verified?: boolean;
}

export interface NegotiationConfig {
  auto_accept_threshold?: number | null;
  min_acceptable_price?: number | null;
  min_price?: number | null;
  max_discount_percent?: number | null;
  max_rounds?: number | null;
  strategy?: string | null;
}

export interface InventoryRecord {
  id?: string;
  product_id: string;
  quantity_available: number;
  quantity_reserved?: number;
  low_stock_threshold?: number;
}

export interface RecommendationRequest {
  intent: string;
  budget?: number | null;
  category?: string | null;
  preferred_brands?: string[];
  currency?: string;
}

export interface RecommendationItem {
  product_id?: string;
  product?: ApiProduct | null;
  name?: string;
  reason?: string | null;
  score?: number | null;
  price?: number | null;
}

export interface RecommendationResponse {
  recommendations?: RecommendationItem[];
  items?: RecommendationItem[];
  summary?: string | null;
  reasoning?: string | null;
}

export type NegotiationTurn = "buyer" | "seller";
export type NegotiationStatus =
  | "pending"
  | "active"
  | "in_progress"
  | "accepted"
  | "rejected"
  | "expired"
  | "completed"
  | "cancelled";

export interface NegotiationOffer {
  id?: string;
  negotiation_id?: string;
  offer_by?: NegotiationTurn | string;
  actor?: NegotiationTurn | string;
  role?: NegotiationTurn | string;
  amount?: number;
  price?: number;
  offer_price?: number;
  message?: string | null;
  reasoning?: string | null;
  action?: string | null;
  round?: number | null;
  created_at?: string | null;
}

export interface Negotiation {
  id: string;
  buyer_id?: string;
  seller_id?: string;
  product_id: string;
  buyer_agent_id?: string | null;
  seller_agent_id?: string | null;
  quantity?: number;
  initial_offer?: number;
  current_offer?: number | null;
  final_price?: number | null;
  max_price?: number | null;
  currency?: string;
  status: NegotiationStatus;
  current_turn?: NegotiationTurn;
  offers?: NegotiationOffer[];
  offer_history?: NegotiationOffer[];
  messages?: NegotiationOffer[];
  created_at?: string;
}

export interface Agent {
  id: string;
  user_id?: string;
  seller_id?: string;
  name?: string;
  strategy?: string | null;
}

export interface Order {
  id: string;
  negotiation_id?: string;
  buyer_id?: string;
  seller_id?: string;
  product_id?: string;
  quantity?: number;
  unit_price?: number | null;
  total_price?: number | null;
  total_amount?: number | null;
  currency?: string;
  status?: string;
  created_at?: string;
}