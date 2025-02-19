interface OrderDetails {
  orderNumber: string;
  totalPrice: string;
  customerEmail?: string;
}

interface FulfillmentDetails {
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
}

export const whatsappTemplates = {
  orderCreated: (details: OrderDetails): string => {
    return `New Order #${details.orderNumber}!\n\n` +
      `Amount: $${details.totalPrice}\n` +
      (details.customerEmail ? `Customer: ${details.customerEmail}\n` : '') +
      `Status: Order received`;
  },
  
  fulfillmentCreated: (details: FulfillmentDetails): string => {
    return `Order #${details.orderNumber} Update!\n\n` +
      `Status: Order shipped\n` +
      (details.trackingNumber ? `Tracking Number: ${details.trackingNumber}\n` : '') +
      (details.trackingUrl ? `Track your order: ${details.trackingUrl}` : '');
  },
}; 