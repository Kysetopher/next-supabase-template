import { Loading } from "@/components/ui/loading";

/** Inside the protected layout, so the sidebar stays put while a page loads. */
export default function ProtectedLoading() {
  return <Loading containerClassName="min-h-0 flex-1" />;
}
