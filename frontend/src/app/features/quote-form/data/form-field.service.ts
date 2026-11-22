import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { mapFormFields } from './form-field.mapper';
import { FormFieldsResponseDto, FormSections } from './form-field.model';

@Injectable({ providedIn: 'root' })
export class FormFieldService {
  private readonly http = inject(HttpClient);

  load(countryCode: string): Observable<FormSections> {
    const params = new HttpParams()
      .set('filters[country][code][$eq]', countryCode.toUpperCase())
      .set('sort[0]', 'section:asc')
      .set('sort[1]', 'order:asc')
      .set('populate[validations][populate][validators]', 'true')
      .set('populate[options]', 'true')
      .set('pagination[pageSize]', '100');
    return this.http
      .get<FormFieldsResponseDto>('/api/form-fields', { params })
      .pipe(map((response) => mapFormFields(response.data)));
  }
}
