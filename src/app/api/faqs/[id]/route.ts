import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

/** Admin: update FAQ. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    const body = await req.json();
    const { question, answer, displayOrder } = body;
    const data: { question?: string; answer?: string; displayOrder?: number } = {};
    if (question !== undefined) data.question = String(question).trim();
    if (answer !== undefined) data.answer = String(answer).trim();
    if (displayOrder !== undefined) data.displayOrder = Number(displayOrder) ?? 0;
    const faq = await prisma.faq.update({
      where: { id },
      data,
    });
    return NextResponse.json(faq);
  } catch (error) {
    console.error("FAQ PATCH error:", error);
    return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 });
  }
}

/** Admin: delete FAQ. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if ((session?.user as { role?: string })?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    await prisma.faq.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("FAQ DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 });
  }
}
