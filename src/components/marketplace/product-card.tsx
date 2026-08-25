import { Link } from "@tanstack/react-router";
import type { Product } from "@/types/api";
import headphonesImage from "@/assets/product-headphones.jpg";
import laptopImage from "@/assets/product-laptop.jpg";
import phoneImage from "@/assets/product-phone.jpg";
import sneakerImage from "@/assets/product-sneaker.jpg";
import watchImage from "@/assets/product-watch.jpg";
import { NegotiableBadge, Price, Rating } from "./primitives";

const categoryImages: Record<string, string> = {
  Electronics: headphonesImage,
  Phones: phoneImage,
  Computers: laptopImage,
  Fashion: sneakerImage,
  Home: watchImage,
  Sports: sneakerImage,
  Beauty: watchImage,
  Gaming: laptopImage,
};

export function ProductCard({ product }: { product: Product }) {
  const image = product.image ?? categoryImages[product.category] ?? headphonesImage;
  return (
    <article className="surface group flex min-w-0 flex-col gap-4 overflow-hidden p-0 transition-all duration-200 hover:-translate-y-1 hover:shadow-raised focus-within:shadow-raised">
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={image}
          alt=""
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-foreground/35 to-transparent" />
        <div className="absolute left-4 top-4">
          <NegotiableBadge />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            {product.category}
          </span>
        </div>

        <h3 className="min-w-0 text-lg font-semibold leading-snug tracking-tight text-foreground">
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
      </div>
    </article>
  );
}
