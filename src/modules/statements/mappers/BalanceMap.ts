import { Statement } from '../entities/Statement';

export class BalanceMap {
  static toDTO({
    statement,
    statementSends,
    balance,
  }: {
    statement: Statement[];
    statementSends: Statement[];
    balance: number;
  }) {
    const parsedStatement = statement.map(
      ({
        id,
        amount,
        description,
        type,
        sender_id,
        sender,
        created_at,
        updated_at,
      }) => {
        if (sender) delete (sender as any).password;

        return {
          id,
          amount: Number(amount),
          description,
          type,
          sender_id,
          sender,
          created_at,
          updated_at,
        };
      },
    );

    const parsedStatementSends = statementSends.map(
      ({
        id,
        amount,
        description,
        type,
        user_id,
        user,
        created_at,
        updated_at,
      }) => {
        if (user) delete (user as any).password;

        return {
          id,
          amount: Number(amount),
          description,
          type,
          user_id,
          user,
          created_at,
          updated_at,
        };
      },
    );

    return {
      statement: parsedStatement,
      statementSends: parsedStatementSends,
      balance: Number(balance),
    };
  }
}
