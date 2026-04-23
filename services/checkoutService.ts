// NOTE: This file is currently unused — buildShippingOptions is defined
// directly in app/api/checkout/route.ts. Keeping this file for potential
// future extraction but it must not cause build errors.

export type ShippingOption = {
  id: string;
  name: string;
  price: number;
  deliveryTime?: string;
};

function buildShippingOptions(options: any[]): ShippingOption[] {
    return options.map(option => ({
        id: option.id,
        name: option.name,
        price: option.price,
        deliveryTime: option.deliveryTime,
    }));
}

export { buildShippingOptions };
