type ValidationSuccess = {
  isValid: true;
  value: string;
};

type ValidationFailure = {
  isValid: false;
  error: string;
};

type ValidationResult = ValidationSuccess | ValidationFailure;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_DIGITS_REGEX = /^\d{8}$/;
const OTP_REGEX = /^\d{6}$/;

function getFailure(error: string): ValidationFailure {
  return {
    isValid: false,
    error,
  };
}

function getSuccess(value: string): ValidationSuccess {
  return {
    isValid: true,
    value,
  };
}

export function validateEmailValue(
  email: string,
  messages: {
    required: string;
    invalid: string;
  },
): ValidationResult {
  const trimmedEmail = email.trim().toLowerCase();

  if (!trimmedEmail) {
    return getFailure(messages.required);
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return getFailure(messages.invalid);
  }

  return getSuccess(trimmedEmail);
}

export function validatePasswordValue(
  password: string,
  messages: {
    required: string;
    tooShort: string;
    tooLong: string;
  },
): ValidationResult {
  if (!password.trim()) {
    return getFailure(messages.required);
  }

  if (password.length < 8) {
    return getFailure(messages.tooShort);
  }

  if (password.length > 64) {
    return getFailure(messages.tooLong);
  }

  return getSuccess(password);
}

export function validateNameValue(
  name: string,
  messages: {
    required: string;
    tooLong: string;
  },
): ValidationResult {
  const trimmedName = name.trim();

  if (!trimmedName) {
    return getFailure(messages.required);
  }

  if (trimmedName.length > 100) {
    return getFailure(messages.tooLong);
  }

  return getSuccess(trimmedName);
}

export function validatePhoneValue(
  phone: string,
  messages: {
    required: string;
    invalid: string;
  },
): ValidationResult {
  const trimmedPhone = phone.trim();

  if (!trimmedPhone) {
    return getFailure(messages.required);
  }

  if (!PHONE_DIGITS_REGEX.test(trimmedPhone)) {
    return getFailure(messages.invalid);
  }

  return getSuccess(trimmedPhone);
}

export function validateOtpValue(
  otpCode: string,
  messages: {
    required: string;
    invalid: string;
  },
): ValidationResult {
  const trimmedOtp = otpCode.trim();

  if (!trimmedOtp) {
    return getFailure(messages.required);
  }

  if (!OTP_REGEX.test(trimmedOtp)) {
    return getFailure(messages.invalid);
  }

  return getSuccess(trimmedOtp);
}
