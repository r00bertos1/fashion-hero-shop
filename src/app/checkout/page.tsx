"use client";

import Link from "next/link";
import posthog from "posthog-js";
import { useCart } from "@/components/cart-provider";

export default function CheckoutPage() {
  const { items } = useCart();

  const subtotal = items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const shipping = subtotal >= 299 ? 0 : 19.9;
  const total = subtotal + shipping;

  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.6px] text-warm-gray">
          <li>
            <Link href="/" className="hover:text-charcoal transition-colors">
              Home
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-charcoal">Checkout</li>
        </ol>
      </nav>

      <h1 className="text-[32px] font-normal text-charcoal mb-8">Checkout</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-warm-gray mb-6">Your cart is empty.</p>
          <Link href="/" className="btn-cta">
            CONTINUE SHOPPING
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-10 lg:gap-16">
          {/* Left: Form */}
          <div>
            {/* Shipping Information */}
            <section className="mb-10">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.8px] text-charcoal mb-5 pb-2 border-b border-border">
                SHIPPING INFORMATION
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-warm-gray mb-1.5">First Name</label>
                  <input
                    type="text"
                    className="w-full border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-charcoal transition-colors"
                    placeholder="First name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-gray mb-1.5">Last Name</label>
                  <input
                    type="text"
                    className="w-full border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-charcoal transition-colors"
                    placeholder="Last name"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-warm-gray mb-1.5">Email</label>
                  <input
                    type="email"
                    className="w-full border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-charcoal transition-colors"
                    placeholder="you@example.com"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs text-warm-gray mb-1.5">Address</label>
                  <input
                    type="text"
                    className="w-full border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-charcoal transition-colors"
                    placeholder="Street address"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-gray mb-1.5">City</label>
                  <input
                    type="text"
                    className="w-full border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-charcoal transition-colors"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-gray mb-1.5">State</label>
                  <input
                    type="text"
                    className="w-full border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-charcoal transition-colors"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-gray mb-1.5">ZIP Code</label>
                  <input
                    type="text"
                    className="w-full border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-charcoal transition-colors"
                    placeholder="ZIP"
                  />
                </div>
                <div>
                  <label className="block text-xs text-warm-gray mb-1.5">Country</label>
                  <input
                    type="text"
                    className="w-full border border-border px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-charcoal transition-colors"
                    defaultValue="United States"
                    readOnly
                  />
                </div>
              </div>
            </section>

            {/* Payment */}
            <section className="mb-10">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.8px] text-charcoal mb-5 pb-2 border-b border-border">
                PAYMENT
              </h2>
              <div className="bg-cream-light px-6 py-8 text-center">
                <p className="text-sm text-warm-gray mb-1">Payment integration coming soon.</p>
                <p className="text-xs text-warm-gray/60">This is a demo checkout page.</p>
              </div>
            </section>

            {/* Place Order */}
            <button
              className="btn-cta w-full sm:w-auto sm:min-w-[280px]"
              onClick={() => {
                posthog.capture("checkout_initiated", {
                  item_count: items.reduce((sum, item) => sum + item.quantity, 0),
                  subtotal,
                  total,
                  currency: "PLN",
                  products: items.map((item) => ({
                    product_id: item.product.id,
                    product_name: item.product.name,
                    quantity: item.quantity,
                    price: item.product.price,
                  })),
                });
              }}
            >
              PLACE ORDER
            </button>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-cream-light p-6 sticky top-20">
              <h2 className="text-[12px] font-medium uppercase tracking-[0.8px] text-charcoal mb-5 pb-2 border-b border-cream-dark">
                ORDER SUMMARY
              </h2>

              <div className="space-y-4 mb-6">
                {items.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    {/* Thumbnail */}
                    <div
                      className="w-16 h-16 rounded flex-shrink-0"
                      style={{
                        background: `radial-gradient(ellipse at 50% 55%, ${item.color.hex}44 0%, ${item.color.hex}22 35%, #ece9e2 65%)`,
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium uppercase tracking-wide truncate">
                        {item.product.name}
                      </h3>
                      <p className="text-xs text-warm-gray">
                        {item.color.name} / Size {item.size}
                      </p>
                      <p className="text-xs text-warm-gray">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-charcoal">
                      {(item.product.price * item.quantity).toFixed(0)} zl
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 pt-4 border-t border-cream-dark">
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Subtotal</span>
                  <span className="font-medium">{subtotal.toFixed(0)} zl</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-warm-gray">Shipping</span>
                  <span className="font-medium">
                    {shipping === 0 ? "Free" : `${shipping.toFixed(2)} zl`}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-3 border-t border-cream-dark mt-3">
                  <span className="font-medium text-charcoal">Total</span>
                  <span className="font-medium text-charcoal text-lg">{total.toFixed(2)} zl</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
