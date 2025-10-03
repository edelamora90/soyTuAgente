// api/src/validators/url-or-asset.validator.ts
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsUrlOrAssetPath(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isUrlOrAssetPath',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (value == null || value === '') return true; // deja pasar opcionales
          if (typeof value !== 'string') return false;
          // http(s)://...  O  assets/...  O  /assets/...
          return /^(https?:\/\/|\/?assets\/)/i.test(value);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be an http(s) URL or an assets/* path`;
        },
      },
    });
  };
}
