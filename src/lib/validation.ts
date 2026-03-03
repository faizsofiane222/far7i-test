// Utility functions for email validation and security

/**
 * Validates email format and checks against disposable email providers
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  // Normalisation
  const normalized = email.trim().toLowerCase();
  
  // Regex plus stricte (RFC 5322 simplified)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: 'Format d\'email invalide' };
  }
  
  // Blacklist de domaines jetables courants
  const disposableDomains = [
    'tempmail.com',
    'guerrillamail.com',
    '10minutemail.com',
    'mailinator.com',
    'throwaway.email',
    'temp-mail.org',
    'yopmail.com',
    'maildrop.cc',
    'trashmail.com',
  ];
  
  const domain = normalized.split('@')[1];
  if (disposableDomains.includes(domain)) {
    return { valid: false, error: 'Les emails jetables ne sont pas acceptés' };
  }
  
  // Vérification de longueur (RFC 5321)
  if (normalized.length > 254) {
    return { valid: false, error: 'Email trop long' };
  }
  
  const [localPart] = normalized.split('@');
  if (localPart.length > 64) {
    return { valid: false, error: 'Email invalide' };
  }
  
  return { valid: true };
};

/**
 * Validates URL safety
 * @param url - URL to validate
 * @returns true if URL is safe to use
 */
export function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // Whitelist de protocoles sûrs
    const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
    return safeProtocols.includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Sanitizes user input to prevent injection attacks
 * @param input - User input string
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and >
    .substring(0, 500); // Limit length
}
