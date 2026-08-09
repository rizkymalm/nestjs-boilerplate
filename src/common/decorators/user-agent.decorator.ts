import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UAParser } from 'ua-parser-js';

export const UserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request: Request = ctx.switchToHttp().getRequest();

    // Extract the user-agent string from headers
    const userAgentString = request.headers['user-agent'] || '';

    // Initialize the parser and return the structured result
    const parser = new UAParser(userAgentString);
    return parser.getResult();
  },
);
