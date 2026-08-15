import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Loader2, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/api/auth";

export const Route = createFileRoute("/signin")({
  head: () => ({
    meta: [
      { title: "Sign in to Haggl" },
      { name: "description", content: "Sign in to track offers, negotiations and orders on Haggl." },
      { property: "og:title", content: "Sign in to Haggl" },
      { property: "og:description", content: "Access your offers and negotiations." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [values, setValues] = useState({ email: "", password: "" });

  const mutation = useMutation({
    mutationFn: () => signIn(values),
    onSuccess: (session) => {
      toast.success(`Welcome back, ${session.user.name}`);
      navigate({ to: "/" });
    },
    onError: (error: Error) => toast.error("Could not sign in", { description: error.message }),
  });

  return (
    <main className="flex min-h-screen flex-col justify-center px-5 py-12">
      <div className="mx-auto w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
            <ShoppingBag className="size-4" />
          </span>
          <span className="text-base font-bold tracking-tight text-foreground">Haggl</span>
        </Link>
        <h1 className="mt-8 text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in to pick up your negotiations.</p>
        <form
          className="mt-8 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!values.email.trim() || values.password.length < 8) {
              toast.error("Enter your email and a password of at least 8 characters");
              return;
            }
            mutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="signin-email">Email address</Label>
            <Input
              id="signin-email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
              className="h-11 rounded-xl"
              placeholder="you@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="signin-password">Password</Label>
            <Input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={(e) => setValues((v) => ({ ...v, password: e.target.value }))}
              className="h-11 rounded-xl"
            />
          </div>
          <Button size="lg" className="w-full" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            {mutation.isPending ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          New to Haggl?{" "}
          <Link to="/signup" className="font-medium text-brand underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  );
}
