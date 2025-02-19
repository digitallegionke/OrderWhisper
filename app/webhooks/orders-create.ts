import { DeliveryMethod } from "@shopify/shopify-app-remix/server";
import ordersCreate from "./orders/create";

export const orderCreatedWebhook = {
  deliveryMethod: DeliveryMethod.Http,
  callbackUrl: "/webhooks/orders/create",
  callback: ordersCreate,
};