import { json } from "@remix-run/node";
import type { LoaderFunctionArgs } from "@remix-run/node";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const host = request.headers.get("X-Forwarded-Host") ?? request.headers.get("host");

  try {
    const url = new URL("/", `http://${host}`);
    // Perform the health check
    // Add database check if needed
    return json({ status: "ok", time: new Date().toISOString() });
  } catch (error: any) {
    return json({ status: "error", message: error.message }, { status: 500 });
  }
}; 