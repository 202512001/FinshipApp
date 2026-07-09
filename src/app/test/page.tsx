import { supabase } from "@/lib/supabase";

export default async function TestPage() {
  const { data, error } = await supabase
    .from("areas")
    .select("*");

  return (
    <div style={{ padding: 20 }}>
      <h1>Supabase Test</h1>

      <pre>{JSON.stringify(data, null, 2)}</pre>

      <pre>{JSON.stringify(error, null, 2)}</pre>
    </div>
  );
}