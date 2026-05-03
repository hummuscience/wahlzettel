export interface ClosedListParty {
  listNumber: number;
  shortName: string;
  fullName: string;
  candidates: { position: number; lastName: string; firstName: string; profession: string }[];
}

export interface ClosedListData {
  election: string;
  name: string;
  date: string;
  parties: ClosedListParty[];
}
