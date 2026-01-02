// api/src/common/filters/prisma-exception.filter.ts
import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(e: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    const dup: any = e;
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';
    switch (e.code) {
      case 'P2002': status = 409; message = `Registro duplicado: ${e.meta?.['target']}`; break;
      case 'P2003': status = 400; message = 'Violación de clave foránea'; break;
      case 'P2025': status = 404; message = 'Registro no encontrado'; break;
    }
    res.status(status).json({ statusCode: status, code: e.code, message });
  }
}
