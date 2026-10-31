import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

function validate(body: Record<string, unknown>) {
  const input = {
    name: text(body.name),
    email: text(body.email).toLowerCase(),
    password: typeof body.password === "string" ? body.password : "",
    phone: normalizePhone(text(body.phone)),
    house: text(body.house),
    street: text(body.street),
    city: text(body.city),
    state: text(body.state),
    pincode: text(body.pincode),
    landmark: text(body.landmark),
  };

  if (input.name.length < 2 || input.name.length > 80) return { error: "Enter your full name." };
  if (input.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) {
    return { error: "Enter a valid email address." };
  }
  if (input.password.length < 6) return { error: "Password must be at least 6 characters." };
  if (!input.phone) return { error: "Enter a valid 10-digit mobile number." };
  if (!input.house || input.house.length > 100) return { error: "Enter your house or flat number." };
  if (!input.street || input.street.length > 150) return { error: "Enter your street or area." };
  if (!input.city || input.city.length > 80) return { error: "Enter your city." };
  if (!input.state || input.state.length > 80) return { error: "Enter your state." };
  if (!/^\d{6}$/.test(input.pincode)) return { error: "Enter a valid 6-digit PIN code." };
  if (input.landmark.length > 150) return { error: "Landmark must be 150 characters or fewer." };

  return { input };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const result = validate(body ?? {});
    if ("error" in result) return json({ error: result.error }, 400);
    const { input } = result;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } }
    );

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { name: input.name, phone: input.phone },
    });
    if (createError || !created.user) {
      const alreadyExists = /already.*registered|already exists/i.test(createError?.message ?? "");
      if (alreadyExists) return json({ error: "An account with this email already exists." }, 409);
      console.error("createUser failed:", createError?.message);
      return json({ error: "We could not create your account. Please check your details and try again." }, 400);
    }

    const userId = created.user.id;
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: input.name, phone: input.phone })
        .eq("id", userId);
      if (profileError) throw profileError;

      const { error: addressError } = await supabase.from("addresses").insert({
        user_id: userId,
        house: input.house,
        street: input.street,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        landmark: input.landmark,
        is_default: true,
      });
      if (addressError) throw addressError;
    } catch (err) {
      console.error("registration cleanup:", err);
      await supabase.auth.admin.deleteUser(userId);
      return json({ error: "We could not finish creating your account. Please try again." }, 500);
    }

    return json({ userId }, 201);
  } catch (err) {
    console.error("register-customer error:", err);
    return json({ error: "Something went wrong. Please try again." }, 500);
  }
});
