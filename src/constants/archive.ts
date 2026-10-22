export interface ArchiveItem {
  number: number;
  date: string;
  codename: string;
  isToday: boolean;
}

export const ARCHIVE_FILES: ArchiveItem[] = [
  { number: 2, date: '2026-10-02', codename: 'ACTIVE DAILY INTEL', isToday: true },
  { number: 1, date: '2026-10-01', codename: 'ARCHIVED CASE #001', isToday: false },
  { number: 3, date: '2026-10-03', codename: 'ARCHIVED CASE #003', isToday: false },
  { number: 4, date: '2026-10-04', codename: 'ARCHIVED CASE #004', isToday: false },
  { number: 5, date: '2026-10-05', codename: 'ARCHIVED CASE #005', isToday: false }
];
