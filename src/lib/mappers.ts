// lib/mappers.ts

export interface CommunityRecordUI {
  id: string;
  name: string;
  mobile: string;
  gender: "Male" | "Female";
  area: string;

  society: string;
  building: string;

  visitCount: number;
  lastVisitedDate?: string | null;

  latitude?: number | null;
  longitude?: number | null;

  extra: Record<string, any>;
}

export interface CommunityRecordDB {
  id: string;

  area_id: string;

  name: string;

  mobile: string;

  gender: "Male" | "Female";

  society: string;

  building: string;

  visit_count: number;

  last_visited_date: string | null;

  latitude: number | null;

  longitude: number | null;

  extra: Record<string, any>;
}

/*
Database

↓

UI
*/

export function dbToCommunityRecord(
  row: CommunityRecordDB,
  areaName: string
): CommunityRecordUI {

  return {

    id: row.id,

    name: row.name,

    mobile: row.mobile,

    gender: row.gender,

    area: areaName,

    society: row.society,

    building: row.building,

    visitCount: row.visit_count,

    lastVisitedDate: row.last_visited_date,

    latitude: row.latitude,

    longitude: row.longitude,

    extra: row.extra ?? {}

  };

}

/*
UI

↓

Database
*/

export function communityRecordToDB(
  record: CommunityRecordUI,
  areaId: string
): Partial<CommunityRecordDB> {

  return {

    area_id: areaId,

    name: record.name,

    mobile: record.mobile,

    gender: record.gender,

    society: record.society,

    building: record.building,

    visit_count: record.visitCount,

    last_visited_date: record.lastVisitedDate ?? null,

    latitude: record.latitude ?? null,

    longitude: record.longitude ?? null,

    extra: record.extra ?? {}

  };

}