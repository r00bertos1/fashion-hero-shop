"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { CloseIcon, SearchIcon } from "./icons";
import { products } from "@/data/products";

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function productGradient(hex: string): string {
  return `radial-gradient(ellipse at 50% 60%, ${hex}33 0%, ${hex}11 40%, #ece9e2 70%)`;
}

export function SearchModal({ isOpen, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 6);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      document.body.style.overflow = "hidden";
    } else {
      setQuery("");
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drop-down panel */}
      <div className="relative bg-white shadow-lg w-full">
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Search input */}
          <div className="flex items-center gap-3 border-b border-black/10 pb-3">
            <SearchIcon className="h-5 w-5 text-warm-gray flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                const newQuery = e.target.value;
                setQuery(newQuery);
                if (newQuery.trim().length >= 2) {
                  const q = newQuery.toLowerCase();
                  const matchCount = products.filter((p) => p.name.toLowerCase().includes(q)).length;
                  posthog.capture("search_performed", {
                    query: newQuery.trim(),
                    result_count: Math.min(matchCount, 6),
                  });
                }
              }}
              placeholder="Search for shoes..."
              className="flex-1 text-base text-charcoal placeholder:text-warm-gray outline-none bg-transparent"
            />
            <button onClick={onClose} className="p-1 hover:opacity-60 transition-opacity" aria-label="Close search">
              <CloseIcon />
            </button>
          </div>

          {/* Results */}
          {query.trim() && (
            <div className="mt-4">
              {results.length === 0 ? (
                <p className="text-sm text-warm-gray py-4">No products found for &ldquo;{query}&rdquo;</p>
              ) : (
                <div className="space-y-2">
                  {results.map((product) => {
                    const color = product.colors[0];
                    return (
                      <Link
                        key={product.id}
                        href={`/products/${product.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 p-2 rounded hover:bg-cream transition-colors"
                      >
                        <div
                          className="w-14 h-14 flex-shrink-0 rounded flex items-center justify-center"
                          style={{ background: productGradient(color.hex) }}
                        >
                          <div className="relative w-3/5 h-2/5">
                            <div
                              className="absolute inset-0 rounded-[50%]"
                              style={{
                                background: `${color.hex}66`,
                                transform: "rotate(-8deg) scaleX(1.4)",
                              }}
                            />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[12px] font-medium uppercase tracking-[0.5px] truncate">
                            {product.name}
                          </h4>
                          <p className="text-[12px] text-warm-gray">{color.name}</p>
                        </div>
                        <span className="text-[14px] font-medium">{product.price} zl</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
