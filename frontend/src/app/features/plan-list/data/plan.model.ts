/** Strapi DTO types — mirror cms/src/api/plan (see specs/003-us-02-plan-list/contracts/plans-api.md). */
export interface PlanItemDto {
  id?: number;
  text: string;
}

export interface PlanDto {
  id: number;
  documentId: string;
  name: string;
  shortDescription: string;
  basePrice: number | null;
  order: number | null;
  recommended: boolean | null;
  active: boolean | null;
  coverages?: PlanItemDto[] | null;
  benefits?: PlanItemDto[] | null;
}

export interface PlansResponseDto {
  data: PlanDto[];
}

/** App model. `id` is the Strapi documentId. */
export interface Plan {
  id: string;
  name: string;
  shortDescription: string;
  /** Whole monthly units of the country's currency, before the age factors. */
  basePrice: number;
  coverages: string[];
  benefits: string[];
  /** True only for the first recommended plan in order. */
  highlighted: boolean;
}

/** View model: a plan with its simulated price for the current person and vehicle. */
export interface PlanOffer {
  plan: Plan;
  finalPrice: number;
  formattedPrice: string;
}
