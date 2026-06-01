"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ContactFields = {
  name: string;
  email: string;
  message: string;
};

const initialFields: ContactFields = {
  name: "",
  email: "",
  message: "",
};

export function ContactForm() {
  const supabase = createSupabaseBrowserClient();
  const [fields, setFields] = useState(initialFields);
  const [errors, setErrors] = useState<Partial<ContactFields>>({});
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(field: keyof ContactFields, value: string) {
    setFields((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setStatusMessage("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: Partial<ContactFields> = {};
    const normalizedEmail = fields.email.trim().toLowerCase();

    if (!fields.name.trim()) {
      nextErrors.name = "Name required";
    }

    if (!normalizedEmail.includes("@")) {
      nextErrors.email = "Valid email required";
    }

    if (fields.message.trim().length < 10) {
      nextErrors.message = "Message must be at least 10 characters";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (!supabase) {
      setStatusMessage("Contact form is not configured yet.");
      return;
    }

    setIsSubmitting(true);
    setStatusMessage("");

    const { error } = await supabase.from("contact_messages").insert({
      email: normalizedEmail,
      message: fields.message.trim(),
      name: fields.name.trim(),
      status: "new",
    });

    setIsSubmitting(false);

    if (error) {
      setStatusMessage(error.message);
      return;
    }

    setStatusMessage("Message received.");
    setFields(initialFields);
  }

  return (
    <form onSubmit={handleSubmit} className="w-full" noValidate>
      <div className="grid gap-8 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-bold uppercase tracking-[-0.03em]">
            Name
          </span>
          <input
            value={fields.name}
            onChange={(event) => updateField("name", event.target.value)}
            name="name"
            type="text"
            placeholder="Jane Smith"
            className={`mt-3 h-14 w-full border-0 bg-neutral-100 px-4 text-base font-medium text-black outline-none placeholder:text-neutral-500 focus:bg-neutral-200 ${
              errors.name ? "ring-2 ring-black" : ""
            }`}
          />
          {errors.name ? (
            <span className="mt-2 block text-xs font-black uppercase">
              {errors.name}
            </span>
          ) : null}
        </label>

        <label className="block">
          <span className="text-sm font-bold uppercase tracking-[-0.03em]">
            Email
          </span>
          <input
            value={fields.email}
            onChange={(event) => updateField("email", event.target.value)}
            name="email"
            type="email"
            placeholder="jane@example.com"
            className={`mt-3 h-14 w-full border-0 bg-neutral-100 px-4 text-base font-medium text-black outline-none placeholder:text-neutral-500 focus:bg-neutral-200 ${
              errors.email ? "ring-2 ring-black" : ""
            }`}
          />
          {errors.email ? (
            <span className="mt-2 block text-xs font-black uppercase">
              {errors.email}
            </span>
          ) : null}
        </label>
      </div>

      <label className="mt-8 block">
        <span className="text-sm font-bold uppercase tracking-[-0.03em]">
          Message
        </span>
        <textarea
          value={fields.message}
          onChange={(event) => updateField("message", event.target.value)}
          name="message"
          placeholder="Leave us a message..."
          rows={8}
          className={`mt-3 w-full resize-none border-0 bg-neutral-100 px-4 py-5 text-base font-medium text-black outline-none placeholder:text-neutral-500 focus:bg-neutral-200 ${
            errors.message ? "ring-2 ring-black" : ""
          }`}
        />
        {errors.message ? (
          <span className="mt-2 block text-xs font-black uppercase">
            {errors.message}
          </span>
        ) : null}
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-8 h-14 w-full bg-black text-base font-bold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
      >
        {isSubmitting ? "Submitting" : "Submit"}
      </button>

      {statusMessage ? (
        <p className="mt-4 text-sm font-bold uppercase text-neutral-600">
          {statusMessage}
        </p>
      ) : null}
    </form>
  );
}
