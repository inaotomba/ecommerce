"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { PackageCheck } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/supabase";

type Order = Database["public"]["Tables"]["orders"]["Row"];
type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "Unknown date";
  }

  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function OrderHistoryView() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  const itemsByOrderId = useMemo(() => {
    const grouped = new Map<string, OrderItem[]>();

    orderItems.forEach((item) => {
      grouped.set(item.order_id, [...(grouped.get(item.order_id) ?? []), item]);
    });

    return grouped;
  }, [orderItems]);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;

    async function loadOrders(nextUser: User | null) {
      if (!isActive) {
        return;
      }

      setUser(nextUser);

      if (!nextUser) {
        setOrders([]);
        setOrderItems([]);
        setIsLoading(false);
        return;
      }

      const { data: nextOrders, error } = await client
        .from("orders")
        .select("*")
        .eq("profile_id", nextUser.id)
        .order("created_at", { ascending: false });

      if (!isActive) {
        return;
      }

      if (error) {
        setNotice(error.message);
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

      if (!isActive) {
        return;
      }

      if (itemsError) {
        setNotice(itemsError.message);
        setOrderItems([]);
      } else {
        setOrderItems(nextItems ?? []);
      }

      setIsLoading(false);
    }

    async function loadInitialUser() {
      const {
        data: { user: currentUser },
      } = await client.auth.getUser();

      await loadOrders(currentUser);
    }

    void loadInitialUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void loadOrders(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  if (!supabase) {
    return (
      <div className="border border-neutral-200 p-6">
        <p className="text-xs font-black uppercase text-neutral-500">
          (Setup Required)
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none">
          Supabase Env Missing
        </h2>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <div className="h-32 animate-pulse bg-neutral-100" />
        <div className="h-32 animate-pulse bg-neutral-100" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="border border-neutral-200 p-8">
        <p className="text-xs font-black uppercase text-neutral-500">
          (Sign In Required)
        </p>
        <h2 className="mt-3 text-4xl font-black uppercase leading-none tracking-[-0.06em]">
          Login To See Orders
        </h2>
        <Link
          href="/account"
          className="mt-8 inline-flex h-12 items-center justify-center bg-black px-6 text-sm font-black uppercase text-white"
        >
          Go To Account
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="border border-neutral-200 p-8">
        <PackageCheck className="size-8" aria-hidden="true" />
        <h2 className="mt-5 text-4xl font-black uppercase leading-none tracking-[-0.06em]">
          No Orders Yet
        </h2>
        <p className="mt-5 max-w-xl text-sm font-bold uppercase leading-5 text-neutral-500">
          Orders created from checkout will appear here with their unpaid
          payment status until a payment provider is connected.
        </p>
        <Link
          href="/products"
          className="mt-8 inline-flex h-12 items-center justify-center bg-black px-6 text-sm font-black uppercase text-white"
        >
          Shop All
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {notice ? (
        <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold uppercase text-red-700">
          {notice}
        </p>
      ) : null}

      {orders.map((order) => {
        const items = itemsByOrderId.get(order.id) ?? [];

        return (
          <article key={order.id} className="border border-neutral-200 p-5">
            <div className="flex flex-col gap-4 border-b border-neutral-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase text-neutral-500">
                  {formatDate(order.created_at)}
                </p>
                <h2 className="mt-2 text-3xl font-black uppercase leading-none tracking-[-0.06em]">
                  {order.order_number}
                </h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="border border-neutral-200 px-3 py-2 text-xs font-black uppercase">
                  {order.status}
                </span>
                <span className="bg-black px-3 py-2 text-xs font-black uppercase text-white">
                  {order.payment_status}
                </span>
              </div>
            </div>

            <div className="mt-5 grid gap-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 text-sm font-bold uppercase"
                >
                  <div>
                    <p className="font-black">{item.product_name_snapshot}</p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Size {item.size_snapshot ?? "OS"} / Qty {item.quantity}
                    </p>
                  </div>
                  <p>{formatCurrency(item.line_total)}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-5 text-lg font-black uppercase">
              <span>Total</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}
