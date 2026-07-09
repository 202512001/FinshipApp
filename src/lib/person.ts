export interface Person {
  id: string;

  name: string;
  mobile: string;

  gender: "Male" | "Female";

  areaId: string;
  areaName: string;

  society: string;
  building: string;

  visitCount: number;
  lastVisitedDate: string | null;

  notes?: string;
}