import { mapPlans } from './plan.mapper';
import { PlanDto } from './plan.model';

function dto(overrides: Partial<PlanDto> & { documentId: string }): PlanDto {
  return {
    id: 1,
    name: overrides.documentId,
    shortDescription: 'Desc',
    basePrice: 100000,
    order: 1,
    recommended: false,
    active: true,
    coverages: [],
    benefits: [],
    ...overrides,
  };
}

describe('US-02 · FR-002 / FR-003 plan mapper', () => {
  it('highlights only the first recommended plan, keeping the order', () => {
    const plans = mapPlans([
      dto({ documentId: 'a', order: 1 }),
      dto({ documentId: 'b', order: 2, recommended: true }),
      dto({ documentId: 'c', order: 3, recommended: true }),
    ]);
    expect(plans.map((p) => p.id)).toEqual(['a', 'b', 'c']);
    expect(plans.map((p) => p.highlighted)).toEqual([false, true, false]);
  });

  it('sorts defensively by order', () => {
    const plans = mapPlans([dto({ documentId: 'late', order: 2 }), dto({ documentId: 'early', order: 1 })]);
    expect(plans.map((p) => p.id)).toEqual(['early', 'late']);
  });

  it('maps coverages and benefits to text; null or missing lists become []', () => {
    const [full, empty] = mapPlans([
      dto({
        documentId: 'a',
        coverages: [{ id: 1, text: 'Grúa' }],
        benefits: [{ id: 2, text: 'Asistencia' }],
      }),
      dto({ documentId: 'b', order: 2, coverages: null, benefits: undefined }),
    ]);
    expect(full.coverages).toEqual(['Grúa']);
    expect(full.benefits).toEqual(['Asistencia']);
    expect(empty.coverages).toEqual([]);
    expect(empty.benefits).toEqual([]);
  });

  it('drops a plan whose basePrice is missing, negative or not finite', () => {
    const plans = mapPlans([
      dto({ documentId: 'ok', order: 1, basePrice: 0 }),
      dto({ documentId: 'null', order: 2, basePrice: null }),
      dto({ documentId: 'neg', order: 3, basePrice: -1 }),
      dto({ documentId: 'nan', order: 4, basePrice: Number.NaN }),
    ]);
    expect(plans.map((p) => p.id)).toEqual(['ok']);
  });
});
