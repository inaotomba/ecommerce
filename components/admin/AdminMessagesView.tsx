"use client";

import { useCallback, useEffect, useState } from "react";
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

type Message = Database["public"]["Tables"]["contact_messages"]["Row"];
type Subscriber = Database["public"]["Tables"]["newsletter_subscribers"]["Row"];

const messageStatuses = ["new", "read", "archived"] as const;
const subscriberStatuses = ["subscribed", "unsubscribed"] as const;

function formatDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(new Date(value))
    : "Unknown";
}

function badgeVariant(status: string) {
  if (status === "archived" || status === "unsubscribed") {
    return "outline" as const;
  }

  if (status === "new") {
    return "secondary" as const;
  }

  return "default" as const;
}

export function AdminMessagesView() {
  const supabase = createSupabaseBrowserClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(Boolean(supabase));

  const loadMessages = useCallback(async () => {
    const client = supabase;

    if (!client) {
      return;
    }

    const [messagesResult, subscribersResult] = await Promise.all([
      client
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false }),
      client
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (messagesResult.error ?? subscribersResult.error) {
      setError(
        messagesResult.error?.message ??
          subscribersResult.error?.message ??
          "Could not load messages.",
      );
    }

    setMessages(messagesResult.data ?? []);
    setSubscribers(subscribersResult.data ?? []);
    setIsLoading(false);
  }, [supabase]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [loadMessages]);

  async function updateMessage(message: Message, status: string) {
    if (!supabase) {
      return;
    }

    const { error: updateError } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", message.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, status } : item,
      ),
    );
  }

  async function updateSubscriber(subscriber: Subscriber, status: string) {
    if (!supabase) {
      return;
    }

    const { error: updateError } = await supabase
      .from("newsletter_subscribers")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", subscriber.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSubscribers((current) =>
      current.map((item) =>
        item.id === subscriber.id ? { ...item, status } : item,
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
            Messages
          </h2>
        </div>
        <Button variant="outline" onClick={() => void loadMessages()}>
          <RefreshCw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold uppercase text-red-700">
          {error}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Contact Messages</CardTitle>
          <CardDescription>
            {isLoading ? "Loading messages..." : `${messages.length} messages`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sender</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {messages.map((message) => (
                <TableRow key={message.id}>
                  <TableCell>
                    <p className="font-black uppercase">{message.name}</p>
                    <p className="mt-1 text-xs font-bold text-neutral-500">
                      {message.email}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-72 max-w-xl">
                    <p className="line-clamp-3 text-sm font-bold leading-5 text-neutral-600">
                      {message.message}
                    </p>
                  </TableCell>
                  <TableCell className="min-w-36">
                    <div className="grid gap-2">
                      <Badge variant={badgeVariant(message.status)}>
                        {message.status}
                      </Badge>
                      <Select
                        value={message.status}
                        onChange={(event) =>
                          void updateMessage(message, event.target.value)
                        }
                      >
                        {messageStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(message.created_at)}</TableCell>
                </TableRow>
              ))}
              {messages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-neutral-500">
                    No contact messages yet
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Newsletter Subscribers</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading subscribers..."
              : `${subscribers.length} subscribers`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscribers.map((subscriber) => (
                <TableRow key={subscriber.id}>
                  <TableCell className="font-black">{subscriber.email}</TableCell>
                  <TableCell>{subscriber.source ?? "unknown"}</TableCell>
                  <TableCell className="min-w-40">
                    <div className="grid gap-2">
                      <Badge variant={badgeVariant(subscriber.status)}>
                        {subscriber.status}
                      </Badge>
                      <Select
                        value={subscriber.status}
                        onChange={(event) =>
                          void updateSubscriber(subscriber, event.target.value)
                        }
                      >
                        {subscriberStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(subscriber.created_at)}</TableCell>
                </TableRow>
              ))}
              {subscribers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-neutral-500">
                    No subscribers yet
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
