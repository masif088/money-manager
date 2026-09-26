import type { Metadata } from "next";
import { PencatatanView } from "./view";

export const metadata: Metadata = { title: "Pencatatan" };

export default function Page() {
  return <PencatatanView />;
}
