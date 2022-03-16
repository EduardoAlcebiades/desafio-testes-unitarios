import { decode, sign } from "jsonwebtoken";
import request from "supertest";
import { Connection } from "typeorm";
import { validate } from "uuid";

import { app } from "../../../../app";
import { connect } from "../../../../database";
import { ICreateUserDTO } from "../../dtos/ICreateUserDTO";

interface IJWTPayload {
  sub: string;
}

let connection: Connection;
let token: string;
let invalidToken: string;
let userId: string;

const user: ICreateUserDTO = {
  name: "Sample name",
  email: "sample@email.com",
  password: "1234",
};

describe("Create User", () => {
  beforeAll(async () => {
    connection = await connect();

    await connection.dropDatabase();
    await connection.runMigrations();

    await request(app).post("/api/v1/users").send(user);

    const response = await request(app).post("/api/v1/sessions").send({
      email: user.email,
      password: user.password,
    });

    const decodedToken = decode(response.body.token) as IJWTPayload;

    token = response.body.token;
    userId = decodedToken.sub;
    invalidToken = sign(decodedToken, "INVALIDSECRET");
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should be able to show the profile of the authenticated user", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(validate(response.body.id)).toBe(true);
    expect(response.body).toMatchObject({
      id: userId,
      name: user.name,
      email: user.email,
    });
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");
  });

  it("should not be able to show a profile of a non authenticated user", async () => {
    const response = await request(app).get("/api/v1/profile");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should not be able to show a profile of the user with an invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/profile")
      .set({ Authorization: `Bearer ${invalidToken}` });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
