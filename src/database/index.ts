import { Connection, createConnection } from "typeorm";

async function connect(): Promise<Connection> {
  const connection = await createConnection();

  return connection;
}

export { connect };
