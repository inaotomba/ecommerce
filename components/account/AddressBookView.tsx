"use client";

import type { FormEvent } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Check, Edit3, MapPin, Plus, Trash2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Database } from "@/types/supabase";

type Address = Database["public"]["Tables"]["addresses"]["Row"];
type AddressType = "shipping" | "billing";
type Notice = {
  message: string;
  tone: "error" | "success";
};
type AddressFields = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  fullName: string;
  phone: string;
  postalCode: string;
  state: string;
  type: AddressType;
};

const initialFields: AddressFields = {
  addressLine1: "",
  addressLine2: "",
  city: "",
  country: "United States",
  fullName: "",
  phone: "",
  postalCode: "",
  state: "",
  type: "shipping",
};

const requiredFields: Array<keyof AddressFields> = [
  "fullName",
  "addressLine1",
  "city",
  "state",
  "postalCode",
  "country",
];

function mapAddressToFields(address: Address): AddressFields {
  return {
    addressLine1: address.address_line_1,
    addressLine2: address.address_line_2 ?? "",
    city: address.city,
    country: address.country,
    fullName: address.full_name,
    phone: address.phone ?? "",
    postalCode: address.postal_code,
    state: address.state,
    type: address.type === "billing" ? "billing" : "shipping",
  };
}

