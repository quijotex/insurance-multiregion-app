import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { mapPlans } from './plan.mapper';
import { Plan, PlansResponseDto } from './plan.model';

@Injectable({ providedIn: 'root' })
export class PlanService {
  private readonly http = inject(HttpClient);

  /** Active, published plans of the country, in CMS order. */
  load(countryCode: string): Observable<Plan[]> {
    const params = new HttpParams()
      .set('filters[country][code][$eq]', countryCode.toUpperCase())
      .set('filters[active][$eq]', 'true')
      .set('sort', 'order:asc')
      .set('populate[coverages]', 'true')
      .set('populate[benefits]', 'true')
      .set('pagination[pageSize]', '100');
    return this.http
      .get<PlansResponseDto>('/api/plans', { params })
      .pipe(map((response) => mapPlans(response.data)));
  }
}
