import { Card } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 pt-24">
      <div>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Sign in</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Enter the access key for the Ownership Resolution Workspace.
        </p>
      </div>
      <Card className="p-5">
        <LoginForm />
      </Card>
    </div>
  );
}
