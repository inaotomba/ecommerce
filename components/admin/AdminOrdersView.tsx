"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
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
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

const orderStatuses = ["pending", "confirmed", "cancelled"] as const;
const paymentStatuses = ["unpaid", "paid"] as const;
const fulfillmentStatuses = [
  "unfulfilled",
  "processing",
  "fulfilled",
] as const;

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
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Unknown";
}

function statusVariant(status: string) {
  if (status === "cancelled") {
    return "destructive" as const;
  }

  if (status === "pending" || status === "unfulfilled") {
    return "secondary" as const;
  }

  return "default" as const;
}

export function AdminOrdersView() {
  const supabase = createSupabaseBrowserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);

  const itemsByOrderId = useMemo(() => {
    const grouped = new Map<string, OrderItem[]>();

    orderItems.forEach((item) => {
      grouped.set(item.order_id, [...(grouped.get(item.order_id) ?? []), item]);
    });

    return grouped;
  }, [orderItems]);

  const loadOrders = useCallback(async () => {
    const client = supabase;

    if (!client) {
      return;
    }

    const { data: nextOrders, error: ordersError } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      setError(ordersError.message);
      setOrders([]);
      setOrderItems([]);
      setIsLoading(false);
      return;
    }

    setOrders(nextOrders ?? []);

    const orderIds = (nextOrders ?? []).map((order) => order.id);

    if (orderIds.length === 0) {
      setOrderItems([]);
      setIsLoading(false);
      return;
    }

    const { data: nextItems, error: itemsError } = await client
      .from("order_items")
      .select("*")
      .in("order_id", orderIds);

    if (itemsError) {
      setError(itemsError.message);
      setOrderItems([]);
    } else {
      setOrderItems(nextItems ?? []);
    }

    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadOrders();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadOrders]);

  async function updateOrder(
    orderId: string,
    updates: Database["public"]["Tables"]["orders"]["Update"],
  ) {
    if (!supabase) {
      return;
    }

    setSavingOrderId(orderId);
    setError("");

    const { error: updateError } = await supabase
      .from("orders")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", orderId);

    setSavingOrderId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === orderId ? { ...order, ...updates } : order,
      ),
    );
  }

  if (!supabase) {
    return null;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-neutral-500">
            Admin
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.07em]">
            Orders
          </h2>
        </div>
        <Button variant="outline" onClick={() => void loadOrders()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold uppercase text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4">
        {orders.map((order) => {
          const items = itemsByOrderId.get(order.id) ?? [];

          return (
            <Card key={order.id}>
              <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle>{order.order_number}</CardTitle>
                  <CardDescription>
                    {formatDate(order.created_at)} / {formatCurrency(order.total_amount)}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusVariant(order.status)}>
                    {order.status}
                  </Badge>
                  <Badge variant={statusVariant(order.fulfillment_status)}>
                    {order.fulfillment_status}
                  </Badge>
                  <Badge variant="outline">{order.payment_status}</Badge>
                </div>
              </CardHeader>
              <CardContent className="grid gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-xs font-black uppercase text-neutral-500">
                      Order status
                    </span>
                    <Select
                      value={order.status}
                      disabled={savingOrderId === order.id}
                      onChange={(event) =>
                        void updateOrder(order.id, { status: event.target.value })
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
                      Payment
                    </span>
                    <Select
                      value={order.payment_status}
                      disabled={savingOrderId === order.id}
                      onChange={(event) =>
                        void updateOrder(order.id, {
                          payment_status: event.target.value,
                        })
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
                      Fulfillment
                    </span>
                    <Select
                      value={order.fulfillment_status}
                      disabled={savingOrderId === order.id}
                      onChange={(event) =>
                        void updateOrder(order.id, {
                          fulfillment_status: event.target.value,
                        })
                      }
                    >
                      {fulfillmentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </Select>
                  </label>
                </div>

                <div className="flex flex-col gap-3 border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs font-bold uppercase leading-5 text-neutral-500">
                    Manual payment only. Updating payment status here records
                    admin confirmation and does not charge the customer.
                  </p>
                  <Button asChild variant="outline">
                    <Link href={`/admin/orders/${order.id}`}>View Details</Link>
                  </Button>
                </div>

                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-black uppercase">
                          {item.product_name_snapshot}
                        </TableCell>
                        <TableCell>{item.size_snapshot ?? "OS"}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(item.line_total)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-neutral-500">
                          No line items found
                        </TableCell>
                      </TableRow>
                    ) : null}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })}

        {!isLoading && orders.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No Orders Yet</CardTitle>
              <CardDescription>
                Orders created from checkout will appear here.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
