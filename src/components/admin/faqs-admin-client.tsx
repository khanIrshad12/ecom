"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  displayOrder: number;
};

export default function FaqsAdminClient() {
  const [loading, setLoading] = useState(true);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editDisplayOrder, setEditDisplayOrder] = useState("0");
  const [deleteConfirm, setDeleteConfirm] = useState<FaqItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchFaqs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/faqs");
      const data = await res.json();
      setFaqs(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load FAQs");
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaqs();
  }, []);

  useEffect(() => {
    if (!editingId) return;
    const faq = faqs.find((f) => f.id === editingId);
    if (faq) {
      setEditQuestion(faq.question);
      setEditAnswer(faq.answer);
      setEditDisplayOrder(String(faq.displayOrder ?? 0));
    }
  }, [editingId, faqs]);

  const handleCreate = async () => {
    if (!question.trim()) {
      toast.error("Question is required");
      return;
    }
    if (!answer.trim()) {
      toast.error("Answer is required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          answer: answer.trim(),
          displayOrder: Number(displayOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to create FAQ");
        return;
      }
      toast.success("FAQ added");
      setQuestion("");
      setAnswer("");
      setDisplayOrder("0");
      await fetchFaqs();
    } catch {
      toast.error("Failed to create FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    if (!editQuestion.trim() || !editAnswer.trim()) {
      toast.error("Question and answer are required");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/faqs/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: editQuestion.trim(),
          answer: editAnswer.trim(),
          displayOrder: Number(editDisplayOrder) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to update FAQ");
        return;
      }
      toast.success("FAQ updated");
      setEditingId(null);
      await fetchFaqs();
    } catch {
      toast.error("Failed to update FAQ");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (faq: FaqItem) => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/faqs/${faq.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data?.error || "Failed to delete FAQ");
        return;
      }
      toast.success("FAQ deleted");
      setDeleteConfirm(null);
      if (editingId === faq.id) setEditingId(null);
      await fetchFaqs();
    } catch {
      toast.error("Failed to delete FAQ");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return <div className="text-secondary">Loading FAQs…</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-primary">FAQs</h1>
        <p className="text-secondary text-sm mt-1">
          Manage questions and answers. First 6 show on the homepage; &quot;See all FAQs&quot; appears when there are more than 6. Full list is on the /faq page.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add FAQ</CardTitle>
          <CardDescription>New entries appear on the homepage (up to 6) and on the FAQ page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="faq-question">Question</Label>
            <Input
              id="faq-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g. What is your return policy?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="faq-answer">Answer</Label>
            <Input
              id="faq-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Short answer"
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2 max-w-[120px]">
            <Label htmlFor="faq-order">Order</Label>
            <Input
              id="faq-order"
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={submitting}>
            {submitting ? "Adding…" : "Add FAQ"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All FAQs ({faqs.length})</CardTitle>
          <CardDescription>Edit or delete. Order determines display order.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {faqs.length === 0 ? (
            <p className="text-secondary text-sm">No FAQs yet. Add one above.</p>
          ) : (
            <ul className="space-y-4">
              {faqs.map((faq) => (
                <li
                  key={faq.id}
                  className="border border-neutral/20 rounded-lg p-4 space-y-3"
                >
                  {editingId === faq.id ? (
                    <>
                      <Input
                        value={editQuestion}
                        onChange={(e) => setEditQuestion(e.target.value)}
                        placeholder="Question"
                      />
                      <Input
                        value={editAnswer}
                        onChange={(e) => setEditAnswer(e.target.value)}
                        placeholder="Answer"
                        className="min-h-[60px]"
                      />
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editDisplayOrder}
                          onChange={(e) => setEditDisplayOrder(e.target.value)}
                          className="w-20"
                        />
                        <Button size="sm" onClick={() => handleUpdate()} disabled={submitting}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-primary">{faq.question}</p>
                      <p className="text-secondary text-sm">{faq.answer}</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setEditingId(faq.id)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteConfirm(faq)}
                        >
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete FAQ?</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove &quot;{deleteConfirm?.question}&quot;. This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting…" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
