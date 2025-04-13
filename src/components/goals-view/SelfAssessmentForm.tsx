import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { SelfAssessmentFormProps } from "./types";

export function SelfAssessmentForm({
  goalId,
  initialRating,
  initialComment,
  onSave,
  isSaving,
}: SelfAssessmentFormProps) {
  const [rating, setRating] = useState<number | undefined>(initialRating);
  const [comment, setComment] = useState(initialComment || "");
  const [error, setError] = useState<string | null>(null);

  const handleRatingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (isNaN(value)) {
      setRating(undefined);
      return;
    }

    // Walidacja zakresu 0-150
    if (value < 0 || value > 150) {
      setError("Ocena musi być w zakresie 0-150");
    } else {
      setError(null);
    }

    setRating(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Walidacja przed zapisem
    if (rating === undefined) {
      setError("Ocena jest wymagana");
      return;
    }

    if (rating < 0 || rating > 150) {
      setError("Ocena musi być w zakresie 0-150");
      return;
    }

    setError(null);
    await onSave(goalId, rating, comment);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={`rating-${goalId}`} className="text-sm font-medium">
            Samoocena (0-150)
          </Label>
          <Input
            id={`rating-${goalId}`}
            type="number"
            min={0}
            max={150}
            value={rating || ""}
            onChange={handleRatingChange}
            disabled={isSaving}
            className="w-full"
            placeholder="Wprowadź ocenę (0-150)"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`comment-${goalId}`} className="text-sm font-medium">
            Komentarz (opcjonalny)
          </Label>
          <textarea
            id={`comment-${goalId}`}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSaving}
            className="w-full min-h-[100px] px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Dodaj komentarz do samooceny"
          />
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <Button type="submit" disabled={isSaving} className="w-full">
          {isSaving ? "Zapisywanie..." : "Zapisz samoocenę"}
        </Button>
      </div>
    </form>
  );
}
