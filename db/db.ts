import Dexie, { Table } from 'dexie';
import { Track } from '../types';
import { DB_NAME, DB_VERSION } from '../constants';

export class BeatCatalogDB extends Dexie {
  tracks!: Table<Track, string>;

  constructor() {
    super(DB_NAME);
    (this as any).version(DB_VERSION).stores({
      tracks: 'id, title, artist, addedAt, duration' 
    });
  }
}

export const db = new BeatCatalogDB();