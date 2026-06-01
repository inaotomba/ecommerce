"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Check, CreditCard, LockKeyhole, Truck } from "lucide-react";
import { StateBlock } from "@/components/common/StateBlock";
import { useCartStore } from "@/hooks/useCartStore";
import { useToastStore } from "@/hooks/useToastStore";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Json } from "@/types/supabase";

type CheckoutStep = "shipping" | "review";
type ShippingMethod = "standard" | "express" | "pickup";
type CreateOrderResult = {
  notification_status?: string;
  order_id?: string;
  order_number?: string;
  total_amount?: number;
};

type AddressFields = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  email: string;
  fullName: string;
  phone: string;
  postalCode: string;
  state: string;
};

const initialAddressFields: AddressFields = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: "United States",
  email: "",
  fullName: "",
  phone: "",
  postalCode: "",
  state: "",
};

const requiredShippingFields: Array<keyof AddressFields> = [
  "fullName",
  "email",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "country",
];
const requiredBillingFields = requiredShippingFields.filter(
  (field) => field !== "email",
);

const shippingMethods: Array<{
  id: ShippingMethod;
  label: string;
  description: string;
  price: number;
}> = [
  {
    id: "standard",
    label: "Standard delivery",
    description: "3-5 business days",
    price: 0,
  },
  {
    id: "express",
    label: "Express delivery",
    description: "1-2 business days",
    price: 18,
  },
  {
    id: "pickup",
    label: "Store pickup",
    description: "Ready in 30 minutes",
    price: 0,
  },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(value);
}

function toAddressSnapshot(fields: AddressFields): Json {
  return {
    address_line_1: fields.addressLine1.trim(),
    address_line_2: fields.addressLine2.trim(),
    city: fields.city.trim(),
    country: fields.country.trim(),
    full_name: fields.fullName.trim(),
    phone: fields.phone.trim(),
    postal_code: fields.postalCode.trim(),
    state: fields.state.trim(),
  };
}

