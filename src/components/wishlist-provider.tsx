"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import posthog from "posthog-js";

interface WishlistContextType {
  wishlistItems: string[];
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | null>(null);

const STORAGE_KEY = "stepforward-wishlist";

function loadWishlist(): string[] {
  try {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveWishlist(items: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable
  }
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);

  useEffect(() => {
    setWishlistItems(loadWishlist());
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlistItems((prev) => {
      const isCurrentlyWishlisted = prev.includes(productId);
      const next = isCurrentlyWishlisted
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      saveWishlist(next);
      posthog.capture(isCurrentlyWishlisted ? "product_unwishlisted" : "product_wishlisted", {
        product_id: productId,
      });
      return next;
    });
  }, []);

  const isWishlisted = useCallback(
    (productId: string) => wishlistItems.includes(productId),
    [wishlistItems]
  );

  return (
    <WishlistContext.Provider value={{ wishlistItems, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
}
