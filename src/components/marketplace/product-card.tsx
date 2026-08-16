import { Link } from "@tanstack/react-router";
import type { Product } from "@/types/api";
import { NegotiableBadge, Price, Rating } from "./primitives";

/** Text-only listing card — no imagery, just the product information. */
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="surface group flex flex-col gap-3 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised focus-within:shadow-raised">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
          {product.category}
        </span>
        <NegotiableBadge />
      </div>

      <h3 className="min-w-0 text-base font-semibold leading-snug text-foreground">
        <Link
          to="/product/$productId"
          params={{ productId: product.id }}
          className="line-clamp-2 outline-none hover:text-brand"
        >
          {product.name}
        </Link>
      </h3>

      {product.description ? (
        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {product.description}
        </p>
      ) : null}

      {product.rating !== null ? <Rating value={product.rating} compact /> : null}

      <Price amount={product.price} currency={product.currency} size="md" className="mt-auto" />

      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 border-t border-border pt-3 text-xs text-muted-foreground">
        <dt>Seller</dt>
        <dd className="text-right text-foreground">{product.brand || "Marketplace seller"}</dd>
        <dt>Stock</dt>
        <dd className="text-right text-foreground">
          {product.stock !== null ? `${product.stock} available` : "On request"}
        </dd>
      </dl>
    </article>
  );
}
