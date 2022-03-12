import request from "supertest";
import { Connection } from "typeorm";

import { app } from "../../../../app";
import { connect } from "../../../../database";
import { ICreateUserDTO } from "./ICreateUserDTO";

let connection: Connection;

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
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should be able to create a new user", async () => {
    const response = await request(app).post("/api/v1/users").send(user);

    expect(response.status).toBe(201);
    expect(JSON.stringify(response.body)).toEqual("{}");
  });

  it("should not be able to create multiple users with the same email", async () => {
    const response = await request(app).post("/api/v1/users").send(user);

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });
});
