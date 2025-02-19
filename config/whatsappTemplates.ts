export const whatsappTemplates = {
    orderCreated: (orderNumber: string): string => 
        `Thank you for your order! Order #${orderNumber} has been placed. We'll notify you once it's dispatched.`,
    
    orderFulfilled: (orderNumber: string): string => 
        `Great news! Your order #${orderNumber} has been dispatched and is on its way to you. Expect delivery soon.`,
    
    // Add more templates as needed
};

export default whatsappTemplates; 