interface OrderDetails {
  orderNumber: string;
  totalPrice: string;
  customerEmail?: string;
  customerName?: string;
  orderUrl?: string;
}

interface FulfillmentDetails {
  orderNumber: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
  carrierName?: string;
}

/**
 * Templates for WhatsApp messages
 * Using WhatsApp's recommended formatting
 */
export const whatsappTemplates = {
  orderCreated: (details: OrderDetails): string => {
    const greeting = details.customerName ? `Hello ${details.customerName}!` : 'Hello!';
    const orderLink = details.orderUrl ? `\nTrack your order: ${details.orderUrl}` : '';
    
    return `${greeting}\n\n` +
      `Thank you for your order #${details.orderNumber}! 🛍️\n\n` +
      `Order Details:\n` +
      `• Amount: $${details.totalPrice}\n` +
      (details.customerEmail ? `• Confirmation sent to: ${details.customerEmail}\n` : '') +
      `• Status: Order received and being processed\n` +
      orderLink + '\n\n' +
      `We'll keep you updated on your order status. Thank you for shopping with us! 🙏`;
  },
  
  fulfillmentCreated: (details: FulfillmentDetails): string => {
    const trackingInfo = details.trackingNumber ? 
      `\n• Tracking Number: ${details.trackingNumber}` : '';
    const trackingLink = details.trackingUrl ? 
      `\n• Track your package: ${details.trackingUrl}` : '';
    const carrier = details.carrierName ? 
      `\n• Carrier: ${details.carrierName}` : '';
    const delivery = details.estimatedDelivery ? 
      `\n• Estimated Delivery: ${details.estimatedDelivery}` : '';

    return `Great news! 📦\n\n` +
      `Your order #${details.orderNumber} has been shipped!\n\n` +
      `Shipping Details:${trackingInfo}${carrier}${delivery}${trackingLink}\n\n` +
      `We hope you enjoy your purchase! If you have any questions, please don't hesitate to contact us.`;
  },

  orderCancelled: (details: OrderDetails): string => {
    return `Order Update ❗\n\n` +
      `Your order #${details.orderNumber} has been cancelled.\n\n` +
      `If you didn't request this cancellation or have any questions, please contact our support team immediately.\n\n` +
      `We apologize for any inconvenience.`;
  },

  paymentFailed: (details: OrderDetails): string => {
    return `Payment Alert ⚠️\n\n` +
      `We couldn't process the payment for your order #${details.orderNumber}.\n\n` +
      `Please update your payment information or contact our support team for assistance.\n\n` +
      `Amount due: $${details.totalPrice}\n` +
      (details.orderUrl ? `Update payment: ${details.orderUrl}\n\n` : '\n') +
      `Your order will be held for 24 hours before being cancelled.`;
  }
}; 