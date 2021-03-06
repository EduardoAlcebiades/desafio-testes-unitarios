import { Statement } from '../../entities/Statement';
import { ICreateStatementDTO } from '../../dtos/ICreateStatementDTO';
import { IGetBalanceDTO } from '../../dtos/IGetBalanceDTO';
import { IGetStatementOperationDTO } from '../../dtos/IGetStatementOperationDTO';
import { IStatementsRepository } from '../IStatementsRepository';

export class InMemoryStatementsRepository implements IStatementsRepository {
  private statements: Statement[] = [];

  async create(data: ICreateStatementDTO): Promise<Statement> {
    const statement = new Statement();

    Object.assign(statement, data);

    this.statements.push(statement);

    return statement;
  }

  async findStatementOperation({
    statement_id,
    user_id,
  }: IGetStatementOperationDTO): Promise<Statement | undefined> {
    return this.statements.find(
      operation =>
        operation.id === statement_id && operation.user_id === user_id,
    );
  }

  async getUserBalance({
    user_id,
    with_statement = false,
  }: IGetBalanceDTO): Promise<
    | { balance: number }
    | { balance: number; statement: Statement[]; statementSends: Statement[] }
  > {
    const statement = this.statements.filter(
      operation => operation.user_id === user_id,
    );

    const statementSends = this.statements.filter(
      operation => operation.sender_id === user_id,
    );

    const balance = statement.reduce((acc, operation) => {
      if (operation.type === 'deposit' || operation.type === 'transfer') {
        return Number(acc) + Number(operation.amount);
      } else {
        return Number(acc) - Number(operation.amount);
      }
    }, 0);
    const transferSendsBalance = statementSends.reduce((acc, operation) => {
      return Number(acc) + Number(operation.amount);
    }, 0);

    if (with_statement) {
      return {
        statement,
        statementSends,
        balance: balance - transferSendsBalance,
      };
    }

    return { balance: balance - transferSendsBalance };
  }
}
