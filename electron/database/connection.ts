import { join } from 'node:path';

import Database from 'better-sqlite3';
import { app } from 'electron';

import initialMigration from './migrations/001_initial.sql?raw';

type ExistingTable = {
  name: string;
};

class DatabaseConnection {
  private connection: Database.Database | null = null;

  getConnection(): Database.Database {
    if (this.connection) {
      return this.connection;
    }

    if (!app.isReady()) {
      throw new Error(
        'The database can only be opened after Electron is ready.',
      );
    }

    const databasePath = join(app.getPath('userData'), 'hamemuha.sqlite3');
    const connection = new Database(databasePath);

    connection.pragma('foreign_keys = ON');

    const quizzesTable = connection
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'quizzes'",
      )
      .get() as ExistingTable | undefined;

    if (!quizzesTable) {
      connection.transaction(() => {
        connection.exec(initialMigration);
      })();
    }

    this.connection = connection;
    return connection;
  }

  close(): void {
    this.connection?.close();
    this.connection = null;
  }
}

export const databaseConnection = new DatabaseConnection();

export function getDatabase(): Database.Database {
  return databaseConnection.getConnection();
}

export default databaseConnection;
