import type { Metadata } from "next";
import { PelaporanView } from "./view";

export const metadata: Metadata = { title: "Pelaporan" };

export default function Page() {
  return <PelaporanView />;
}
