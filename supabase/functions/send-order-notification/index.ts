type OrderNotificationPayload = {
  new?: {
    id?: string;
    order_id?: string;
  };
  order_id?: string;
  record?: {
    id?: string;
    order_id?: string;
  };
};

type OrderRow = {
  created_at: string | null;
  guest_email: string | null;
  id: string;
  order_number: string;
  payment_status: string;
  profile_id: string | null;
  status: string;
  total_amount: number;
};

type OrderItemRow = {
  line_total: number;
  product_name_snapshot: string;
  quantity: number;
  size_snapshot: string | null;
  sku_snapshot: string | null;
  unit_price_snapshot: number;
};

type ProfileRow = {
  email: string;
  full_name: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-email-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Origin": "*",
};

function requiredEnv(name: string) {
  const value = Deno.env.get(name);

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

function getOrderId(payload: OrderNotificationPayload) {
  return payload.order_id ?? payload.record?.order_id ?? payload.new?.order_id ?? null;
}

function getNotificationId(payload: OrderNotificationPayload) {
  return payload.record?.id ?? payload.new?.id ?? null;
}

function restHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

function restUrl(supabaseUrl: string, path: string) {
  return `${supabaseUrl.replace(/\/$/, "")}/rest/v1/${path}`;
}

async function fetchRows<T>(
  supabaseUrl: string,
  serviceRoleKey: string,
  path: string,
) {
  const response = await fetch(restUrl(supabaseUrl, path), {
    headers: restHeaders(serviceRoleKey),
  });

  if (!response.ok) {
    throw new Error(`Supabase REST read failed: ${await response.text()}`);
  }

  return (await response.json()) as T[];
}

async function patchNotificationStatus({
  notificationId,
  processedAt,
  serviceRoleKey,
  status,
  supabaseUrl,
}: {
  notificationId: string | null;
  processedAt?: string;
  serviceRoleKey: string;
  status: string;
  supabaseUrl: string;
}) {
  if (!notificationId) {
    return;
  }

  const body: Record<string, string> = { status };

  if (processedAt) {
    body.processed_at = processedAt;
  }

  const response = await fetch(
    restUrl(
      supabaseUrl,
      `order_email_notifications?id=eq.${encodeURIComponent(notificationId)}`,
    ),
    {
      body: JSON.stringify(body),
      headers: {
        ...restHeaders(serviceRoleKey),
        Prefer: "return=minimal",
      },
      method: "PATCH",
    },
  );

  if (!response.ok) {
    console.error("Could not update notification status", {
      status: response.status,
    });
  }
}

function buildOrderHtml({
  customerName,
  items,
  order,
}: {
  customerName: string;
  items: OrderItemRow[];
  order: OrderRow;
}) {
  const rows = items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;">
            <strong>${item.product_name_snapshot}</strong><br />
            <span style="color:#666;">Size ${item.size_snapshot ?? "OS"} / SKU ${
              item.sku_snapshot ?? "N/A"
            }</span>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:center;">
            ${item.quantity}
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e5e5e5;text-align:right;">
            ${formatCurrency(item.line_total)}
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111;">
      <h1 style="font-size:28px;letter-spacing:-1px;text-transform:uppercase;">
        Order Request Received
      </h1>
      <p>Hello ${customerName},</p>
      <p>
        Your order request <strong>${order.order_number}</strong> has been received.
        No online payment was collected. The store will confirm stock and payment manually.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-top:24px;">
        <thead>
          <tr>
            <th style="text-align:left;border-bottom:2px solid #111;padding-bottom:8px;">Item</th>
            <th style="text-align:center;border-bottom:2px solid #111;padding-bottom:8px;">Qty</th>
            <th style="text-align:right;border-bottom:2px solid #111;padding-bottom:8px;">Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:20px;font-weight:700;text-align:right;margin-top:24px;">
        Total ${formatCurrency(order.total_amount)}
      </p>
    </div>
  `;
}

async function sendEmail({
  from,
  html,
  resendApiKey,
  subject,
  text,
  to,
}: {
  from: string;
  html: string;
  resendApiKey: string;
  subject: string;
  text: string;
  to: string[];
}) {
  const response = await fetch("https://api.resend.com/emails", {
    body: JSON.stringify({
      from,
      html,
      subject,
      text,
      to,
    }),
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Email provider failed: ${await response.text()}`);
  }
}

