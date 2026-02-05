"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "What is your return policy?", a: "We offer hassle-free returns within 30 days of delivery. Items must be unworn and in original packaging." },
  { q: "How long does shipping take?", a: "Standard shipping takes 5–7 business days. Express options are available at checkout." },
  { q: "Do you offer gift certificates?", a: "Yes. Gift cards are available in various denominations and can be purchased on our website." },
  { q: "How can I track my order?", a: "Once shipped, you'll receive a tracking link via email. You can also check order status in your account." },
  { q: "Are the products handmade?", a: "We work with trusted manufacturers for quality and consistency. Some limited editions are hand-finished." },
  { q: "How can I cancel my order?", a: "Contact us within 24 hours of placing the order. Once shipped, you can return the item per our return policy." },
];

export default function FAQAccordion() {
  const [openId, setOpenId] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="border border-neutral/20 rounded-lg overflow-hidden bg-background"
        >
          <button
            type="button"
            onClick={() => setOpenId(openId === i ? null : i)}
            className="w-full flex justify-between items-center gap-4 px-5 py-4 text-left font-medium text-primary hover:bg-neutral/5 transition"
          >
            <span>{faq.q}</span>
            <ChevronDown
              className={`w-5 h-5 shrink-0 text-secondary transition-transform ${openId === i ? "rotate-180" : ""}`}
            />
          </button>
          {openId === i && (
            <div className="px-5 pb-4 pt-0 text-secondary text-sm leading-relaxed border-t border-neutral/10">
              {faq.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
