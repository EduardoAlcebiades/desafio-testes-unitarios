import { decode, sign } from "jsonwebtoken";
import request from "supertest";
import { Connection } from "typeorm";

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

describe("Get Balance", () => {
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

  it("should be able to get balance account after a deposit", async () => {
    await request(app)
      .post("/api/v1/statements/deposit")
      .send(depositStatement)
      .set({ Authorization: `Bearer ${token}` });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body.balance).toBe(depositStatement.amount);
    expect(response.body.statement).toMatchObject([depositStatement]);
  });

  it("should be able to get balance account after a withdraw", async () => {
    await request(app)
      .post("/api/v1/statements/withdraw")
      .send(withdrawStatement)
      .set({ Authorization: `Bearer ${token}` });

    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({ Authorization: `Bearer ${token}` });

    const totalBalance = depositStatement.amount - withdrawStatement.amount;

    expect(response.status).toBe(200);
    expect(response.body.balance).toBe(totalBalance);
    expect(response.body.statement).toMatchObject([
      depositStatement,
      withdrawStatement,
    ]);
  });

  it("should not be able to get balance accout when not authenticated", async () => {
    const response = await request(app).get("/api/v1/statements/balance");

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should not be able to get balance accout with a invalid token", async () => {
    const response = await request(app)
      .get("/api/v1/statements/balance")
      .set({ Authorization: `Bearer ${invalidToken}` });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
