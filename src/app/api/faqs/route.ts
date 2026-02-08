import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/** Public: list all FAQs ordered by displayOrder. */
export async function GET() {
  try {
    const faqs = await prisma.faq.findMany({
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, question: true, answer: true, displayOrder: true },
    });
    return NextResponse.json(faqs);
  } catch (error) {
    console.error("FAQs GET error:", error);
    return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}

/** Admin: create a new FAQ. */
export async function POST(req: Request) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    const { question, answer, displayOrder = 0 } = body;
    if (!question || typeof question !== "string" || !question.trim()) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }
    if (!answer || typeof answer !== "string") {
      return NextResponse.json({ error: "Answer is required" }, { status: 400 });
    }
    const faq = await prisma.faq.create({
      data: {
        question: question.trim(),
        answer: String(answer).trim(),
        displayOrder: Number(displayOrder) || 0,
      },
    });
    return NextResponse.json(faq);
  } catch (error) {
    console.error("FAQs POST error:", error);
    return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 });
  }
}
