import { validate } from "uuid";
import { InMemoryUsersRepository } from "../../../users/repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../../users/repositories/IUsersRepository";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";
import { OperationType } from "../../enums/OperationType";
import { InMemoryStatementsRepository } from "../../repositories/in-memory/InMemoryStatementsRepository";
import { IStatementsRepository } from "../../repositories/IStatementsRepository";
import { CreateStatementUseCase } from "../createStatement/CreateStatementUseCase";
import { ICreateStatementDTO } from "../createStatement/ICreateStatementDTO";
import { GetStatementOperationUseCase } from "./GetStatementOperationUseCase";
import { v4 as uuidV4 } from "uuid";
import { GetStatementOperationError } from "./GetStatementOperationError";

let usersRepository: IUsersRepository;
let statementsRepository: IStatementsRepository;
let createStatementUseCase: CreateStatementUseCase;
let getStatementOperationUseCase: GetStatementOperationUseCase;

const user: ICreateUserDTO = {
  name: "Sample Name",
  email: "sample@email.com",
  password: "1234",
};

let statement: ICreateStatementDTO;

describe("Get Statement Operation", () => {
  beforeEach(async () => {
    usersRepository = new InMemoryUsersRepository();
    statementsRepository = new InMemoryStatementsRepository();
    createStatementUseCase = new CreateStatementUseCase(
      usersRepository,
      statementsRepository
    );
    getStatementOperationUseCase = new GetStatementOperationUseCase(
      usersRepository,
      statementsRepository
    );

    const createdUser = await usersRepository.create(user);

    statement = {
      user_id: createdUser.id as string,
      amount: 100,
      description: "Sample description",
      type: OperationType.DEPOSIT,
    };
  });

  it("should be able to get a statement operation", async () => {
    const createdStatement = await createStatementUseCase.execute(statement);

    const statementOperation = await getStatementOperationUseCase.execute({
      statement_id: createdStatement.id as string,
      user_id: createdStatement.user_id,
    });

    expect(validate(statementOperation.id as string)).toBe(true);
    expect(statementOperation).toMatchObject(createdStatement);
  });

  it("should not be able to get a statement operation from a non existing statement", async () => {
    expect.assertions(3);

    try {
      await getStatementOperationUseCase.execute({
        statement_id: uuidV4(),
        user_id: statement.user_id,
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(GetStatementOperationError.StatementNotFound);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(404);
    }
  });

  it("should not be able to get a statement operation from a non existing user", async () => {
    expect.assertions(3);

    const createdStatement = await createStatementUseCase.execute(statement);

    try {
      await getStatementOperationUseCase.execute({
        statement_id: createdStatement.id as string,
        user_id: uuidV4(),
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(GetStatementOperationError.UserNotFound);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(404);
    }
  });
});
