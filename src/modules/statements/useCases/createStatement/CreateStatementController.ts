import { Request, Response } from 'express';
import { container } from 'tsyringe';
import { OperationType } from '../../enums/OperationType';

import { CreateStatementUseCase } from './CreateStatementUseCase';

export class CreateStatementController {
  async execute(request: Request, response: Response) {
    const { id } = request.user;
    const { amount, description } = request.body;

    let { user_id } = request.params;
    let sender_id;

    const splittedPath = request.originalUrl.split('/');
    const indexOfType = splittedPath.indexOf('statements') + 1;
    const type = splittedPath[indexOfType] as OperationType;

    const createStatement = container.resolve(CreateStatementUseCase);

    if (type === 'transfer') sender_id = id;
    else user_id = id;

    const statement = await createStatement.execute({
      user_id,
      type,
      amount,
      description,
      sender_id,
    });

    return response.status(201).json(statement);
  }
}
