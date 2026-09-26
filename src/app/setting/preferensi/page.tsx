import type { Metadata } from "next";
import { PreferensiView } from "./view";

export const metadata: Metadata = { title: "Preferensi" };

export default function Page() {
  return <PreferensiView />;
}
