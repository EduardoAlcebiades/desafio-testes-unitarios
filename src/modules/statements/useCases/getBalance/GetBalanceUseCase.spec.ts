import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { ICreateUserDTO } from "../../../users/dtos/ICreateUserDTO";
import { OperationType } from "../../enums/OperationType";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../../dtos/ICreateStatementDTO";
import { GetBalanceUseCase } from "./GetBalanceUseCase";
import { v4 as uuidV4 } from "uuid";
import { GetBalanceError } from "../../errors/GetBalanceError";

let statementsRepository: IStatementsRepository;
let usersRepository: IUsersRepository;
let createStatementUseCase: CreateStatementUseCase;
let getBalanceUseCase: GetBalanceUseCase;

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
    getBalanceUseCase = new GetBalanceUseCase(
      statementsRepository,
      usersRepository
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

  it("should be able to get balance before a deposit statement", async () => {
    const createdStatement = await createStatementUseCase.execute(
      depositStatement
    );

    const { balance, statement } = await getBalanceUseCase.execute({
      user_id: depositStatement.user_id,
    });

    expect(balance).toBe(depositStatement.amount);
    expect(statement).toEqual([createdStatement]);
  });

  it("should be able to get balance before a withdraw statement", async () => {
    const createdDepositStatement = await createStatementUseCase.execute(
      depositStatement
    );
    const createdWithdrawStatement = await createStatementUseCase.execute(
      withdrawStatement
    );

    const { balance, statement } = await getBalanceUseCase.execute({
      user_id: withdrawStatement.user_id,
    });

    const totalBalance = depositStatement.amount - withdrawStatement.amount;

    expect(balance).toBe(totalBalance);
    expect(statement).toMatchObject([
      createdDepositStatement,
      createdWithdrawStatement,
    ]);
  });

  it("should not be able to get balance from a non existing user", async () => {
    expect.assertions(3);

    try {
      await getBalanceUseCase.execute({
        user_id: uuidV4(),
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(GetBalanceError);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(404);
    }
  });
});
