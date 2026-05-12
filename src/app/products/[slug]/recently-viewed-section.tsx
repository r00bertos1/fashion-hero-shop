"use client";

import { useEffect } from "react";
import posthog from "posthog-js";
import { RecentlyViewed, trackRecentlyViewed } from "@/components/recently-viewed";

interface RecentlyViewedSectionProps {
  productId: string;
  productName: string;
  productCategory: string;
  productPrice: number;
}

export function RecentlyViewedSection({ productId, productName, productCategory, productPrice }: RecentlyViewedSectionProps) {
  useEffect(() => {
    trackRecentlyViewed(productId);
    posthog.capture("product_viewed", {
      product_id: productId,
      product_name: productName,
      product_category: productCategory,
      product_price: productPrice,
    });
  }, [productId, productName, productCategory, productPrice]);

  return <RecentlyViewed currentProductId={productId} />;
}
