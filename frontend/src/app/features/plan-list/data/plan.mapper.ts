import { Plan, PlanDto, PlanItemDto } from './plan.model';

function mapItems(items: PlanItemDto[] | null | undefined): string[] {
  return (items ?? []).map((item) => item.text).filter((text) => typeof text === 'string' && text !== '');
}

function isValidBasePrice(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Keeps the API order (a defensive stable sort by `order` too), drops plans with an invalid
 * `basePrice`, and highlights only the first recommended one.
 */
export function mapPlans(dtos: PlanDto[]): Plan[] {
  const sorted = dtos
    .map((dto, index) => ({ dto, index }))
    .sort((a, b) => (a.dto.order ?? Infinity) - (b.dto.order ?? Infinity) || a.index - b.index)
    .map(({ dto }) => dto);

  let highlightTaken = false;
  const plans: Plan[] = [];
  for (const dto of sorted) {
    if (!isValidBasePrice(dto.basePrice)) continue;
    const highlighted = dto.recommended === true && !highlightTaken;
    if (highlighted) highlightTaken = true;
    plans.push({
      id: dto.documentId,
      name: dto.name,
      shortDescription: dto.shortDescription,
      basePrice: dto.basePrice,
      coverages: mapItems(dto.coverages),
      benefits: mapItems(dto.benefits),
      highlighted,
    });
  }
  return plans;
}
