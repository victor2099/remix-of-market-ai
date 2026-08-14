export type OfferStatus = "pending" | "accepted" | "rejected" | "countered" | "expired";
export type NegotiationStatus = "negotiating" | "accepted" | "rejected" | "expired";
export type MessageAuthor = "buyer" | "seller" | "ai";

export interface Seller {
  id: string;
  name: string;
  verified: boolean;
  rating: number;
  sales: number;
  responseTime: string;
  memberSince: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  createdAt: string;
  body: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  currency: string;
  image: string;
  rating: number;
  reviewCount: number;
  negotiable: boolean;
  inStock: number;
  condition: string;
  location: string;
  description: string;
  highlights: string[];
  specs: { label: string; value: string }[];
  seller: Seller;
  reviews: Review[];
}

export interface Offer {
  id: string;
  amount: number;
  originalPrice: number;
  status: OfferStatus;
  by: MessageAuthor;
}

export interface NegotiationMessage {
  id: string;
  author: MessageAuthor;
  body?: string;
  offer?: Offer;
  createdAt: string;
  suggestion?: { amount: number; message: string };
}

export interface Negotiation {
  id: string;
  productId: string;
  status: NegotiationStatus;
  currentOffer: number | null;
  messages: NegotiationMessage[];
}