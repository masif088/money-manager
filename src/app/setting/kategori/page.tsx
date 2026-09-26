import type { Metadata } from "next";
import { KategoriView } from "./view";

export const metadata: Metadata = { title: "Kategori" };

export default function Page() {
  return <KategoriView />;
}
