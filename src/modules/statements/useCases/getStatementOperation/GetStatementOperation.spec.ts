import request from "supertest";
import { decode, sign } from "jsonwebtoken";
import { Connection } from "typeorm";
import { v4 as uuidV4, validate } from "uuid";

import { app } from "../../../../app";
import { connect } from "../../../../database";
import { ICreateUserDTO } from "../../../users/dtos/ICreateUserDTO";

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
let statementId: string;
let statement: ICreateStatementRequestDTO;

const user: ICreateUserDTO = {
  name: "Sample Name",
  email: "sample@email.com",
  password: "1234",
};

describe("Get Statement Operation", () => {
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
    statement = {
      amount: 100,
      description: "Sample description",
    };
  });

  afterAll(async () => {
    await connection.close();
  });

  it("should be able to get a statement operation", async () => {
    const depositReponse = await request(app)
      .post("/api/v1/statements/deposit")
      .send(statement)
      .set({ Authorization: `Bearer ${token}` });

    const response = await request(app)
      .get(`/api/v1/statements/${depositReponse.body.id}`)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      ...statement,
      amount: statement.amount.toFixed(2),
    });
    expect(response.body.type).toBe("deposit");
    expect(validate(response.body.id)).toBe(true);
    expect(validate(response.body.user_id)).toBe(true);
    expect(response.body).toHaveProperty("created_at");
    expect(response.body).toHaveProperty("updated_at");
  });

  it("should not be able to get a statement operation with a invalid id", async () => {
    const response = await request(app)
      .get(`/api/v1/statements/${uuidV4()}`)
      .set({ Authorization: `Bearer ${token}` });

    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("message");
  });

  it("should not be able to get a statement operation when not authenticated", async () => {
    const depositReponse = await request(app)
      .post("/api/v1/statements/deposit")
      .send(statement)
      .set({ Authorization: `Bearer ${token}` });

    const response = await request(app).get(
      `/api/v1/statements/${depositReponse.body.id}`
    );

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });

  it("should not be able to get a statement operation with a invalid token", async () => {
    const depositReponse = await request(app)
      .post("/api/v1/statements/deposit")
      .send(statement)
      .set({ Authorization: `Bearer ${token}` });

    const response = await request(app)
      .get(`/api/v1/statements/${depositReponse.body.id}`)
      .set({ Authorization: `Bearer ${invalidToken}` });

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("message");
  });
});
