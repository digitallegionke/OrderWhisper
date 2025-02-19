import { useEffect, useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  TextField,
  Select,
  FormLayout,
  Banner,
  List,
  Link,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  
  // Handle form submission here
  return { success: true };
};

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [apiKey, setApiKey] = useState("");
  
  const notificationEvents = [
    { label: "Order created", value: "order_created" },
    { label: "Order fulfilled", value: "order_fulfilled" },
    { label: "Order cancelled", value: "order_cancelled" },
    { label: "Payment failed", value: "payment_failed" },
  ];

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const handleSubmit = () => {
    fetcher.submit(
      {
        phoneNumber,
        apiKey,
        events: JSON.stringify(selectedEvents),
      },
      { method: "POST" }
    );
  };

  return (
    <Page>
      <TitleBar title="WhatsApp Notifications" />
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  WhatsApp Notification Settings
                </Text>
                
                <Banner tone="info">
                  Configure your WhatsApp Business API settings and choose which events should trigger notifications.
                </Banner>

                <FormLayout>
                  <TextField
                    label="WhatsApp Business Phone Number"
                    type="tel"
                    value={phoneNumber}
                    onChange={setPhoneNumber}
                    helpText="Enter your WhatsApp Business phone number with country code"
                    autoComplete="tel"
                  />

                  <TextField
                    label="WhatsApp Business API Key"
                    type="password"
                    value={apiKey}
                    onChange={setApiKey}
                    helpText="Your WhatsApp Business API key from Meta Business Manager"
                    autoComplete="off"
                  />

                  <Select
                    label="Notification Events"
                    options={notificationEvents}
                    onChange={(selected) => {
                      const value = selected as string;
                      setSelectedEvents(prev => 
                        prev.includes(value)
                          ? prev.filter(e => e !== value)
                          : [...prev, value]
                      );
                    }}
                    value={selectedEvents[0] || ""}
                    helpText="Select events that will trigger WhatsApp notifications"
                  />

                  {selectedEvents.length > 0 && (
                    <BlockStack gap="200">
                      <Text variant="bodyMd" as="p">Selected events:</Text>
                      <List type="bullet">
                        {selectedEvents.map((event) => (
                          <List.Item key={event}>
                            {notificationEvents.find(e => e.value === event)?.label}
                          </List.Item>
                        ))}
                      </List>
                    </BlockStack>
                  )}

                  <Button
                    variant="primary"
                    onClick={handleSubmit}
                    loading={fetcher.state === "submitting"}
                  >
                    Save Settings
                  </Button>
                </FormLayout>
              </BlockStack>
            </Card>
          </Layout.Section>

          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Resources
                  </Text>
                  <List type="bullet">
                    <List.Item>
                      <Link
                        url="https://developers.facebook.com/docs/whatsapp/cloud-api"
                        target="_blank"
                        removeUnderline
                      >
                        WhatsApp Business API Documentation
                      </Link>
                    </List.Item>
                    <List.Item>
                      <Link
                        url="https://business.whatsapp.com/"
                        target="_blank"
                        removeUnderline
                      >
                        WhatsApp Business Platform
                      </Link>
                    </List.Item>
                    <List.Item>
                      <Link
                        url="https://www.shopify.com/notification-settings"
                        target="_blank"
                        removeUnderline
                      >
                        Shopify Notification Settings
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
