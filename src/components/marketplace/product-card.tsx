import { Link } from "@tanstack/react-router";
import type { Product } from "@/types/marketplace";
import { NegotiableBadge, Price, Rating, SellerBadge } from "./primitives";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="surface group flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised focus-within:shadow-raised">
      <Link
        to="/product/$productId"
        params={{ productId: product.id }}
        className="block overflow-hidden bg-muted/40 outline-none"
        aria-label={product.name}
      >
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={1024}
          height={1024}
          className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
            {product.category}
          </span>
          {product.negotiable ? <NegotiableBadge /> : null}
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
        <Rating value={product.rating} count={product.reviewCount} compact />
        <Price amount={product.price} currency={product.currency} size="md" className="mt-auto" />
        <SellerBadge seller={product.seller} className="pt-1" />
      </div>
    </article>
  );
}