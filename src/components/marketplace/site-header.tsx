import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, Menu, Search, ShoppingBag, User } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "Marketplace" },
  { to: "/categories", label: "Categories" },
  { to: "/sell", label: "Sell" },
] as const;

function SearchField({ id = "search", onSubmitted }: { id?: string; onSubmitted?: () => void }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  return (
    <form
      role="search"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ to: "/", search: { q: value || undefined } });
        onSubmitted?.();
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <label className="sr-only" htmlFor={id}>
        Search the marketplace
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products, brands, sellers"
        className="h-10 rounded-xl border-input bg-card pl-9"
      />
    </form>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6">
        <div className="flex min-w-0 items-center gap-6">
          <Link to="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-xl bg-primary text-primary-foreground">
              <ShoppingBag className="size-4" />
            </span>
            <span className="text-base font-bold tracking-tight text-foreground">Haggl</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden min-w-0 max-w-md justify-self-center md:flex md:w-full">
          <SearchField />
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="ghost" size="icon" aria-label="Notifications" className="relative">
            <Bell />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-brand" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Profile" className="hidden sm:inline-flex">
            <User />
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex">
            <Link to="/signup">Sign up</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu" className="lg:hidden">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[86vw] max-w-sm">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <SearchField id="search-mobile" onSubmitted={() => setOpen(false)} />
                <nav aria-label="Mobile" className="grid gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-3 py-3 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="grid gap-2">
                  <Button asChild>
                    <Link to="/signup" onClick={() => setOpen(false)}>
                      Create account
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/signin" onClick={() => setOpen(false)}>
                      Sign in
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="border-t border-border px-4 py-2 md:hidden">
        <SearchField id="search-inline" />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>© {new Date().getFullYear()} Haggl. Buy, sell and negotiate smarter.</p>
        <nav aria-label="Footer" className="flex flex-wrap gap-4">
          <Link to="/categories" className="hover:text-foreground">
            Categories
          </Link>
          <Link to="/sell" className="hover:text-foreground">
            Start selling
          </Link>
          <Link to="/signin" className="hover:text-foreground">
            Sign in
          </Link>
        </nav>
      </div>
    </footer>
  );
}