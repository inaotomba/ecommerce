"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  ListOrdered,
  Mail,
  MapPin,
  RefreshCw,
  Truck,
  UserRound,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database, Json } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

type AdminOrderDetailViewProps = {
  orderId: string;
};

type AddressSnapshot = {
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  country?: string;
  full_name?: string;
  phone?: string;
  postal_code?: string;
  state?: string;
};

const orderStatuses = ["pending", "confirmed", "cancelled"] as const;
const paymentStatuses = ["unpaid", "paid"] as const;
const fulfillmentStatuses = ["unfulfilled", "processing", "fulfilled"] as const;

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Unknown";
}

function statusVariant(status: string) {
  if (status === "cancelled") {
    return "destructive" as const;
  }

  if (status === "pending" || status === "unfulfilled" || status === "unpaid") {
    return "secondary" as const;
  }

  return "default" as const;
}

function isAddressSnapshot(value: Json | null): value is AddressSnapshot {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function AddressCard({
  address,
  title,
}: {
  address: Json | null;
  title: string;
}) {
  const snapshot = isAddressSnapshot(address) ? address : null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <MapPin className="size-5 text-neutral-500" aria-hidden="true" />
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        {snapshot ? (
          <div className="grid gap-2 text-sm font-bold uppercase leading-5 text-neutral-600">
            <p className="text-black">{snapshot.full_name ?? "No name"}</p>
            <p>{snapshot.address_line_1}</p>
            {snapshot.address_line_2 ? <p>{snapshot.address_line_2}</p> : null}
            <p>
              {[snapshot.city, snapshot.state, snapshot.postal_code]
                .filter(Boolean)
                .join(", ")}
            </p>
            <p>{snapshot.country}</p>
            {snapshot.phone ? <p>Phone: {snapshot.phone}</p> : null}
          </div>
        ) : (
          <p className="text-sm font-bold uppercase text-neutral-500">
            No address snapshot saved.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function AdminOrderDetailView({ orderId }: AdminOrderDetailViewProps) {
  const supabase = createSupabaseBrowserClient();
  const [order, setOrder] = useState<Order | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isSaving, setIsSaving] = useState(false);

  const loadOrder = useCallback(async () => {
    const client = supabase;

    if (!client) {
      return;
    }

    setIsLoading(true);
    setError("");
    setNotice("");

    const [orderResult, itemsResult] = await Promise.all([
      client.from("orders").select("*").eq("id", orderId).maybeSingle(),
      client
        .from("order_items")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: true }),
    ]);

    const firstError = orderResult.error ?? itemsResult.error;

    if (firstError) {
      setError(firstError.message);
      setOrder(null);
      setItems([]);
      setProfile(null);
      setIsLoading(false);
      return;
    }

    let nextProfile: Profile | null = null;

    if (orderResult.data?.profile_id) {
      const { data: profileData, error: profileError } = await client
        .from("profiles")
        .select("*")
        .eq("id", orderResult.data.profile_id)
        .maybeSingle();

      if (profileError) {
        setNotice("Order loaded, but customer profile could not be loaded.");
      }

      nextProfile = profileData ?? null;
    }

    setOrder(orderResult.data ?? null);
    setItems(itemsResult.data ?? []);
    setProfile(nextProfile);
    setIsLoading(false);
  }, [orderId, supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrder();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOrder]);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  async function updateOrder(
    updates: Database["public"]["Tables"]["orders"]["Update"],
  ) {
    if (!supabase || !order) {
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");

    const { error: updateError } = await supabase
      .from("orders")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    setIsSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setOrder((current) => (current ? { ...current, ...updates } : current));
    setNotice("Order updated.");
  }

  if (!supabase) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="h-20 animate-pulse rounded-lg bg-neutral-100" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-40 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-40 animate-pulse rounded-lg bg-neutral-100" />
          <div className="h-40 animate-pulse rounded-lg bg-neutral-100" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order Not Found</CardTitle>
          <CardDescription>
            This order may have been deleted or your admin policy may not allow
            reading it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link href="/admin/orders">Back To Orders</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Button asChild variant="ghost" className="mb-4 px-0">
            <Link href="/admin/orders">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back To Orders
            </Link>
          </Button>
          <p className="text-sm font-black uppercase text-neutral-500">
            Admin Order
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.07em]">
            {order.order_number}
          </h2>
          <p className="mt-3 text-sm font-bold uppercase text-neutral-500">
            Created {formatDate(order.created_at)}
          </p>
        </div>
        <Button variant="outline" onClick={() => void loadOrder()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {(error || notice) && (
        <p
          className={`rounded-md border px-4 py-3 text-sm font-bold uppercase ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-neutral-200 bg-neutral-100 text-neutral-700"
          }`}
        >
          {error || notice}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">
                Order
              </p>
              <Badge className="mt-2" variant={statusVariant(order.status)}>
                {order.status}
              </Badge>
            </div>
            <ListOrdered className="size-6 text-neutral-500" aria-hidden="true" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">
                Payment
              </p>
              <Badge
                className="mt-2"
                variant={statusVariant(order.payment_status)}
              >
                {order.payment_status}
              </Badge>
            </div>
            <CreditCard className="size-6 text-neutral-500" aria-hidden="true" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between gap-3 p-4">
            <div>
              <p className="text-xs font-black uppercase text-neutral-500">
                Fulfillment
              </p>
              <Badge
                className="mt-2"
                variant={statusVariant(order.fulfillment_status)}
              >
                {order.fulfillment_status}
              </Badge>
            </div>
            <Truck className="size-6 text-neutral-500" aria-hidden="true" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manual Controls</CardTitle>
          <CardDescription>
            These controls update records only. They do not charge customers,
            create shipments, or contact payment providers.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase text-neutral-500">
              Order status
            </span>
            <Select
              value={order.status}
              disabled={isSaving}
              onChange={(event) =>
                void updateOrder({ status: event.target.value })
              }
            >
              {orderStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase text-neutral-500">
              Payment status
            </span>
            <Select
              value={order.payment_status}
              disabled={isSaving}
              onChange={(event) =>
                void updateOrder({ payment_status: event.target.value })
              }
            >
              {paymentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-black uppercase text-neutral-500">
              Fulfillment status
            </span>
            <Select
              value={order.fulfillment_status}
              disabled={isSaving}
              onChange={(event) =>
                void updateOrder({ fulfillment_status: event.target.value })
              }
            >
              {fulfillmentStatuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </Select>
          </label>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <UserRound className="size-5 text-neutral-500" aria-hidden="true" />
              <CardTitle>Customer</CardTitle>
            </div>
            <CardDescription>
              Account and contact details attached to this order.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm font-bold uppercase">
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Name</span>
              <span className="text-right">
                {profile?.full_name ?? "Not saved"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Email</span>
              <span className="break-all text-right">
                {profile?.email ?? order.guest_email ?? "Not saved"}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Phone</span>
              <span>{profile?.phone ?? "Not saved"}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Profile ID</span>
              <span className="break-all text-right">
                {order.profile_id ?? "Guest"}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-neutral-500" aria-hidden="true" />
              <CardTitle>Notification Placeholders</CardTitle>
            </div>
            <CardDescription>
              No email provider is connected. Use this as the manual follow-up
              checklist until email sending is added.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm font-bold uppercase">
            <div className="flex items-center justify-between gap-4 border border-neutral-200 p-3">
              <div>
                <p>Customer confirmation</p>
                <p className="mt-1 break-all text-xs text-neutral-500">
                  {profile?.email ?? order.guest_email ?? "No email saved"}
                </p>
              </div>
              <Badge variant="secondary">Manual</Badge>
            </div>
            <div className="flex items-center justify-between gap-4 border border-neutral-200 p-3">
              <div>
                <p>Admin new order alert</p>
                <p className="mt-1 text-xs text-neutral-500">
                  Send through your current store contact channel.
                </p>
              </div>
              <Badge variant="secondary">Manual</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px] xl:items-start">
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>
              {itemCount} units across {items.length} item lines.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <p className="font-black uppercase">
                        {item.product_name_snapshot}
                      </p>
                      <p className="mt-1 break-all text-xs font-bold uppercase text-neutral-500">
                        {item.product_id}
                      </p>
                    </TableCell>
                    <TableCell>{item.sku_snapshot ?? "None"}</TableCell>
                    <TableCell>{item.size_snapshot ?? "OS"}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>
                      {formatCurrency(item.unit_price_snapshot)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.line_total)}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-neutral-500">
                      No line items found
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-neutral-500" aria-hidden="true" />
              <CardTitle>Totals</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 text-sm font-bold uppercase">
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Shipping</span>
              <span>{formatCurrency(order.shipping_amount)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Tax</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-neutral-500">Discount</span>
              <span>-{formatCurrency(order.discount_amount)}</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-neutral-200 pt-4 text-lg font-black text-black">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddressCard
          title="Shipping Address"
          address={order.shipping_address_snapshot}
        />
        <AddressCard
          title="Billing Address"
          address={order.billing_address_snapshot}
        />
      </div>
    </div>
  );
}
