import { redirect } from "next/navigation";

export default function LegacyNationalOperationsRedirect() {
  redirect("/command-center");
}
