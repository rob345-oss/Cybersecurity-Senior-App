// Validation utilities for form inputs

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): boolean {
  if (!email || !email.trim()) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates multiple comma-separated emails
 */
export function validateEmails(emails: string): ValidationResult {
  const errors: string[] = [];
  if (!emails || !emails.trim()) {
    errors.push("At least one email is required");
    return { isValid: false, errors };
  }

  const emailList = emails
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (emailList.length === 0) {
    errors.push("At least one email is required");
    return { isValid: false, errors };
  }

  const invalidEmails = emailList.filter((email) => !validateEmail(email));
  if (invalidEmails.length > 0) {
    errors.push(`Invalid email format: ${invalidEmails.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a phone number (basic validation)
 */
export function validatePhone(phone: string): boolean {
  if (!phone || !phone.trim()) return false;
  // Remove common formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, "");
  // Should be 10-15 digits
  return /^\d{10,15}$/.test(cleaned);
}

/**
 * Validates multiple comma-separated phone numbers
 */
export function validatePhones(phones: string): ValidationResult {
  const errors: string[] = [];
  if (!phones || !phones.trim()) {
    errors.push("At least one phone number is required");
    return { isValid: false, errors };
  }

  const phoneList = phones
    .split(",")
    .map((phone) => phone.trim())
    .filter(Boolean);

  if (phoneList.length === 0) {
    errors.push("At least one phone number is required");
    return { isValid: false, errors };
  }

  const invalidPhones = phoneList.filter((phone) => !validatePhone(phone));
  if (invalidPhones.length > 0) {
    errors.push(`Invalid phone format: ${invalidPhones.join(", ")}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a URL
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  if (!url || !url.trim()) {
    errors.push("URL is required");
    return { isValid: false, errors };
  }

  try {
    const parsedUrl = new URL(url.trim());
    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      errors.push("URL must use http or https protocol");
    }
  } catch {
    errors.push("Invalid URL format");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates a payment amount
 */
export function validateAmount(amount: string): ValidationResult {
  const errors: string[] = [];
  if (!amount || !amount.trim()) {
    errors.push("Amount is required");
    return { isValid: false, errors };
  }

  const numAmount = Number(amount);
  if (isNaN(numAmount)) {
    errors.push("Amount must be a valid number");
    return { isValid: false, errors };
  }

  if (numAmount <= 0) {
    errors.push("Amount must be greater than 0");
  }

  if (numAmount > 1000000000) {
    errors.push("Amount cannot exceed 1,000,000,000");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates that text is not empty
 */
export function validateText(text: string, fieldName: string = "Text"): ValidationResult {
  const errors: string[] = [];
  if (!text || !text.trim()) {
    errors.push(`${fieldName} is required`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates MoneyGuard form
 */
export function validateMoneyGuardForm(data: {
  amount: string;
  recipient: string;
  paymentMethod: string;
}): ValidationResult {
  const errors: string[] = [];

  const amountResult = validateAmount(data.amount);
  if (!amountResult.isValid) {
    errors.push(...amountResult.errors);
  }

  if (!data.recipient || !data.recipient.trim()) {
    errors.push("Recipient is required");
  }

  if (!data.paymentMethod || !data.paymentMethod.trim()) {
    errors.push("Payment method is required");
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates InboxGuard form (either text or URL must be provided)
 */
export function validateInboxGuardForm(data: { text: string; url: string }): ValidationResult {
  const errors: string[] = [];

  const hasText = data.text && data.text.trim();
  const hasUrl = data.url && data.url.trim();

  if (!hasText && !hasUrl) {
    errors.push("Either message text or URL must be provided");
    return { isValid: false, errors };
  }

  if (hasUrl) {
    const urlResult = validateUrl(data.url);
    if (!urlResult.isValid) {
      errors.push(...urlResult.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates IdentityWatch profile form
 */
export function validateIdentityWatchProfile(data: {
  emails: string;
  phones: string;
}): ValidationResult {
  const errors: string[] = [];

  const hasEmails = data.emails && data.emails.trim();
  const hasPhones = data.phones && data.phones.trim();

  if (!hasEmails && !hasPhones) {
    errors.push("At least one email or phone number is required");
    return { isValid: false, errors };
  }

  if (hasEmails) {
    const emailResult = validateEmails(data.emails);
    if (!emailResult.isValid) {
      errors.push(...emailResult.errors);
    }
  }

  if (hasPhones) {
    const phoneResult = validatePhones(data.phones);
    if (!phoneResult.isValid) {
      errors.push(...phoneResult.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

