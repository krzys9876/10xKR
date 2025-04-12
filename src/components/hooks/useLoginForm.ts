import { useState } from "react";
import type { LoginRequest, LoginResponse } from "@/types";

interface LoginError {
  message: string;
  code?: string;
}

interface LoginFormData {
  email: string;
  password: string;
}

export const useLoginForm = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<LoginError | null>(null);

  const handleSubmit = async (formData: LoginFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await login(formData);

      // Store token in localStorage
      localStorage.setItem("authToken", response.token);

      // Redirect to dashboard
      window.location.href = "/dashboard";
    } catch (err) {
      if (err instanceof Error) {
        setError({ message: err.message });
      } else {
        setError({ message: "Wystąpił nieznany błąd podczas logowania" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleSubmit,
  };
};

// Login API integration
const login = async (credentials: LoginRequest): Promise<LoginResponse> => {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Błąd logowania");
  }

  return await response.json();
};
