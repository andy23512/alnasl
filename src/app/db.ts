import Dexie, { Table } from 'dexie';
import { SessionSummary } from './models/practice.models';

export class AppDB extends Dexie {
  sessions!: Table<SessionSummary, number>;

  constructor() {
    super('appDB');
    this.version(1).stores({
      sessions: '++id, timestamp, mode',
    });
  }
}

export const db = new AppDB();
