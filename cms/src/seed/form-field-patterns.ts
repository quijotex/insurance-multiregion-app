// Regular expressions used by the seeded form fields. The frontend applies them anchored (whole value).
export const CO_DOCUMENT_NUMBER_PATTERN = '^[0-9]{6,10}$';
export const FULL_NAME_PATTERN = '^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]{3,80}$';
export const EMAIL_PATTERN = '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$';
export const CO_MOBILE_PATTERN = '^3[0-9]{9}$';
export const CL_MOBILE_PATTERN = '^9[0-9]{8}$';
export const CO_PLATE_PATTERN = '^[A-Za-z]{3}[0-9]{3}$';
export const CL_PLATE_PATTERN = '^([A-Za-z]{4}[0-9]{2}|[A-Za-z]{2}[0-9]{4})$';
// Permissive on purpose: the named `rut` validator checks the check digit.
export const CL_RUT_PATTERN = '^[0-9.]{7,10}-?[0-9kK]$';
