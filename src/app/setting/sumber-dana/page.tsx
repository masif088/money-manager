import type { Metadata } from "next";
import { SumberDanaView } from "./view";

export const metadata: Metadata = { title: "Sumber Dana" };

export default function Page() {
  return <SumberDanaView />;
}
