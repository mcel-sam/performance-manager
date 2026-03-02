"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Toast } from "@/components/ui/toast";

interface DemoAccountHint {
  role: string;
  label: string;
  email: string;
  password: string;
}

interface DemoLoginFormProps {
  accounts: DemoAccountHint[];
}

export default function DemoLoginForm({ accounts }: DemoLoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(accounts[0]?.email ?? "");
  const [password, setPassword] = useState(accounts[0]?.password ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/demo/login", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.message ?? "Unable to sign in");
      }

      setMessage("Signed in. Redirecting...");
      router.push("/");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to sign in");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Demo Sign In</CardTitle>
        <CardDescription>
          Use one of the demo accounts below to switch roles during product walkthroughs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          <Button type="submit" disabled={isSubmitting} data-testid="demo-login-submit">
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <section className="space-y-3">
          <p className="text-sm font-semibold text-slate-800">Demo credentials</p>
          <div className="space-y-2">
            {accounts.map((account) => (
              <button
                key={account.email}
                type="button"
                className="w-full rounded-[var(--radius-md)] border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                onClick={() => {
                  setEmail(account.email);
                  setPassword(account.password);
                  setMessage(null);
                }}
                data-testid={`demo-account-${account.role.toLowerCase()}`}
              >
                <p className="font-semibold text-slate-900">{account.label}</p>
                <p className="text-xs">{account.email}</p>
                <p className="text-xs">Password: {account.password}</p>
              </button>
            ))}
          </div>
        </section>

        {message ? <Toast variant={message.includes("Unable") ? "error" : "info"}>{message}</Toast> : null}
      </CardContent>
    </Card>
  );
}