Deno.serve(async (request) => {
  let notificationId: string | null = null;
  let serviceRoleKey: string | null = null;
  let supabaseUrl: string | null = null;

  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return Response.json(
      { error: "Method not allowed." },
      { headers: corsHeaders, status: 405 },
    );
  }

  try {
    const webhookSecret = requiredEnv("EMAIL_WEBHOOK_SECRET");
    const requestSecret = request.headers.get("x-email-webhook-secret");

    if (!requestSecret || requestSecret !== webhookSecret) {
      return Response.json(
        { error: "Unauthorized." },
        { headers: corsHeaders, status: 401 },
      );
    }

    supabaseUrl = requiredEnv("SUPABASE_URL");
    serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = requiredEnv("RESEND_API_KEY");
    const fromEmail = requiredEnv("ORDER_EMAIL_FROM");
    const adminEmail = requiredEnv("ORDER_ADMIN_EMAIL");
    const payload = (await request.json()) as OrderNotificationPayload;
    const orderId = getOrderId(payload);
    notificationId = getNotificationId(payload);

    console.info("Order email webhook received", {
      hasNotificationId: Boolean(notificationId),
      hasOrderId: Boolean(orderId),
    });

    if (!orderId) {
      return Response.json(
        { error: "Missing order id." },
        { headers: corsHeaders, status: 400 },
      );
    }

    await patchNotificationStatus({
      notificationId,
      serviceRoleKey,
      status: "processing",
      supabaseUrl,
    });

    const orders = await fetchRows<OrderRow>(
      supabaseUrl,
      serviceRoleKey,
      `orders?select=id,order_number,profile_id,guest_email,total_amount,status,payment_status,created_at&id=eq.${encodeURIComponent(
        orderId,
      )}`,
    );
    const order = orders[0];

    if (!order) {
      throw new Error("Order not found.");
    }

    console.info("Order loaded for email notification", {
      orderNumber: order.order_number,
    });

    const [items, profiles] = await Promise.all([
      fetchRows<OrderItemRow>(
        supabaseUrl,
        serviceRoleKey,
        `order_items?select=product_name_snapshot,sku_snapshot,size_snapshot,unit_price_snapshot,quantity,line_total&order_id=eq.${encodeURIComponent(
          order.id,
        )}`,
      ),
      order.profile_id
        ? fetchRows<ProfileRow>(
            supabaseUrl,
            serviceRoleKey,
            `profiles?select=email,full_name&id=eq.${encodeURIComponent(
              order.profile_id,
            )}`,
          )
        : Promise.resolve([]),
    ]);

    const profile = profiles[0] ?? null;
    const customerEmail = profile?.email ?? order.guest_email;
    const customerName = profile?.full_name ?? "Customer";
    const html = buildOrderHtml({
      customerName,
      items,
      order,
    });
    const text = `Order request ${order.order_number} received. Total ${formatCurrency(
      order.total_amount,
    )}. No online payment was collected.`;

    if (customerEmail) {
      await sendEmail({
        from: fromEmail,
        html,
        resendApiKey,
        subject: `Order request ${order.order_number} received`,
        text,
        to: [customerEmail],
      });

      console.info("Customer order email sent", {
        orderNumber: order.order_number,
      });
    }

    await sendEmail({
      from: fromEmail,
      html,
      resendApiKey,
      subject: `New order request ${order.order_number}`,
      text,
      to: [adminEmail],
    });

    console.info("Admin order email sent", {
      orderNumber: order.order_number,
    });

    await patchNotificationStatus({
      notificationId,
      processedAt: new Date().toISOString(),
      serviceRoleKey,
      status: "sent",
      supabaseUrl,
    });

    return Response.json(
      {
        ok: true,
        order_number: order.order_number,
        sent_admin_email: true,
        sent_customer_email: Boolean(customerEmail),
      },
      { headers: corsHeaders },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Notification failed.";

    console.error("Order notification failed", { message });

    if (notificationId && serviceRoleKey && supabaseUrl) {
      await patchNotificationStatus({
        notificationId,
        processedAt: new Date().toISOString(),
        serviceRoleKey,
        status: "failed",
        supabaseUrl,
      });
    }

    return Response.json(
      { error: message },
      { headers: corsHeaders, status: 500 },
    );
  }
});
