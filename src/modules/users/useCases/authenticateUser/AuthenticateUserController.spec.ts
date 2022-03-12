import { decode } from "jsonwebtoken";
import request from "supertest";
import { Connection } from "typeorm";
import { validate } from "uuid";

import { app } from "../../../../app";
import { connect } from "../../../../database";
import { ICreateUserDTO } from "../createUser/ICreateUserDTO";

interface IJWTPayload {
  sub: string;
}

let connection: Connection;

const user: ICreateUserDTO = {
  name: "Sample name",
  email: "sample@email.com",
  password: "1234",
};

describe("Authenticate User", () => {
  beforeAll(async () => {
    connection = await connect();

    await connection.dropDatabase();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send(user);
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should be able to authenticate a user", async () => {
    const response = await request(app).post("/api/v1/sessions").send({
      email: user.email,
      password: user.password,
    });

    const { token } = response.body;
    const decodedToken = decode(token) as IJWTPayload;

    expect(response.status).toBe(200);
    expect(validate(decodedToken.sub)).toBe(true);
    expect(response.body.user).toMatchObject({
      id: decodedToken.sub,
      name: user.name,
      email: user.email,
    });
  });

  it("should not be able to authenticate an user when email was not exist", async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: `wrong${user.email}`,
        password: user.password,
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should not be able to authenticate an user with wrong password", async () => {
    const response = await request(app)
      .post("/api/v1/sessions")
      .send({
        email: user.email,
        password: `wrong${user.password}`,
      });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
