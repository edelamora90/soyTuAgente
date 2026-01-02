// api/src/validators/url-or-asset.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsUrlOrAssetPath(validationOptions?: ValidationOptions) {
  return function (target: object, propertyName: string) {
    registerDecorator({
      name: 'isUrlOrAssetPath',
      target: (target as any).constructor, // casteo para obtener el constructor
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (value == null || value === '') return true; // opcional -> válido
          if (typeof value !== 'string') return false;

          // Acepta: http(s)://..., assets/*, public/*, agents/* (con o sin / inicial)
          return /^(https?:\/\/|\/?assets\/|\/?public\/|\/?agents\/)/i.test(value.trim());
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an http(s) URL, or an assets/*, public/*, or agents/* path`;
        },
      },
    });
  };
}
