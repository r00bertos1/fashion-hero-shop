"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import type { Product, ProductColor } from "@/types";
import { StarIcon } from "@/components/icons";
import { ColorSwatches } from "@/components/color-swatches";
import { SizeSelector } from "@/components/size-selector";
import { useCart } from "@/components/cart-provider";
import { WishlistButton } from "@/components/wishlist-button";
import { getSellerById } from "@/data/sellers";

interface ProductInfoProps {
  product: Product;
}

function StarRating({ rating, count }: { rating: number; count: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.5;

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon
            key={i}
            filled={i < fullStars || (i === fullStars && hasHalf)}
            className="h-3.5 w-3.5 text-charcoal"
          />
        ))}
      </div>
      <span className="text-xs text-warm-gray">({count})</span>
    </div>
  );
}

/** Deterministic stock level based on product id */
function getStockInfo(productId: string): { inStock: boolean; lowStock: boolean; quantity: number } {
  const hash = productId.charCodeAt(0) + (productId.charCodeAt(1) || 0);
  const quantity = (hash % 20) + 1;
  return {
    inStock: true,
    lowStock: quantity <= 5,
    quantity,
  };
}

function getEstimatedDelivery(): string {
  const now = new Date();
  const minDays = 5;
  const maxDays = 7;
  const startDate = new Date(now.getTime() + minDays * 86400000);
  const endDate = new Date(now.getTime() + maxDays * 86400000);
  const fmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
  return `${fmt.format(startDate)} - ${fmt.format(endDate)}`;
}

export function ProductInfo({ product }: ProductInfoProps) {
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0]);
  const [selectedSize, setSelectedSize] = useState<number | null>(null);
  const { addItem } = useCart();

  const stock = useMemo(() => getStockInfo(product.id), [product.id]);
  const seller = getSellerById(product.sellerId);
  const deliveryDate = useMemo(() => getEstimatedDelivery(), []);

  const collectionName = product.category === "men"
    ? "Men's Shoes"
    : product.category === "women"
    ? "Women's Shoes"
    : "Shoes";

  const collectionSlug = product.category === "men"
    ? "mens"
    : product.category === "women"
    ? "womens"
    : "mens";

  function handleAddToCart() {
    if (!selectedSize) return;
    addItem(product, selectedColor, selectedSize);
    posthog.capture("product_added_to_cart", {
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      product_price: product.price,
      product_category: product.category,
      color: selectedColor.name,
      size: selectedSize,
    });
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Breadcrumb — subtle */}
      <nav className="flex items-center gap-1.5 text-[11px] text-warm-gray/70">
        <Link href="/" className="hover:text-charcoal transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={`/collections/${collectionSlug}`} className="hover:text-charcoal transition-colors">
          {collectionName}
        </Link>
        <span>/</span>
        <span className="text-charcoal/60">{product.name}</span>
      </nav>

      {/* Product name + wishlist */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-normal text-charcoal mb-2">
            {product.name}
          </h1>
          <WishlistButton productId={product.id} className="mt-1 flex-shrink-0" />
        </div>
        <StarRating rating={product.rating} count={product.reviewCount} />
        {seller && (
          <Link
            href={`/collections/all?seller=${seller.slug}`}
            className="text-[12px] text-warm-gray hover:text-charcoal transition-colors mt-1 inline-block"
          >
            Sold by <span className="underline">{seller.name}</span>
            {seller.rating >= 4.5 && (
              <span className="inline-block ml-1 text-[9px] bg-charcoal/10 text-charcoal/70 px-1 py-0.5 rounded uppercase tracking-wide no-underline">
                Pro
              </span>
            )}
          </Link>
        )}
      </div>

      {/* Price */}
      <div className="flex items-center gap-3">
        <span className="text-lg font-medium text-charcoal">{product.price} zl</span>
        {product.originalPrice && (
          <span className="text-sm text-warm-gray line-through">
            {product.originalPrice} zl
          </span>
        )}
      </div>

      {/* Stock indicator */}
      <div className="flex items-center gap-2">
        {stock.lowStock ? (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-amber-700 font-medium">
              Low Stock — Only {stock.quantity} left
            </span>
          </>
        ) : (
          <>
            <span className="inline-block w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-green-700 font-medium">
              In Stock — Ready to Ship
            </span>
          </>
        )}
      </div>

      {/* Color swatches */}
      <ColorSwatches
        colors={product.colors}
        selectedColor={selectedColor}
        onSelect={setSelectedColor}
      />

      {/* Size selector */}
      <SizeSelector
        sizes={product.sizes}
        selectedSize={selectedSize}
        onSelect={setSelectedSize}
      />

      {/* Add to cart — prominent dark button */}
      <button
        onClick={handleAddToCart}
        disabled={!selectedSize}
        className="w-full py-4 bg-charcoal text-white text-[12px] font-medium uppercase tracking-[0.6px] rounded-full hover:bg-charcoal-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {selectedSize ? "ADD TO CART - " + product.price + " zl" : "SELECT A SIZE"}
      </button>

      {/* Shipping info */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <p className="text-xs text-warm-gray">
          Free Shipping on Orders over 299 zl
        </p>
        <p className="text-xs text-warm-gray">
          Estimated delivery: {deliveryDate}
        </p>
        <p className="text-xs text-warm-gray">
          Easy Returns
        </p>
      </div>
    </div>
  );
}
