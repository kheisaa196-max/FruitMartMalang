export type StatusMakan = "Pending" | "Proses" | "Selesai";

export interface Kelas {
  id: string;
  nama_kelas: string;
  total_siswa: number;
  created_at: string;
}

export interface LogMakan {
  id: string;
  kelas_id: string;
  tanggal: string;
  porsi_dipesan: number;
  porsi_diterima: number | null;
  status: StatusMakan;
  petugas_penerima: string | null;
  catatan: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  kelas?: Kelas;
}

export type Database = {
  public: {
    Tables: {
      kelas: {
        Row: Kelas;
        Insert: Omit<Kelas, "id" | "created_at">;
        Update: Partial<Omit<Kelas, "id" | "created_at">>;
      };
      log_makan: {
        Row: LogMakan;
        Insert: Omit<LogMakan, "id" | "created_at" | "updated_at" | "kelas">;
        Update: Partial<
          Omit<LogMakan, "id" | "created_at" | "updated_at" | "kelas">
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      status_makan: StatusMakan;
    };
  };
};
