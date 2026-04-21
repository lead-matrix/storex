import { ShippingOption } from './types';

function buildShippingOptions(options: any[]): ShippingOption[] {
    return options.map(option => ({
        id: option.id,
        name: option.name,
        price: option.price,
        deliveryTime: option.deliveryTime,
    }));
}

export { buildShippingOptions };