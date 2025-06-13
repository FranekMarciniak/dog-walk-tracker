import * as SQLite from 'expo-sqlite';

export interface Walk {
  id?: number;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  startLatitude: number;
  startLongitude: number;
  endLatitude?: number;
  endLongitude?: number;
  distance?: number; // in meters
  createdAt: string;
}

export interface RoutePoint {
  id?: number;
  walkId: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
}

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('dogwalks.db');
      await this.createTables();
    } catch (error) {
      console.error('Failed to initialize database:', error);
    }
  }

  private async createTables() {
    if (!this.db) return;

    try {
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS walks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          startTime TEXT NOT NULL,
          endTime TEXT NOT NULL,
          duration INTEGER NOT NULL,
          startLatitude REAL NOT NULL,
          startLongitude REAL NOT NULL,
          endLatitude REAL,
          endLongitude REAL,
          distance REAL,
          createdAt TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS route_points (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          walkId INTEGER NOT NULL,
          latitude REAL NOT NULL,
          longitude REAL NOT NULL,
          timestamp TEXT NOT NULL,
          accuracy REAL,
          FOREIGN KEY (walkId) REFERENCES walks (id) ON DELETE CASCADE
        );
      `);
      console.log('Database tables created successfully');
    } catch (error) {
      console.error('Failed to create tables:', error);
    }
  }

  async saveWalk(walk: Omit<Walk, 'id'>): Promise<number | null> {
    if (!this.db) {
      console.error('Database not initialized');
      return null;
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO walks (startTime, endTime, duration, startLatitude, startLongitude, endLatitude, endLongitude, distance, createdAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          walk.startTime,
          walk.endTime,
          walk.duration,
          walk.startLatitude,
          walk.startLongitude,
          walk.endLatitude || null,
          walk.endLongitude || null,
          walk.distance || null,
          walk.createdAt
        ]
      );
      
      console.log('Walk saved with ID:', result.lastInsertRowId);
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Failed to save walk:', error);
      return null;
    }
  }

  async saveRoutePoint(routePoint: Omit<RoutePoint, 'id'>): Promise<number | null> {
    if (!this.db) {
      console.error('Database not initialized');
      return null;
    }

    try {
      const result = await this.db.runAsync(
        `INSERT INTO route_points (walkId, latitude, longitude, timestamp, accuracy)
         VALUES (?, ?, ?, ?, ?)`,
        [
          routePoint.walkId,
          routePoint.latitude,
          routePoint.longitude,
          routePoint.timestamp,
          routePoint.accuracy || null
        ]
      );
      
      return result.lastInsertRowId;
    } catch (error) {
      console.error('Failed to save route point:', error);
      return null;
    }
  }

  async saveRoutePoints(routePoints: Omit<RoutePoint, 'id'>[]): Promise<boolean> {
    if (!this.db || routePoints.length === 0) {
      return false;
    }

    try {
      await this.db.execAsync('BEGIN TRANSACTION;');
      
      for (const point of routePoints) {
        await this.db.runAsync(
          `INSERT INTO route_points (walkId, latitude, longitude, timestamp, accuracy)
           VALUES (?, ?, ?, ?, ?)`,
          [
            point.walkId,
            point.latitude,
            point.longitude,
            point.timestamp,
            point.accuracy || null
          ]
        );
      }
      
      await this.db.execAsync('COMMIT;');
      console.log(`Saved ${routePoints.length} route points`);
      return true;
    } catch (error) {
      console.error('Failed to save route points:', error);
      await this.db.execAsync('ROLLBACK;');
      return false;
    }
  }

  async getRoutePoints(walkId: number): Promise<RoutePoint[]> {
    if (!this.db) {
      console.error('Database not initialized');
      return [];
    }

    try {
      const points = await this.db.getAllAsync<RoutePoint>(
        'SELECT * FROM route_points WHERE walkId = ? ORDER BY timestamp ASC',
        [walkId]
      );
      return points;
    } catch (error) {
      console.error('Failed to get route points:', error);
      return [];
    }
  }

  async getAllWalks(): Promise<Walk[]> {
    if (!this.db) {
      console.error('Database not initialized');
      return [];
    }

    try {
      const walks = await this.db.getAllAsync<Walk>(
        'SELECT * FROM walks ORDER BY createdAt DESC'
      );
      return walks;
    } catch (error) {
      console.error('Failed to get walks:', error);
      return [];
    }
  }

  async getWalkById(id: number): Promise<Walk | null> {
    if (!this.db) {
      console.error('Database not initialized');
      return null;
    }

    try {
      const walk = await this.db.getFirstAsync<Walk>(
        'SELECT * FROM walks WHERE id = ?',
        [id]
      );
      return walk || null;
    } catch (error) {
      console.error('Failed to get walk by id:', error);
      return null;
    }
  }

  async getRecentWalks(limit: number = 10): Promise<Walk[]> {
    if (!this.db) {
      console.error('Database not initialized');
      return [];
    }

    try {
      const walks = await this.db.getAllAsync<Walk>(
        'SELECT * FROM walks ORDER BY createdAt DESC LIMIT ?',
        [limit]
      );
      return walks;
    } catch (error) {
      console.error('Failed to get recent walks:', error);
      return [];
    }
  }

  async getWalkStats(): Promise<{
    totalWalks: number;
    totalDuration: number;
    totalDistance: number;
    averageDuration: number;
  }> {
    if (!this.db) {
      console.error('Database not initialized');
      return { totalWalks: 0, totalDuration: 0, totalDistance: 0, averageDuration: 0 };
    }

    try {
      const stats = await this.db.getFirstAsync<{
        totalWalks: number;
        totalDuration: number;
        totalDistance: number;
        averageDuration: number;
      }>(`
        SELECT 
          COUNT(*) as totalWalks,
          SUM(duration) as totalDuration,
          SUM(COALESCE(distance, 0)) as totalDistance,
          AVG(duration) as averageDuration
        FROM walks
      `);
      
      return stats || { totalWalks: 0, totalDuration: 0, totalDistance: 0, averageDuration: 0 };
    } catch (error) {
      console.error('Failed to get walk stats:', error);
      return { totalWalks: 0, totalDuration: 0, totalDistance: 0, averageDuration: 0 };
    }
  }

  async deleteWalk(id: number): Promise<boolean> {
    if (!this.db) {
      console.error('Database not initialized');
      return false;
    }

    try {
      // Delete route points first (due to foreign key constraint)
      await this.db.runAsync('DELETE FROM route_points WHERE walkId = ?', [id]);
      // Then delete the walk
      await this.db.runAsync('DELETE FROM walks WHERE id = ?', [id]);
      console.log('Walk and route points deleted successfully');
      return true;
    } catch (error) {
      console.error('Failed to delete walk:', error);
      return false;
    }
  }
}

export const databaseService = new DatabaseService(); 