export function AddressBookView() {
  const supabase = createSupabaseBrowserClient();
  const [user, setUser] = useState<User | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [fields, setFields] = useState<AddressFields>(initialFields);
  const [errors, setErrors] = useState<Partial<Record<keyof AddressFields, string>>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(supabase));
  const [isSaving, setIsSaving] = useState(false);

  const editingAddress = useMemo(
    () => addresses.find((address) => address.id === editingId) ?? null,
    [addresses, editingId],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const client = supabase;
    let isActive = true;

    async function loadAddresses(nextUser: User | null) {
      if (!isActive) {
        return;
      }

      setUser(nextUser);

      if (!nextUser) {
        setAddresses([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await client
        .from("addresses")
        .select("*")
        .eq("profile_id", nextUser.id)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false });

      if (!isActive) {
        return;
      }

      if (error) {
        setNotice({
          message:
            "Could not load saved addresses. Check the addresses RLS policy for this user.",
          tone: "error",
        });
        setAddresses([]);
      } else {
        setAddresses(data ?? []);
      }

      setIsLoading(false);
    }

    async function loadInitialUser() {
      const {
        data: { user: currentUser },
      } = await client.auth.getUser();

      await loadAddresses(currentUser);
    }

    void loadInitialUser();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      void loadAddresses(session?.user ?? null);
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  function updateField(field: keyof AddressFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setNotice(null);
  }

  function resetForm() {
    setEditingId(null);
    setFields(initialFields);
    setErrors({});
  }

  function validateForm() {
    const nextErrors: Partial<Record<keyof AddressFields, string>> = {};

    requiredFields.forEach((field) => {
      if (!fields[field].trim()) {
        nextErrors[field] = "Required";
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function refreshAddresses(nextUser = user) {
    if (!supabase || !nextUser) {
      return;
    }

    const { data, error } = await supabase
      .from("addresses")
      .select("*")
      .eq("profile_id", nextUser.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      setNotice({
        message: "Address saved, but the list could not refresh.",
        tone: "error",
      });
      return;
    }

    setAddresses(data ?? []);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase || !user) {
      setNotice({ message: "Sign in before saving an address.", tone: "error" });
      return;
    }

    if (!validateForm()) {
      setNotice({ message: "Complete the required address fields.", tone: "error" });
      return;
    }

    setIsSaving(true);
    setNotice(null);

    const payload = {
      address_line_1: fields.addressLine1.trim(),
      address_line_2: fields.addressLine2.trim() || null,
      city: fields.city.trim(),
      country: fields.country.trim(),
      full_name: fields.fullName.trim(),
      phone: fields.phone.trim() || null,
      postal_code: fields.postalCode.trim(),
      profile_id: user.id,
      state: fields.state.trim(),
      type: fields.type,
      updated_at: new Date().toISOString(),
    };

    const query = editingId
      ? supabase
          .from("addresses")
          .update(payload)
          .eq("id", editingId)
          .eq("profile_id", user.id)
      : supabase.from("addresses").insert({
          ...payload,
          is_default: addresses.length === 0,
        });

    const { error } = await query;

    setIsSaving(false);

    if (error) {
      setNotice({ message: error.message, tone: "error" });
      return;
    }

    await refreshAddresses();
    resetForm();
    setNotice({
      message: editingId ? "Address updated." : "Address saved.",
      tone: "success",
    });
  }

  async function deleteAddress(addressId: string) {
    if (!supabase || !user) {
      return;
    }

    setIsSaving(true);
    setNotice(null);

    const { error } = await supabase
      .from("addresses")
      .delete()
      .eq("id", addressId)
      .eq("profile_id", user.id);

    setIsSaving(false);

    if (error) {
      setNotice({ message: error.message, tone: "error" });
      return;
    }

    if (editingId === addressId) {
      resetForm();
    }

    await refreshAddresses();
    setNotice({ message: "Address deleted.", tone: "success" });
  }

  async function setDefaultAddress(address: Address) {
    if (!supabase || !user) {
      return;
    }

    setIsSaving(true);
    setNotice(null);

    const { error: clearError } = await supabase
      .from("addresses")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("profile_id", user.id)
      .eq("type", address.type);

    if (clearError) {
      setIsSaving(false);
      setNotice({ message: clearError.message, tone: "error" });
      return;
    }

    const { error } = await supabase
      .from("addresses")
      .update({ is_default: true, updated_at: new Date().toISOString() })
      .eq("id", address.id)
      .eq("profile_id", user.id);

    setIsSaving(false);

    if (error) {
      setNotice({ message: error.message, tone: "error" });
      return;
    }

    await refreshAddresses();
    setNotice({ message: "Default address updated.", tone: "success" });
  }

  function startEditing(address: Address) {
    setEditingId(address.id);
    setFields(mapAddressToFields(address));
    setErrors({});
    setNotice(null);
  }

  if (!supabase) {
    return (
      <div className="border border-neutral-200 p-6">
        <p className="text-xs font-black uppercase text-neutral-500">
          (Setup Required)
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none">
          Supabase Env Missing
        </h2>
        <p className="mt-5 text-sm font-bold uppercase leading-5 text-neutral-500">
          Add your Supabase project URL and publishable key to .env.local, then
          restart the dev server.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div className="h-96 animate-pulse bg-neutral-100" />
        <div className="h-96 animate-pulse bg-neutral-100" />
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
          Login To Manage Addresses
        </h2>
        <p className="mt-5 max-w-xl text-sm font-bold uppercase leading-5 text-neutral-500">
          Saved addresses are attached to your Supabase account, so each user
          only sees their own shipping and billing addresses.
        </p>
        <Link
          href="/account"
          className="mt-8 inline-flex h-12 items-center justify-center bg-black px-6 text-sm font-black uppercase text-white"
        >
          Go To Account
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-start">
      <section>
        <div className="flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase text-neutral-500">
              ({addresses.length} Saved)
            </p>
            <h2 className="mt-3 text-3xl font-black uppercase leading-none tracking-[-0.06em]">
              Address Book
            </h2>
          </div>
          <button
            type="button"
            onClick={resetForm}
            className="inline-flex h-11 items-center justify-center gap-2 border border-neutral-200 px-4 text-xs font-black uppercase transition hover:bg-neutral-100"
          >
            <Plus className="size-4" aria-hidden="true" />
            New Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="mt-6 border border-neutral-200 p-8">
            <MapPin className="size-8" aria-hidden="true" />
            <h3 className="mt-5 text-3xl font-black uppercase leading-none">
              No Saved Addresses
            </h3>
            <p className="mt-4 text-sm font-bold uppercase leading-5 text-neutral-500">
              Add your first shipping or billing address. It will be saved to
              Supabase for this signed-in user.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4">
            {addresses.map((address) => (
              <article
                key={address.id}
                className={`border p-5 ${
                  editingId === address.id
                    ? "border-black"
                    : "border-neutral-200"
                }`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-black px-2 py-1 text-xs font-black uppercase text-white">
                        {address.type}
                      </span>
                      {address.is_default ? (
                        <span className="inline-flex items-center gap-1 border border-neutral-200 px-2 py-1 text-xs font-black uppercase">
                          <Check className="size-3" aria-hidden="true" />
                          Default
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 text-2xl font-black uppercase leading-none">
                      {address.full_name}
                    </h3>
                    <p className="mt-4 text-sm font-bold uppercase leading-5 text-neutral-500">
                      {address.address_line_1}
                      {address.address_line_2 ? `, ${address.address_line_2}` : ""}
                      <br />
                      {address.city}, {address.state} {address.postal_code}
                      <br />
                      {address.country}
                    </p>
                    {address.phone ? (
                      <p className="mt-3 text-sm font-bold uppercase text-neutral-500">
                        {address.phone}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!address.is_default ? (
                      <button
                        type="button"
                        onClick={() => void setDefaultAddress(address)}
                        disabled={isSaving}
                        className="h-10 border border-neutral-200 px-3 text-xs font-black uppercase transition hover:bg-neutral-100 disabled:opacity-50"
                      >
                        Set Default
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => startEditing(address)}
                      className="inline-flex size-10 items-center justify-center border border-neutral-200 transition hover:bg-neutral-100"
                      aria-label="Edit address"
                    >
                      <Edit3 className="size-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteAddress(address.id)}
                      disabled={isSaving}
                      className="inline-flex size-10 items-center justify-center border border-neutral-200 transition hover:bg-neutral-100 disabled:opacity-50"
                      aria-label="Delete address"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="border border-neutral-200 p-5">
        <p className="text-xs font-black uppercase text-neutral-500">
          {editingAddress ? "(Edit Address)" : "(New Address)"}
        </p>
        <h2 className="mt-3 text-3xl font-black uppercase leading-none tracking-[-0.06em]">
          {editingAddress ? "Update Details" : "Save Address"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
          <div className="grid grid-cols-2 gap-2">
            {(["shipping", "billing"] as AddressType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => updateField("type", type)}
                className={`h-11 text-xs font-black uppercase ${
                  fields.type === type
                    ? "bg-black text-white"
                    : "border border-neutral-200"
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {[
            ["fullName", "Full name", "Jane Smith"],
            ["phone", "Phone", "+12025550101"],
            ["addressLine1", "Address line 1", "120 Market Street"],
            ["addressLine2", "Address line 2", "Apt 4B"],
            ["city", "City", "New York"],
            ["state", "State", "NY"],
            ["postalCode", "Postal code", "10001"],
            ["country", "Country", "United States"],
          ].map(([field, label, placeholder]) => {
            const fieldName = field as keyof AddressFields;

            return (
              <label key={field} className="block">
                <span className="text-xs font-black uppercase text-neutral-500">
                  {label}
                </span>
                <input
                  value={fields[fieldName]}
                  onChange={(event) => updateField(fieldName, event.target.value)}
                  placeholder={placeholder}
                  className={`mt-3 h-12 w-full bg-neutral-100 px-3 text-sm font-bold uppercase text-black outline-none placeholder:text-neutral-400 focus:bg-neutral-200 ${
                    errors[fieldName] ? "ring-2 ring-black" : ""
                  }`}
                />
                {errors[fieldName] ? (
                  <span className="mt-2 block text-xs font-black uppercase">
                    {errors[fieldName]}
                  </span>
                ) : null}
              </label>
            );
          })}

          {notice ? (
            <p
              className={`border px-4 py-3 text-sm font-bold uppercase leading-5 ${
                notice.tone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-neutral-200 bg-neutral-100 text-black"
              }`}
            >
              {notice.message}
            </p>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="submit"
              disabled={isSaving}
              className="h-12 bg-black text-sm font-black uppercase text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
            >
              {isSaving
                ? "Saving"
                : editingAddress
                  ? "Update Address"
                  : "Save Address"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="h-12 border border-neutral-200 text-sm font-black uppercase transition hover:bg-neutral-100"
            >
              Clear
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
