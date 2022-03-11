import { validate } from "uuid";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../enums/OperationType";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementError } from "./CreateStatementError";
import { CreateStatementUseCase } from "./CreateStatementUseCase";
import { ICreateStatementDTO } from "./ICreateStatementDTO";
import { v4 as uuidV4 } from "uuid";

let statementsRepository: IStatementsRepository;
let usersRepository: IUsersRepository;
let createStatementUseCase: CreateStatementUseCase;

const user: ICreateUserDTO = {
  name: "Sample Name",
  email: "sample@email.com",
  password: "1234",
};

let depositStatement: ICreateStatementDTO;
let withdrawStatement: ICreateStatementDTO;

describe("Create Statement", () => {
  beforeEach(async () => {
    statementsRepository = new InMemoryStatementsRepository();
    usersRepository = new InMemoryUsersRepository();
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementsRepository
    );

    const createdUser = await usersRepository.create(user);

    depositStatement = {
      user_id: createdUser.id as string,
      amount: 100,
      description: "Sample description",
      type: OperationType.DEPOSIT,
    };
    withdrawStatement = {
      user_id: createdUser.id as string,
      amount: 20,
      description: "Sample description",
      type: OperationType.WITHDRAW,
    };
  });

  it("should be able to create a new depoist statement", async () => {
    const createdStatement = await createStatementUseCase.execute(
      depositStatement
    );

    const userBalance = await statementsRepository.getUserBalance({
      user_id: depositStatement.user_id,
    });

    expect(createdStatement).toMatchObject(depositStatement);
    expect(validate(createdStatement.id as string)).toBe(true);
    expect(userBalance.balance).toBe(createdStatement.amount);
  });

  it("should be able to create a new withdraw statement", async () => {
    await createStatementUseCase.execute(depositStatement);

    const createdStatement = await createStatementUseCase.execute(
      withdrawStatement
    );

    const userBalance = await statementsRepository.getUserBalance({
      user_id: depositStatement.user_id,
    });

    const totalBalance = depositStatement.amount - withdrawStatement.amount;

    expect(createdStatement).toMatchObject(withdrawStatement);
    expect(validate(createdStatement.id as string)).toBe(true);
    expect(userBalance.balance).toBe(totalBalance);
  });

  it("should not be able to create a new withdraw statement with insufficient user funds", async () => {
    expect.assertions(3);

    try {
      await createStatementUseCase.execute(withdrawStatement);
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateStatementError.InsufficientFunds);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(400);
    }
  });

  it("should not be able to create a new statement for a non existing user", async () => {
    expect.assertions(3);

    try {
      await createStatementUseCase.execute({
        ...depositStatement,
        user_id: uuidV4(),
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateStatementError.UserNotFound);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(404);
    }
  });
});
