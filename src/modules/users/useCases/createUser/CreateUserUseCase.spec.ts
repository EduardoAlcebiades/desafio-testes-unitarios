import { validate } from "uuid";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserUseCase } from "./CreateUserUseCase";
import { ICreateUserDTO } from "../../dtos/ICreateUserDTO";
import { compareSync } from "bcryptjs";
import { CreateUserError } from "../../errors/CreateUserError";

let createUserUseCase: CreateUserUseCase;
let usersRepository: IUsersRepository;

const user: ICreateUserDTO = {
  name: "Sample Name",
  email: "sample@email.com",
  password: "1234",
};

describe("Create User", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
  });

  it("should be able to create a new user", async () => {
    const createdUser = await createUserUseCase.execute(user);

    expect(createdUser).toMatchObject({
      name: user.name,
      email: user.email,
    });
    expect(validate(createdUser.id as string)).toBe(true);
    expect(compareSync(user.password, createdUser.password)).toBe(true);
  });

  it("should not be able to create multiple users with the same email", async () => {
    await createUserUseCase.execute(user);

    expect.assertions(3);

    try {
      await createUserUseCase.execute(user);
    } catch (err: any) {
      expect(err).toBeInstanceOf(CreateUserError);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(400);
    }
  });
});
