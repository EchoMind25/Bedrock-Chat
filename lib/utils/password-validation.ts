export interface PasswordValidation {
  isValid: boolean;
  score: 0 | 1 | 2 | 3 | 4;
  errors: string[];
}

const MIN_LENGTH = 8;

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  if (password.length >= MIN_LENGTH) score++;
  else errors.push(`Must be at least ${MIN_LENGTH} characters`);

  if (/[a-z]/.test(password)) score++;
  else errors.push("Must contain a lowercase letter");

  if (/[A-Z]/.test(password)) score++;
  else errors.push("Must contain an uppercase letter");

  if (/[0-9]/.test(password)) score++;
  else errors.push("Must contain a number");

  return {
    isValid: errors.length === 0,
    score: Math.min(score, 4) as PasswordValidation["score"],
    errors,
  };
}