function isOrderResult(value: Json): value is CreateOrderResult {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function CheckoutView() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const showToast = useToastStore((state) => state.showToast);
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<CheckoutStep>("shipping");
  const [shippingFields, setShippingFields] = useState(initialAddressFields);
  const [billingFields, setBillingFields] = useState(initialAddressFields);
  const [shippingErrors, setShippingErrors] = useState<
    Partial<Record<keyof AddressFields, string>>
  >({});
  const [billingErrors, setBillingErrors] = useState<
    Partial<Record<keyof AddressFields, string>>
  >({});
  const [shippingMethod, setShippingMethod] =
    useState<ShippingMethod>("standard");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );
  const selectedShipping = shippingMethods.find(
    (method) => method.id === shippingMethod,
  );
  const delivery = selectedShipping?.price ?? 0;
  const tax = 0;
  const discount = 0;
  const total = subtotal + delivery + tax - discount;

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;

    async function loadAccount(nextUser: User | null) {
      if (!isActive) {
        return;
      }

      setUser(nextUser);

      if (!nextUser) {
        return;
      }

      setShippingFields((current) => ({
        ...current,
        email: current.email || nextUser.email || "",
      }));

      const { data } = await client
        .from("addresses")
        .select("*")
        .eq("profile_id", nextUser.id)
        .eq("type", "shipping")
        .eq("is_default", true)
        .maybeSingle();

      if (!isActive || !data) {
        return;
      }

      setShippingFields((current) => ({
        ...current,
        addressLine1: data.address_line_1,
        addressLine2: data.address_line_2 ?? "",
        city: data.city,
        country: data.country,
        fullName: data.full_name,
        phone: data.phone ?? "",
        postalCode: data.postal_code,
        state: data.state,
      }));
    }

    async function loadInitialUser() {
      const {
        data: { user: currentUser },
      } = await client.auth.getUser();

      await loadAccount(currentUser);
    }

    void loadInitialUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void loadAccount(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function updateShippingField(field: keyof AddressFields, value: string) {
    setShippingFields((current) => ({ ...current, [field]: value }));
    setShippingErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }

  function updateBillingField(field: keyof AddressFields, value: string) {
    setBillingFields((current) => ({ ...current, [field]: value }));
    setBillingErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }

  function validateFields(
    fields: AddressFields,
    requiredFields: Array<keyof AddressFields>,
  ) {
    const nextErrors: Partial<Record<keyof AddressFields, string>> = {};

    requiredFields.forEach((field) => {
      if (!fields[field].trim()) {
        nextErrors[field] = "Required";
      }
    });

    if (fields.email && !fields.email.includes("@")) {
      nextErrors.email = "Valid email required";
    }

    return nextErrors;
  }

  function validateCheckout() {
    const nextShippingErrors = validateFields(
      shippingFields,
      requiredShippingFields,
    );
    const nextBillingErrors = billingSameAsShipping
      ? {}
      : validateFields(billingFields, requiredBillingFields);

    setShippingErrors(nextShippingErrors);
    setBillingErrors(nextBillingErrors);

    return (
      Object.keys(nextShippingErrors).length === 0 &&
      Object.keys(nextBillingErrors).length === 0
    );
  }

  async function handleShippingSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateCheckout()) {
      showToast("Complete checkout fields");
      return;
    }

    setNotice(null);
    setStep("review");
    showToast("Checkout details saved");
  }

  async function placeOrder() {
    if (!supabase) {
      setNotice("Supabase is not configured yet.");
      return;
    }

    if (!user) {
      setNotice("Sign in before placing an order.");
      showToast("Sign in required");
      return;
    }

    if (!validateCheckout()) {
      setStep("shipping");
      showToast("Complete checkout fields");
      return;
    }

    if (items.some((item) => !item.product.databaseId)) {
      setNotice("Refresh the catalog before placing this order.");
      return;
    }

    setIsPlacingOrder(true);
    setNotice(null);

    try {
      const shippingSnapshot = toAddressSnapshot(shippingFields);
      const billingSnapshot = billingSameAsShipping
        ? shippingSnapshot
        : toAddressSnapshot({
            ...billingFields,
            email: shippingFields.email,
          });
      const rpcItems = items.map((item) => ({
        product_id: item.product.databaseId as string,
        quantity: item.quantity,
        size: item.size,
      }));

      const { data, error } = await supabase.rpc("create_order_from_checkout", {
        p_billing_address: billingSnapshot,
        p_items: rpcItems as Json,
        p_shipping_address: shippingSnapshot,
        p_shipping_method: shippingMethod,
      });

      if (error) {
        if (error.message.toLowerCase().includes("function")) {
          throw new Error(
            "Checkout database function is missing. Run data/mvp_backend_hardening.sql in Supabase SQL editor.",
          );
        }

        throw new Error(error.message);
      }

      if (!isOrderResult(data) || !data.order_number) {
        throw new Error("Order was created but the response was incomplete.");
      }

      clearCart();
      window.localStorage.setItem(
        "local-last-order",
        JSON.stringify({
          notificationStatus: data.notification_status ?? "manual_pending",
          orderNumber: data.order_number,
          total: data.total_amount ?? total,
        }),
      );
      showToast("Order request sent");
      router.push(`/checkout/success?order=${data.order_number}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Order could not be created.";
      setNotice(message);
      showToast("Order failed");
    } finally {
      setIsPlacingOrder(false);
    }
  }

  if (items.length === 0) {
    return (
      <StateBlock
        eyebrow="(Checkout)"
        title="Nothing To Checkout"
        message="Your cart is empty. Add a few pieces before starting checkout and the order summary will appear here."
        actionHref="/products"
        actionLabel="Shop All"
        secondaryActionHref="/cart"
        secondaryActionLabel="Cart"
      />
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
      <div className="flex flex-col gap-8 border-b border-neutral-200 pb-10 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-base font-bold uppercase tracking-[-0.03em]">
            (Secure Checkout)
          </p>
          <h1 className="mt-6 text-5xl font-black uppercase leading-none tracking-[-0.07em] sm:text-6xl">
            Checkout
          </h1>
        </div>
        <div className="flex gap-2 text-xs font-black uppercase text-neutral-500">
          <span className={step === "shipping" ? "text-black underline" : ""}>
            Shipping
          </span>
          <span>/</span>
          <span className={step === "review" ? "text-black underline" : ""}>
            Review
          </span>
        </div>
      </div>

      <div className="grid gap-12 py-12 lg:grid-cols-[1fr_380px] lg:items-start">
        <form
          id="checkout-details-form"
          className="grid gap-12"
          onSubmit={handleShippingSubmit}
        >
          <section>
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center bg-black text-white">
                <Truck className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.06em]">
                Shipping
              </h2>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {[
                ["fullName", "Full name", "Jane Smith"],
                ["email", "Email", "jane@example.com"],
                ["phone", "Phone", "+12025550101"],
                ["addressLine1", "Address line 1", "71-75 Shelton Street"],
                ["addressLine2", "Address line 2", "Apt 4B"],
                ["city", "City", "London"],
                ["state", "State", "London"],
                ["postalCode", "Postal code", "WC2H 9JQ"],
                ["country", "Country", "United Kingdom"],
              ].map(([field, label, placeholder]) => {
                const fieldName = field as keyof AddressFields;

                return (
                  <label
                    key={field}
                    className={`block ${
                      field === "addressLine1" || field === "addressLine2"
                        ? "sm:col-span-2"
                        : ""
                    }`}
                  >
                    <span className="text-xs font-black uppercase text-neutral-500">
                      {label}
                    </span>
                    <input
                      type={field === "email" ? "email" : "text"}
                      value={shippingFields[fieldName]}
                      onChange={(event) =>
                        updateShippingField(fieldName, event.target.value)
                      }
                      placeholder={placeholder}
                      className={`mt-3 h-12 w-full bg-neutral-100 px-3 text-sm font-bold uppercase outline-none focus:bg-neutral-200 ${
                        shippingErrors[fieldName] ? "ring-2 ring-black" : ""
                      }`}
                    />
                    {shippingErrors[fieldName] ? (
                      <span className="mt-2 block text-xs font-black uppercase text-black">
                        {shippingErrors[fieldName]}
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </section>

          <section className="border-t border-neutral-200 pt-12">
            <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.06em]">
              Shipping Method
            </h2>
            <div className="mt-6 grid gap-3">
              {shippingMethods.map((method) => (
                <label
                  key={method.id}
                  className={`flex cursor-pointer items-center justify-between gap-4 border p-4 ${
                    shippingMethod === method.id
                      ? "border-black"
                      : "border-neutral-200"
                  }`}
                >
                  <span>
                    <span className="block text-sm font-black uppercase">
                      {method.label}
                    </span>
                    <span className="mt-1 block text-xs font-bold uppercase text-neutral-500">
                      {method.description}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-xs font-black uppercase">
                      {method.price === 0 ? "Free" : formatCurrency(method.price)}
                    </span>
                    <input
                      type="radio"
                      name="shippingMethod"
                      checked={shippingMethod === method.id}
                      onChange={() => setShippingMethod(method.id)}
                      className="size-4 accent-black"
                    />
                  </span>
                </label>
              ))}
            </div>
          </section>

          <section className="border-t border-neutral-200 pt-12">
            <label className="flex items-center gap-3 text-sm font-black uppercase">
              <input
                type="checkbox"
                checked={billingSameAsShipping}
                onChange={(event) =>
                  setBillingSameAsShipping(event.target.checked)
                }
                className="size-4 accent-black"
              />
              Billing address same as shipping
            </label>

            {!billingSameAsShipping ? (
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {[
                  ["fullName", "Billing full name", "Jane Smith"],
                  ["phone", "Billing phone", "+12025550101"],
                  ["addressLine1", "Billing address line 1", "71-75 Shelton Street"],
                  ["addressLine2", "Billing address line 2", "Apt 4B"],
                  ["city", "Billing city", "London"],
                  ["state", "Billing state", "London"],
                  ["postalCode", "Billing postal code", "WC2H 9JQ"],
                  ["country", "Billing country", "United Kingdom"],
                ].map(([field, label, placeholder]) => {
                  const fieldName = field as keyof AddressFields;

                  return (
                    <label
                      key={field}
                      className={`block ${
                        field === "addressLine1" || field === "addressLine2"
                          ? "sm:col-span-2"
                          : ""
                      }`}
                    >
                      <span className="text-xs font-black uppercase text-neutral-500">
                        {label}
                      </span>
                      <input
                        value={billingFields[fieldName]}
                        onChange={(event) =>
                          updateBillingField(fieldName, event.target.value)
                        }
                        placeholder={placeholder}
                        className={`mt-3 h-12 w-full bg-neutral-100 px-3 text-sm font-bold uppercase outline-none focus:bg-neutral-200 ${
                          billingErrors[fieldName] ? "ring-2 ring-black" : ""
                        }`}
                      />
                      {billingErrors[fieldName] ? (
                        <span className="mt-2 block text-xs font-black uppercase text-black">
                          {billingErrors[fieldName]}
                        </span>
                      ) : null}
                    </label>
                  );
                })}
              </div>
            ) : null}
          </section>

          <section className="border-t border-neutral-200 pt-12">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center bg-black text-white">
                <CreditCard className="size-5" aria-hidden="true" />
              </span>
              <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.06em]">
                Payment
              </h2>
            </div>

            <div className="mt-8 border border-neutral-200 p-6">
              <div className="flex items-start gap-3">
                <LockKeyhole className="mt-1 size-5 text-neutral-500" />
                <div>
                  <h3 className="text-sm font-black uppercase">
                    Manual payment
                  </h3>
                  <p className="mt-2 text-sm font-bold uppercase leading-5 text-neutral-500">
                    No online payment will be collected here. This submits an
                    order request so the store can confirm availability and
                    payment manually.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {notice ? (
            <p className="border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold uppercase leading-5 text-red-700">
              {notice}
            </p>
          ) : null}

          <button
            type="submit"
            className="h-12 bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800"
          >
            Review Order
          </button>
        </form>

        <aside className="sticky top-20 border border-neutral-200 p-6">
          <h2 className="text-3xl font-black uppercase leading-none tracking-[-0.06em]">
            {step === "review" ? "Review" : "Order"}
          </h2>

          <div className="mt-8 grid gap-5 border-b border-neutral-200 pb-6">
            {items.map((item) => (
              <div
                key={`${item.product.id}-${item.size}`}
                className="grid grid-cols-[64px_1fr_auto] gap-4"
              >
                <div className="aspect-square overflow-hidden bg-neutral-200">
                  <div
                    className="h-full w-full bg-cover bg-center grayscale"
                    style={{ backgroundImage: `url(${item.product.image})` }}
                  />
                </div>
                <div>
                  <p className="text-sm font-black uppercase leading-none">
                    {item.product.name}
                  </p>
                  <p className="mt-2 text-xs font-bold uppercase text-neutral-500">
                    Size {item.size} / Qty {item.quantity}
                  </p>
                </div>
                <p className="text-xs font-black uppercase">
                  {formatCurrency(item.product.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 border-b border-neutral-200 pb-6 text-sm font-bold uppercase">
            <div className="flex justify-between">
              <span className="text-neutral-500">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Delivery</span>
              <span>{delivery === 0 ? "Free" : formatCurrency(delivery)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Payment</span>
              <span>Manual</span>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between text-lg font-black uppercase">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>

          {step === "review" ? (
            <button
              type="button"
              onClick={() => void placeOrder()}
              disabled={isPlacingOrder}
              className="mt-8 flex h-12 w-full items-center justify-center gap-2 bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              <Check className="size-4" aria-hidden="true" />
              {isPlacingOrder ? "Sending Request" : "Submit Order Request"}
            </button>
          ) : (
            <button
              type="submit"
              form="checkout-details-form"
              className="mt-8 flex h-12 w-full items-center justify-center bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800"
            >
              Review Order
            </button>
          )}

          <Link
            href="/cart"
            className="mt-4 flex h-12 w-full items-center justify-center border border-neutral-200 text-sm font-black uppercase transition hover:bg-neutral-100"
          >
            Back To Cart
          </Link>
        </aside>
      </div>
    </section>
  );
}
