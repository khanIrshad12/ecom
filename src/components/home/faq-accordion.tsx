"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export type FaqAccordionItem = { id?: string; question: string; answer: string };

const DEFAULT_FAQS: FaqAccordionItem[] = [
  { question: "What is your return policy?", answer: "We offer hassle-free returns within 30 days of delivery. Items must be unworn and in original packaging." },
  { question: "How long does shipping take?", answer: "Standard shipping takes 5–7 business days. Express options are available at checkout." },
  { question: "Do you offer gift certificates?", answer: "Yes. Gift cards are available in various denominations and can be purchased on our website." },
  { question: "How can I track my order?", answer: "Once shipped, you'll receive a tracking link via email. You can also check order status in your account." },
  { question: "Are the products handmade?", answer: "We work with trusted manufacturers for quality and consistency. Some limited editions are hand-finished." },
  { question: "How can I cancel my order?", answer: "Contact us within 24 hours of placing the order. Once shipped, you can return the item per our return policy." },
];

export default function FAQAccordion({ items }: { items?: FaqAccordionItem[] | null }) {
  const faqs = (items && items.length > 0) ? items : DEFAULT_FAQS;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {faqs.map((faq, i) => (
        <div
          key={faq.id ?? i}
          className="border border-neutral/20 rounded-lg overflow-hidden bg-background"
        >
          <button
            type="button"
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex justify-between items-center gap-4 px-5 py-4 text-left font-medium text-primary hover:bg-neutral/5 transition"
          >
            <span>{faq.question}</span>
            <ChevronDown
              className={`w-5 h-5 shrink-0 text-secondary transition-transform ${openIndex === i ? "rotate-180" : ""}`}
            />
          </button>
          {openIndex === i && (
            <div className="px-5 pb-4 pt-0 text-secondary text-sm leading-relaxed border-t border-neutral/10">
              {faq.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
