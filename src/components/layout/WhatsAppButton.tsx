"use client";

import { MessageCircle } from "lucide-react";

export default function WhatsAppButton() {
  return (
    <a
      href="https://wa.me/5511995324559"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 transition-transform duration-200"
      aria-label="Contato via WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
