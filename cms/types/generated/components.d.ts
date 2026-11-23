import type { Schema, Struct } from '@strapi/strapi';

export interface FormOption extends Struct.ComponentSchema {
  collectionName: 'components_form_options';
  info: {
    description: 'Option of a select field';
    displayName: 'Option';
  };
  attributes: {
    label: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.String & Schema.Attribute.Required;
  };
}

export interface FormValidations extends Struct.ComponentSchema {
  collectionName: 'components_form_validations';
  info: {
    description: 'Validation rules of a form field';
    displayName: 'Validations';
  };
  attributes: {
    allowedCharacters: Schema.Attribute.Enumeration<
      ['digits', 'alphanumeric', 'rut']
    >;
    max: Schema.Attribute.Decimal;
    maxLength: Schema.Attribute.Integer &
      Schema.Attribute.SetMinMax<
        {
          min: 1;
        },
        number
      >;
    min: Schema.Attribute.Decimal;
    pattern: Schema.Attribute.String;
    validators: Schema.Attribute.Component<'form.validator', true>;
  };
}

export interface FormValidator extends Struct.ComponentSchema {
  collectionName: 'components_form_validators';
  info: {
    description: 'Named validation rule';
    displayName: 'Validator';
  };
  attributes: {
    name: Schema.Attribute.String & Schema.Attribute.Required;
    value: Schema.Attribute.Integer;
  };
}

export interface PlanItem extends Struct.ComponentSchema {
  collectionName: 'components_plan_items';
  info: {
    description: 'Coverage or benefit line of a plan';
    displayName: 'Item';
  };
  attributes: {
    text: Schema.Attribute.String &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMaxLength<{
        maxLength: 120;
      }>;
  };
}

export interface PricingAgeBand extends Struct.ComponentSchema {
  collectionName: 'components_pricing_age_bands';
  info: {
    description: 'Monthly price = base price \u00D7 driver-age factor \u00D7 vehicle-age factor. The first band that covers the age applies; no band \u2192 factor 1. Not shown to customers (ADR 0005).';
    displayName: 'Age band';
  };
  attributes: {
    factor: Schema.Attribute.Decimal &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0.01;
        },
        number
      >;
    fromAge: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
    toAge: Schema.Attribute.Integer &
      Schema.Attribute.Required &
      Schema.Attribute.SetMinMax<
        {
          min: 0;
        },
        number
      >;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'form.option': FormOption;
      'form.validations': FormValidations;
      'form.validator': FormValidator;
      'plan.item': PlanItem;
      'pricing.age-band': PricingAgeBand;
    }
  }
}
