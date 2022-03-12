import { decode, sign } from "jsonwebtoken";
import request from "supertest";
import { Connection } from "typeorm";
import { validate } from "uuid";

import { app } from "../../../../app";
import { connect } from "../../../../database";
import { ICreateUserDTO } from "../../../users/useCases/createUser/ICreateUserDTO";

interface IJWTPayload {
  sub: string;
}

interface ICreateStatementRequestDTO {
  amount: number;
  description: string;
}

let connection: Connection;
let token: string;
let invalidToken: string;
let depositStatement: ICreateStatementRequestDTO;
let withdrawStatement: ICreateStatementRequestDTO;

const user: ICreateUserDTO = {
  name: "Sample Name",
  email: "sample@email.com",
  password: "1234",
};

describe("Create Statement", () => {
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
    invalidToken = sign(decodedToken, "INVALIDSECRET");
    depositStatement = {
      amount: 100,
      description: "Sample description",
    };
    withdrawStatement = {
      amount: 60,
      description: "Sample description",
    };
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should be able to create a new deposit", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send(depositStatement)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(depositStatement);
    expect(validate(response.body.id)).toBe(true);
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");
  });

  it("should not be able to create a new deposit when not authenticated", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send(depositStatement);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should not be able to create a new deposit authenticated with a invalid token", async () => {
    const response = await request(app)
      .post("/api/v1/statements/deposit")
      .send(depositStatement)
      .set({ Authorization: `Bearer ${invalidToken}` });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should be able to create a new withdraw", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send(withdrawStatement)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject(withdrawStatement);
    expect(validate(response.body.id)).toBe(true);
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");
  });

  it("should not be able to create a new withdraw with insuficient funds", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send(withdrawStatement)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty("message");
  });

  it("should not be able to create a new withdraw when not authenticated", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send(withdrawStatement);

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should not be able to create a new withdraw authenticated with a invalid token", async () => {
    const response = await request(app)
      .post("/api/v1/statements/withdraw")
      .send(withdrawStatement)
      .set({ Authorization: `Bearer ${invalidToken}` });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
