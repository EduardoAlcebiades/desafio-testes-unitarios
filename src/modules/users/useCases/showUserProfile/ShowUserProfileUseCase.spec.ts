import { compareSync } from "bcryptjs";
import { v4 as uuidV4, validate } from "uuid";
import { InMemoryUsersRepository } from "../../repositories/in-memory/InMemoryUsersRepository";
import { IUsersRepository } from "../../repositories/IUsersRepository";
import { CreateUserUseCase } from "../createUser/CreateUserUseCase";
import { ICreateUserDTO } from "../../dtos/ICreateUserDTO";
import { ShowUserProfileError } from "../../errors/ShowUserProfileError";
import { ShowUserProfileUseCase } from "./ShowUserProfileUseCase";

let showUserProfileUseCase: ShowUserProfileUseCase;
let createUserUseCase: CreateUserUseCase;
let usersRepository: IUsersRepository;

const user: ICreateUserDTO = {
  name: "Sample Name",
  email: "sample@email.com",
  password: "1234",
};

describe("Show User Profile", () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    createUserUseCase = new CreateUserUseCase(usersRepository);
    showUserProfileUseCase = new ShowUserProfileUseCase(usersRepository);
  });

  it("should be able to show user profile", async () => {
    const { id } = await createUserUseCase.execute(user);
    const showedUser = await showUserProfileUseCase.execute(id as string);

    expect(showedUser).toMatchObject({
      name: user.name,
      email: user.email,
    });
    expect(validate(showedUser.id as string)).toBe(true);
    expect(compareSync(user.password, showedUser.password)).toBe(true);
  });

  it("should not be able to show a profile of a non existing user", async () => {
    expect.assertions(3)

    try {
      await showUserProfileUseCase.execute(uuidV4());
    } catch (err: any) {
      expect(err).toBeInstanceOf(ShowUserProfileError);
      expect(err).toHaveProperty("message");
      expect(err.statusCode).toBe(404);
    }
  });
});
