import { decode } from "jsonwebtoken";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";
import { AuthenticateUserUseCase } from "./AuthenticateUserUseCase";
import { IncorrectEmailOrPasswordError } from "./IncorrectEmailOrPasswordError";

let usersRepository: IUsersRepository;
let createUserUseCase: CreateUserUseCase;
let authenticateUserUseCase: AuthenticateUserUseCase;

interface IJWTPayload {
  sub: string;
}

const user: ICreateUserDTO = {
  name: "Sample Name",
  email: "sample@email.com",
  password: "1234",
};

describe("Authenticate User", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
    authenticateUserUseCase = new AuthenticateUserUseCase(usersRepository);
  });

  it("should be able to authenticate an user", async () => {
    const createdUser = await createUserUseCase.execute(user);

    const result = await authenticateUserUseCase.execute({
      email: user.email,
      password: user.password,
    });

    const decodedToken = decode(result.token) as IJWTPayload;

    expect(decodedToken.sub).toEqual(createdUser.id);
    expect(result.user).toMatchObject({
      id: createdUser.id,
      name: user.name,
      email: user.email,
    });
  });

  it("should not be able to authenticate a non existing user", async () => {
    expect.assertions(3);

    try {
      await authenticateUserUseCase.execute({
        email: user.email,
        password: user.password,
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(IncorrectEmailOrPasswordError);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(401);
    }
  });

  it("should not be able to authenticate an user with wrong password", async () => {
    await createUserUseCase.execute(user);

    expect.assertions(3);

    try {
      await authenticateUserUseCase.execute({
        email: user.email,
        password: `wrong${user.password}`,
      });
    } catch (err: any) {
      expect(err).toBeInstanceOf(IncorrectEmailOrPasswordError);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(401);
    }
  });
});
