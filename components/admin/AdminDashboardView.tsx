"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Inbox,
  ListOrdered,
  Package,
  TriangleAlert,
  UsersRound,
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
type Product = Database["public"]["Tables"]["products"]["Row"];
type Variant = Database["public"]["Tables"]["product_variants"]["Row"];
type Message = Database["public"]["Tables"]["contact_messages"]["Row"];
type Subscriber = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

const statusVariant = (status: string) => {
  if (status === "cancelled" || status === "archived") {
    return "destructive" as const;
  }

  if (status === "pending" || status === "new" || status === "unpaid") {
    return "secondary" as const;
  }

  return "default" as const;
};

export function AdminDashboardView() {
  const supabase = createSupabaseBrowserClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;

    async function loadDashboard() {
      const [
        ordersResult,
        productsResult,
        variantsResult,
        messagesResult,
        subscribersResult,
      ] = await Promise.all([
        client
          .from("orders")
          .select("*")
          .order("created_at", { ascending: false }),
        client.from("products").select("*").order("release_order", {
          ascending: false,
        }),
        client.from("product_variants").select("*"),
        client
          .from("contact_messages")
          .select("*")
          .order("created_at", { ascending: false }),
        client.from("newsletter_subscribers").select("*"),
      ]);

      if (!isActive) {
        return;
      }

      const firstError =
        ordersResult.error ??
        productsResult.error ??
        variantsResult.error ??
        messagesResult.error ??
        subscribersResult.error;

      if (firstError) {
        setError(firstError.message);
      }

      setOrders(ordersResult.data ?? []);
      setProducts(productsResult.data ?? []);
      setVariants(variantsResult.data ?? []);
      setMessages(messagesResult.data ?? []);
      setSubscribers(subscribersResult.data ?? []);
      setIsLoading(false);
    }

    void loadDashboard();

    return () => {
      isActive = false;
    };
  }, [supabase]);

  const totalRevenue = useMemo(
    () =>
      orders.reduce(
        (total, order) =>
          order.status === "cancelled" ? total : total + order.total_amount,
        0,
      ),
    [orders],
  );
  const pendingOrders = orders.filter((order) => order.status === "pending");
  const lowStockVariants = variants.filter(
    (variant) => (variant.stock_quantity ?? 0) <= 5,
  );
  const unreadMessages = messages.filter((message) => message.status === "new");

  if (!supabase) {
    return null;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-black uppercase text-neutral-500">
            Admin Overview
          </p>
          <h2 className="mt-2 text-4xl font-black uppercase leading-none tracking-[-0.07em]">
            Dashboard
          </h2>
        </div>
        <Link href="/admin/orders">
          <Button>Manage Orders</Button>
        </Link>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-start gap-3 p-4 text-red-700">
            <TriangleAlert className="mt-0.5 size-5" aria-hidden="true" />
            <p className="text-sm font-bold uppercase">{error}</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/admin/products",
            icon: Package,
            label: "Products",
            value: products.length,
          },
          {
            href: "/admin/orders",
            icon: ListOrdered,
            label: "Pending Orders",
            value: pendingOrders.length,
          },
          {
            href: "/admin/inventory",
            icon: TriangleAlert,
            label: "Low Stock",
            value: lowStockVariants.length,
          },
          {
            href: "/admin/messages",
            icon: Inbox,
            label: "New Messages",
            value: unreadMessages.length,
          },
        ].map((stat) => {
          const Icon = stat.icon;

          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="transition hover:bg-neutral-50">
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                  <CardTitle className="text-sm tracking-0">
                    {stat.label}
                  </CardTitle>
                  <Icon className="size-5 text-neutral-500" aria-hidden="true" />
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-black uppercase leading-none tracking-[-0.06em]">
                    {isLoading ? "..." : stat.value}
                  </p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>
              Latest unpaid and active orders created from checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.slice(0, 6).map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-black uppercase">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(order.payment_status)}>
                        {order.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(order.total_amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-neutral-500">
                      No orders yet
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Total Orders</CardTitle>
              <CardDescription>All saved order records.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-black tracking-[-0.06em]">
                {orders.length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Tracked Revenue</CardTitle>
              <CardDescription>Excludes cancelled orders.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-black tracking-[-0.06em]">
                {formatCurrency(totalRevenue)}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Audience</CardTitle>
              <CardDescription>Newsletter subscribers.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <UsersRound className="size-5 text-neutral-500" aria-hidden="true" />
              <p className="text-3xl font-black tracking-[-0.06em]">
                {subscribers.length}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
