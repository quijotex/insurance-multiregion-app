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

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'form.option': FormOption;
      'form.validations': FormValidations;
      'form.validator': FormValidator;
    }
  }
}
