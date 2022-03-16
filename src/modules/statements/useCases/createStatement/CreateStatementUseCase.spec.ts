import { validate } from 'uuid';
import { InMemoryUsersRepository } from '../../../users/repositories/in-memory/InMemoryUsersRepository';
import { IUsersRepository } from '../../../users/repositories/IUsersRepository';
import { ICreateUserDTO } from '../../../users/dtos/ICreateUserDTO';
import { OperationType } from '../../enums/OperationType';
import { InMemoryStatementsRepository } from '../../repositories/in-memory/InMemoryStatementsRepository';
import { IStatementsRepository } from '../../repositories/IStatementsRepository';
import { CreateStatementError } from '../../errors/CreateStatementError';
import { CreateStatementUseCase } from './CreateStatementUseCase';
import { ICreateStatementDTO } from '../../dtos/ICreateStatementDTO';
import { v4 as uuidV4 } from 'uuid';
import { GetBalanceUseCase } from '../getBalance/GetBalanceUseCase';

let statementsRepository: IStatementsRepository;
let usersRepository: IUsersRepository;
let createStatementUseCase: CreateStatementUseCase;

const user1: ICreateUserDTO = {
  name: 'Sample Name 1',
  email: 'sample1@email.com',
  password: '1234',
};
const user2: ICreateUserDTO = {
  name: 'Sample Name 2',
  email: 'sample2@email.com',
  password: '1234',
};

let depositStatement: ICreateStatementDTO;
let withdrawStatement: ICreateStatementDTO;
let transferStatement: ICreateStatementDTO;

describe('Create Statement', () => {
  beforeEach(async () => {
    statementsRepository = new InMemoryStatementsRepository();
    usersRepository = new InMemoryUsersRepository();
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementsRepository,
    );

    const createdUser1 = await usersRepository.create(user1);
    const createdUser2 = await usersRepository.create(user2);

    depositStatement = {
      user_id: createdUser1.id as string,
      amount: 100,
      description: 'Sample description',
      type: OperationType.DEPOSIT,
    };
    withdrawStatement = {
      user_id: createdUser1.id as string,
      amount: 20,
      description: 'Sample description',
      type: OperationType.WITHDRAW,
    };
    transferStatement = {
      user_id: createdUser2.id as string,
      sender_id: createdUser1.id as string,
      amount: 10,
      description: 'Sample description',
      type: OperationType.TRANSFER,
    };
  });

  it('should be able to create a new depoist statement', async () => {
    const createdStatement = await createStatementUseCase.execute(
      depositStatement,
    );

    const userBalance = await statementsRepository.getUserBalance({
      user_id: depositStatement.user_id,
    });

    expect(createdStatement).toMatchObject(depositStatement);
    expect(validate(createdStatement.id as string)).toBe(true);
    expect(userBalance.balance).toBe(createdStatement.amount);
  });

  it('should be able to create a new withdraw statement', async () => {
    await createStatementUseCase.execute(depositStatement);

    const createdStatement = await createStatementUseCase.execute(
      withdrawStatement,
    );

    const userBalance = await statementsRepository.getUserBalance({
      user_id: depositStatement.user_id,
    });

    const totalBalance = depositStatement.amount - withdrawStatement.amount;

    expect(createdStatement).toMatchObject(withdrawStatement);
    expect(validate(createdStatement.id as string)).toBe(true);
    expect(userBalance.balance).toBe(totalBalance);
  });

  it('should be able to create a new transfer statement', async () => {
    await createStatementUseCase.execute({
      ...depositStatement,
      user_id: transferStatement.sender_id as string,
    });

    const createdStatement = await createStatementUseCase.execute(
      transferStatement,
    );

    const senderBalance = await statementsRepository.getUserBalance({
      user_id: transferStatement.sender_id as string,
    });
    const receiverBalance = await statementsRepository.getUserBalance({
      user_id: transferStatement.user_id,
    });

    const totalSenderBalance =
      depositStatement.amount - transferStatement.amount;
    const totalReceiverBalance = transferStatement.amount;

    expect(createdStatement).toMatchObject(transferStatement);
    expect(validate(createdStatement.id as string)).toBe(true);
    expect(senderBalance.balance).toBe(totalSenderBalance);
    expect(receiverBalance.balance).toBe(totalReceiverBalance);
  });

  it('should not be able to create a new withdraw statement with insufficient user funds', async () => {
    expect.assertions(3);

    try {
      await createStatementUseCase.execute(withdrawStatement);
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateStatementError.InsufficientFunds);
      expect(err).toHaveProperty('message');
      expect(err.statusCode).toBe(400);
    }
  });

  it('should not be able to create a new transfer statement with insufficient user funds', async () => {
    expect.assertions(3);

    try {
      await createStatementUseCase.execute(transferStatement);
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateStatementError.InsufficientFunds);
      expect(err).toHaveProperty('message');
      expect(err.statusCode).toBe(400);
    }
  });

  it('should not be able to create a new statement for a non existing user', async () => {
    expect.assertions(3);

    try {
      await createStatementUseCase.execute({
        ...depositStatement,
        user_id: uuidV4(),
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateStatementError.UserNotFound);
      expect(err).toHaveProperty('message');
      expect(err.statusCode).toBe(404);
    }
  });

  it('should not be able to create a new transfer statement with same receiver and sender users', async () => {
    expect.assertions(3);

    try {
      await createStatementUseCase.execute({
        ...transferStatement,
        user_id: transferStatement.sender_id as string,
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateStatementError.CannotTransferToYourself);
      expect(err).toHaveProperty('message');
      expect(err.statusCode).toBe(400);
    }
  });

  it('should not be able to create a new transfer statement for a non existing user', async () => {
    expect.assertions(3);

    try {
      await createStatementUseCase.execute({
        ...transferStatement,
        user_id: uuidV4(),
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateStatementError.UserNotFound);
      expect(err).toHaveProperty('message');
      expect(err.statusCode).toBe(404);
    }
  });

  it('should not be able to create a new transfer statement for a non existing sender user', async () => {
    expect.assertions(3);

    try {
      await createStatementUseCase.execute({
        ...transferStatement,
        sender_id: uuidV4(),
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateStatementError.UserNotFound);
      expect(err).toHaveProperty('message');
      expect(err.statusCode).toBe(404);
    }
  });
});
