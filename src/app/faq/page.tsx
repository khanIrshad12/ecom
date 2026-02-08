import { prisma } from "@/lib/prisma";
import FAQAccordion from "@/components/home/faq-accordion";

export const metadata = {
  title: "FAQ",
  description: "Frequently asked questions about shipping, returns, and more.",
};

export default async function FAQPage() {
  const faqs = await prisma.faq.findMany({
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    select: { id: true, question: true, answer: true },
  });

  const items = faqs.map((f) => ({ id: f.id, question: f.question, answer: f.answer }));

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-primary tracking-tight mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-secondary mb-10">
          Quick answers to common questions about shipping, returns, and more.
        </p>
        {items.length === 0 ? (
          <p className="text-secondary">No FAQs have been added yet. Check back later.</p>
        ) : (
          <FAQAccordion items={items} />
        )}
      </main>
    </div>
  );
}
