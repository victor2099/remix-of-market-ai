import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Check, Eye, EyeOff, Loader2, ShieldCheck, ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import authVisual from "@/assets/auth-visual.jpg";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { registerAndLogin } from "@/lib/api/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create your Haggl account" },
      {
        name: "description",
        content:
          "Join Haggl to buy, sell and negotiate with verified sellers and an AI negotiation assistant.",
      },
      { property: "og:title", content: "Create your Haggl account" },
      {
        property: "og:description",
        content: "Sign up in under a minute and start negotiating better prices.",
      },
    ],
  }),
  component: SignUpPage,
});

type Field = "fullName" | "email" | "password" | "confirm" | "terms";

function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const strengthMeta = [
  { label: "Too weak", tone: "bg-destructive", text: "text-destructive" },
  { label: "Weak", tone: "bg-destructive", text: "text-destructive" },
  { label: "Fair", tone: "bg-warning", text: "text-warning-foreground" },
  { label: "Good", tone: "bg-brand", text: "text-brand" },
  { label: "Strong", tone: "bg-success", text: "text-success" },
] as const;

function SignUpPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ fullName: "", email: "", password: "", confirm: "" });
  const [role, setRole] = useState<"buyer" | "seller">("buyer");
  const [terms, setTerms] = useState(false);
  const [touched, setTouched] = useState<Record<Field, boolean>>({
    fullName: false,
    email: false,
    password: false,
    confirm: false,
    terms: false,
  });
  const [showPassword, setShowPassword] = useState(false);

  const strength = useMemo(() => scorePassword(values.password), [values.password]);
  const strengthInfo = strengthMeta[strength] ?? strengthMeta[0];

  const errors: Partial<Record<Field, string>> = {};
  if (!values.fullName.trim()) errors.fullName = "Enter your full name";
  if (!values.email.trim()) errors.email = "Enter your email address";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email))
    errors.email = "Enter a valid email address";
  if (!values.password) errors.password = "Choose a password";
  else if (values.password.length < 8) errors.password = "Use at least 8 characters";
  else if (values.password.length > 72) errors.password = "Use 72 characters or fewer";
  else if (strength < 2) errors.password = "Password is too weak — add length, numbers or symbols";
  if (!values.confirm) errors.confirm = "Confirm your password";
  else if (values.confirm !== values.password) errors.confirm = "Passwords do not match";
  if (!terms) errors.terms = "Accept the terms to continue";

  const mutation = useMutation({
    mutationFn: () => {
      const parts = values.fullName.trim().split(/\s+/);
      return registerAndLogin({
        email: values.email,
        password: values.password,
        first_name: parts[0] ?? values.fullName.trim(),
        last_name: parts.slice(1).join(" ") || parts[0] || "",
        role,
      });
    },
    onSuccess: (user) => {
      toast.success("Account created", {
        description:
          role === "seller"
            ? `Welcome, ${user.first_name} — set up your store to start selling.`
            : `Welcome to Haggl, ${user.first_name} — happy negotiating.`,
      });
      navigate({ to: role === "seller" ? "/seller" : "/buyer" });
    },
    onError: (error: Error) =>
      toast.error("Could not create account", { description: error.message }),
  });

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  const blur = (key: Field) => () => setTouched((t) => ({ ...t, [key]: true }));
  const showError = (key: Field) => (touched[key] ? errors[key] : undefined);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-primary lg:block">
        <img
          src={authVisual}
          alt="A curated flat-lay of products available on the marketplace"
          width={1024}
          height={1440}
          className="absolute inset-0 size-full object-cover opacity-90"
        />
        <div className="relative flex h-full flex-col justify-between p-10 text-primary-foreground">
          <Link to="/" className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-background/15">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-base font-bold tracking-tight">Haggl</span>
          </Link>
          <div className="max-w-sm rounded-2xl bg-primary/70 p-6 backdrop-blur">
            <p className="text-xl font-semibold leading-snug">
              “I saved ₦100,000 on my last purchase just by asking — the assistant told me exactly
              what to offer.”
            </p>
            <p className="mt-4 text-sm opacity-80">Adaeze O. · Verified buyer</p>
          </div>
        </div>
      </aside>

      <main className="flex flex-col justify-center px-5 py-10 sm:px-10 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-base font-bold tracking-tight text-foreground">Haggl</span>
          </Link>

          <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:mt-0">
            Create your account
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Join the marketplace and start buying, selling, and negotiating smarter.
          </p>

          <form
            noValidate
            className="mt-8 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setTouched({
                fullName: true,
                email: true,
                password: true,
                confirm: true,
                terms: true,
              });
              if (Object.keys(errors).length > 0) return;
              mutation.mutate();
            }}
          >
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-foreground">I want to join as</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    {
                      value: "buyer",
                      title: "Buyer",
                      blurb: "Shop listings and haggle prices down with a buyer agent.",
                    },
                    {
                      value: "seller",
                      title: "Seller",
                      blurb: "List products, manage inventory and let an agent negotiate for you.",
                    },
                  ] as const
                ).map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "cursor-pointer rounded-xl border p-4 transition-colors",
                      role === option.value
                        ? "border-brand bg-brand/5 ring-1 ring-brand"
                        : "border-border hover:bg-accent/50",
                    )}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={role === option.value}
                      onChange={() => setRole(option.value)}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between text-sm font-semibold text-foreground">
                      {option.title}
                      {role === option.value ? <Check className="size-4 text-brand" /> : null}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                      {option.blurb}
                    </span>
                  </label>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {role === "seller"
                  ? "You'll be taken to your seller workspace to create your store profile."
                  : "You can create a seller account later from the Sell page."}
              </p>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>

              <Input
                id="fullName"
                autoComplete="name"
                value={values.fullName}
                onChange={set("fullName")}
                onBlur={blur("fullName")}
                aria-invalid={Boolean(showError("fullName"))}
                aria-describedby={showError("fullName") ? "fullName-error" : undefined}
                className="h-11 rounded-xl"
                placeholder="Ada Obi"
              />
              {showError("fullName") ? (
                <p id="fullName-error" className="text-xs text-destructive">
                  {showError("fullName")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={values.email}
                onChange={set("email")}
                onBlur={blur("email")}
                aria-invalid={Boolean(showError("email"))}
                aria-describedby={showError("email") ? "email-error" : undefined}
                className="h-11 rounded-xl"
                placeholder="you@example.com"
              />
              {showError("email") ? (
                <p id="email-error" className="text-xs text-destructive">
                  {showError("email")}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={values.password}
                  onChange={set("password")}
                  onBlur={blur("password")}
                  aria-invalid={Boolean(showError("password"))}
                  aria-describedby="password-strength"
                  className="h-11 rounded-xl pr-11"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-1 top-1 grid size-9 cursor-pointer place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              <div id="password-strength" className="space-y-1.5">
                <div className="flex gap-1.5" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors duration-200",
                        i < strength ? strengthInfo.tone : "bg-border",
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Password strength:{" "}
                  <span className={cn("font-medium", strengthInfo.text)}>{strengthInfo.label}</span>
                </p>
                {showError("password") ? (
                  <p className="text-xs text-destructive">{showError("password")}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={values.confirm}
                onChange={set("confirm")}
                onBlur={blur("confirm")}
                aria-invalid={Boolean(showError("confirm"))}
                aria-describedby={showError("confirm") ? "confirm-error" : undefined}
                className="h-11 rounded-xl"
                placeholder="Re-enter your password"
              />
              {showError("confirm") ? (
                <p id="confirm-error" className="text-xs text-destructive">
                  {showError("confirm")}
                </p>
              ) : values.confirm && values.confirm === values.password ? (
                <p className="flex items-center gap-1 text-xs text-success">
                  <Check className="size-3" /> Passwords match
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  checked={terms}
                  onCheckedChange={(c) => {
                    setTerms(c === true);
                    setTouched((t) => ({ ...t, terms: true }));
                  }}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-normal leading-relaxed text-muted-foreground"
                >
                  I agree to the{" "}
                  <span className="font-medium text-brand underline-offset-4 hover:underline">
                    Terms of Service
                  </span>{" "}
                  and{" "}
                  <span className="font-medium text-brand underline-offset-4 hover:underline">
                    Privacy Policy
                  </span>
                  .
                </Label>
              </div>
              {showError("terms") ? (
                <p className="text-xs text-destructive">{showError("terms")}</p>
              ) : null}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="animate-spin" /> Creating account…
                </>
              ) : (
                "Create account"
              )}
            </Button>

            <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-success" /> Escrow-protected payments on every
              order
            </p>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="font-medium text-brand underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
