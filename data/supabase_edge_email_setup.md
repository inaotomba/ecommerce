# Supabase Edge Email Setup

This project sends real order emails with a Supabase Edge Function and Resend.
No email API key should be stored in Next.js or exposed to the browser.

## 1. Run the SQL hardening script

Open Supabase SQL editor and run:

`data/mvp_backend_hardening.sql`

This creates the `order_email_notifications` table and makes checkout insert one
notification row after an order is created.

## 2. Create Resend credentials

In Resend:

- verify your sending domain
- create an API key
- choose a from address, for example `Orders <orders@yourdomain.com>`

## 3. Set Edge Function secrets

In Supabase Dashboard, open:

Project Settings -> Edge Functions -> Secrets

Add these secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `ORDER_EMAIL_FROM`
- `ORDER_ADMIN_EMAIL`
- `EMAIL_WEBHOOK_SECRET`

Use a long random value for `EMAIL_WEBHOOK_SECRET`. Do not put these values in
chat, source code, or `.env.local`.

## 4. Deploy the function

From the project root:

```bash
supabase functions deploy send-order-notification --no-verify-jwt
```

The function still checks `x-email-webhook-secret`, so the database webhook must
send that header.

## 5. Create a Database Webhook

In Supabase Dashboard, open:

Database -> Webhooks -> Create a new webhook

Use:

- Table: `order_email_notifications`
- Event: `Insert`
- Type: `HTTP Request`
- Method: `POST`
- URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-order-notification`
- Header: `x-email-webhook-secret: YOUR_EMAIL_WEBHOOK_SECRET`
- Header: `Content-Type: application/json`

The webhook payload contains the inserted notification row. The Edge Function
uses `order_id` from that row, loads the order, order items, and customer
profile, then sends:

- a customer order request confirmation
- an admin new order alert

## 6. Test

Place a real test order from checkout.

Confirm:

- a row appears in `orders`
- a row appears in `order_items`
- stock is reduced in `product_variants`
- a row appears in `order_email_notifications`
- customer email is received
- admin email is received

If email fails, check:

- Supabase Edge Function logs
- Resend logs
- `EMAIL_WEBHOOK_SECRET` header matches the function secret
- `ORDER_EMAIL_FROM` uses a verified Resend domain
