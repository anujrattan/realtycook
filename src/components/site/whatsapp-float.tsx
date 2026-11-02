"use client";

import { MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";

const WHATSAPP_URL =
  "https://wa.me/919056050813?text=" +
  encodeURIComponent("Hi Karan, I visited RealtyCook and would like to discuss a property requirement.");

export function WhatsAppFloat() {
  const pathname = usePathname();
  // Hide the consumer website floating bubble when inside the internal /crm workspace
  if (pathname?.startsWith("/crm")) return null;

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with RealtyCook on WhatsApp"
      className="group fixed right-5 bottom-5 z-50 flex items-center gap-2.5 rounded-full border border-emerald-400/30 bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lift transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#1ebe5d] focus-visible:ring-3 focus-visible:ring-emerald-400/60 focus-visible:outline-none sm:right-6 sm:bottom-6"
    >
      <span className="relative flex size-6 items-center justify-center rounded-full bg-white/20">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-40" />
        <MessageCircle className="relative size-4 fill-white text-white" />
      </span>
      <span className="pr-0.5">WhatsApp Us</span>
    </a>
  );
}
