import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { GoalFormProps } from "./types";

export function GoalForm({
  initialValues,
  categories,
  totalWeight,
  currentGoalWeight,
  onSave,
  onCancel,
  isSaving,
}: GoalFormProps) {
  const [description, setDescription] = useState(initialValues.description);
  const [categoryId, setCategoryId] = useState(initialValues.categoryId);
  const [weight, setWeight] = useState(initialValues.weight);
  const [errors, setErrors] = useState<{ description?: string; categoryId?: string; weight?: string; form?: string }>(
    {}
  );

  // Reset form when initialValues change
  useEffect(() => {
    setDescription(initialValues.description);
    setCategoryId(initialValues.categoryId);
    setWeight(initialValues.weight);
    setErrors({});
  }, [initialValues]);

  // Calculate the maximum allowed weight
  const calculateMaxWeight = () => {
    // For a new goal, max is 100 - current total weight
    // For editing, max is 100 - (total weight - current goal weight)
    const adjustedTotalWeight = totalWeight - (initialValues.id ? currentGoalWeight : 0);
    return 100 - adjustedTotalWeight;
  };

  const maxWeight = calculateMaxWeight();

  const validateForm = () => {
    const newErrors: { description?: string; categoryId?: string; weight?: string; form?: string } = {};
    let isValid = true;

    // Validate description
    if (!description.trim()) {
      newErrors.description = "Opis celu jest wymagany";
      isValid = false;
    }

    // Validate category
    if (!categoryId) {
      newErrors.categoryId = "Kategoria jest wymagana";
      isValid = false;
    }

    // Validate weight
    if (weight <= 0) {
      newErrors.weight = "Waga musi być większa od 0";
      isValid = false;
    } else if (weight > maxWeight) {
      newErrors.weight = `Maksymalna dozwolona waga to ${maxWeight}%`;
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSave({
        id: initialValues.id,
        description,
        categoryId,
        weight,
      });

      // Reset form after success (only for new goals)
      if (!initialValues.id) {
        setDescription("");
        setWeight(0);
        // Keep the selected category for convenience
      }
    } catch (err) {
      // Error is handled by the parent component
      console.error("Error saving goal:", err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && (
        <Alert variant="destructive">
          <AlertDescription>{errors.form}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="description">Opis celu</Label>
        <Input
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Wprowadź opis celu"
          className={errors.description ? "border-destructive" : ""}
          disabled={isSaving}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Kategoria</Label>
        <Select value={categoryId} onValueChange={setCategoryId} disabled={isSaving || categories.length === 0}>
          <SelectTrigger className={errors.categoryId ? "border-destructive" : ""}>
            <SelectValue placeholder="Wybierz kategorię" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.categoryId && <p className="text-sm text-destructive">{errors.categoryId}</p>}
        {categories.length === 0 && <p className="text-sm text-muted-foreground">Brak dostępnych kategorii</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="weight">Waga (%)</Label>
        <div className="flex items-center gap-2">
          <Input
            id="weight"
            type="number"
            min="1"
            max="100"
            value={weight}
            onChange={(e) => setWeight(Math.max(0, parseInt(e.target.value) || 0))}
            className={errors.weight ? "border-destructive" : ""}
            disabled={isSaving}
          />
          <span className="text-sm text-muted-foreground whitespace-nowrap">Max: {maxWeight}%</span>
        </div>
        {errors.weight && <p className="text-sm text-destructive">{errors.weight}</p>}
        <p className="text-xs text-muted-foreground">
          Suma wag wszystkich celów musi wynosić 100%. Aktualna suma: {totalWeight}%
          {totalWeight > 100 && <span className="text-destructive ml-1">(przekroczono limit)</span>}
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSaving}>
          Anuluj
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving ? "Zapisywanie..." : initialValues.id ? "Aktualizuj cel" : "Dodaj cel"}
        </Button>
      </div>
    </form>
  );
}
