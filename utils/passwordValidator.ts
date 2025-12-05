import zxcvbn from "zxcvbn";

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  strength: "weak" | "fair" | "good" | "strong" | "very strong";
  color: string;
}

export const validatePassword = (password: string): PasswordStrength => {
  const result = zxcvbn(password);

  const strengthLabels = ["weak", "fair", "good", "strong", "very strong"] as const;
  const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#16a34a"];

  const feedback: string[] = [];

  if (password.length < 8) {
    feedback.push("At least 8 characters required");
  }
  if (!/[A-Z]/.test(password)) {
    feedback.push("Add uppercase letters");
  }
  if (!/[a-z]/.test(password)) {
    feedback.push("Add lowercase letters");
  }
  if (!/\d/.test(password)) {
    feedback.push("Add numbers");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    feedback.push("Add special characters");
  }

  // Add zxcvbn feedback
  if (result.feedback.warning) {
    feedback.push(result.feedback.warning);
  }

  return {
    score: result.score,
    feedback,
    strength: strengthLabels[result.score],
    color: colors[result.score],
  };
};

export const meetsRequirements = (password: string): boolean => {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(password)
  );
};