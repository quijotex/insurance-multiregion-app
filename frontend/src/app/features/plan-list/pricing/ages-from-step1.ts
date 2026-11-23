import { Step1Values } from '../../../core/session/quote-session.store';
import { ageOn } from '../../quote-form/validation/named-rules';

export interface Ages {
  driverAge: number | null;
  vehicleAge: number | null;
}

/**
 * Driver age (whole years on `today`) from `birthDate` (YYYY-MM-DD) and vehicle age
 * (`today.getFullYear() - vehicleYear`, never below 0) from `vehicleYear`.
 * Invalid or missing values give null.
 */
export function agesFromStep1(values: Step1Values, today: Date): Ages {
  const birthDate = values['birthDate'];
  const vehicleYear = values['vehicleYear'];
  const driverAge = typeof birthDate === 'string' ? ageOn(birthDate.trim(), today) : null;
  const year =
    typeof vehicleYear === 'string' && /^\d{4}$/.test(vehicleYear.trim())
      ? Number(vehicleYear.trim())
      : null;
  return {
    driverAge,
    vehicleAge: year === null ? null : Math.max(0, today.getFullYear() - year),
  };
}
