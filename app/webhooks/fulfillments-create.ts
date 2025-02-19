import { DeliveryMethod } from "@shopify/shopify-app-remix/server";
import fulfillmentsCreate from "./fulfillments/create";

export const fulfillmentCreatedWebhook = {
  deliveryMethod: DeliveryMethod.Http,
  callbackUrl: "/webhooks/fulfillments/create",
  callback: fulfillmentsCreate,
};