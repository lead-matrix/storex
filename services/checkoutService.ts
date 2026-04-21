function buildShippingOptions(
  std: ReturnType<typeof calculateShippingRate>,
  exp: ReturnType<typeof calculateShippingRate>,
  intlStd: ReturnType<typeof calculateShippingRate>,
  intlExp: ReturnType<typeof calculateShippingRate>
): Stripe.Checkout.SessionCreateParams.ShippingOption[] {
  const make = (r: ReturnType<typeof calculateShippingRate>): Stripe.Checkout.SessionCreateParams.ShippingOption => ({
    shipping_rate_data: {
      type: 'fixed_amount' as const,
      fixed_amount: { amount: Math.round(r.cost * 100), currency: 'usd' },
      display_name: r.name,
    },
  });
  return [make(std), make(exp), make(intlStd), make(intlExp)];
}

// Update line 142
shipping_options: shippingOptions as Stripe.Checkout.SessionCreateParams.ShippingOption[];