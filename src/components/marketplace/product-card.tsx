import { Link } from "@tanstack/react-router";
import { ImageOff } from "lucide-react";
import type { Product } from "@/types/api";
import { NegotiableBadge, Price, Rating } from "./primitives";

export function ProductThumb({
  src,
  alt,
  className,
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  if (!src) {
    return (
      <div
        className={`grid aspect-square w-full place-items-center bg-muted/60 text-muted-foreground ${className ?? ""}`}
      >
        <ImageOff className="size-6" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      width={1024}
      height={1024}
      className={`aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${className ?? ""}`}
    />
  );
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="surface group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised focus-within:shadow-raised">
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className="block overflow-hidden bg-muted/40 outline-none"
        aria-label={product.name}
      >
        <ProductThumb src={product.image} alt={product.name} />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            {product.category}
          </span>
          <NegotiableBadge />
        </div>
        <h3 className="min-w-0 text-sm font-semibold leading-snug text-foreground">
          <Link
            to="/product/$productId"
            params={{ productId: product.id }}
            className="line-clamp-2 hover:text-brand"
          >
            {product.name}
          </Link>
        </h3>
        {product.rating !== null ? <Rating value={product.rating} compact /> : null}
        <Price amount={product.price} currency={product.currency} size="md" className="mt-auto" />
        <p className="pt-1 text-xs text-muted-foreground">
          {product.brand || "Marketplace seller"}
          {product.stock !== null ? ` · ${product.stock} in stock` : ""}
        </p>
      </div>
    </article>
  );
}