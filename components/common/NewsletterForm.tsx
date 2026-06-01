"use client";

import { FormEvent, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function NewsletterForm() {
  const supabase = createSupabaseBrowserClient();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail.includes("@")) {
      setMessage("Enter a valid email");
      return;
    }

    if (!supabase) {
      setMessage("Newsletter is not configured yet.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.from("newsletter_subscribers").upsert(
      {
        email: normalizedEmail,
        source: "footer",
        status: "subscribed",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" },
    );

    setIsSubmitting(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Subscribed.");
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 max-w-sm">
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setMessage("");
          }}
          placeholder="name@example.com"
          className="h-10 min-w-0 flex-1 border border-neutral-200 bg-neutral-100 px-3 text-sm text-black outline-none transition focus:border-black"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="h-10 bg-black px-5 text-xs font-black uppercase text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {isSubmitting ? "Saving" : "Subscribe"}
        </button>
      </div>
      {message ? (
        <p className="mt-3 text-xs font-black uppercase text-neutral-500">
          {message}
        </p>
      ) : null}
    </form>
  );
}
