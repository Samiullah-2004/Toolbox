"use client"

import { LogIn } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

// Real Google and GitHub sign-in (NextAuth) arrives in Week 5.
export function SignInButton({ className }: { className?: string }) {
  return (
    <Button
      variant="outline"
      className={className}
      onClick={() =>
        toast("Sign-in is coming soon", {
          description:
            "You don't need an account to use Toolbox. Signing in will add your history and higher daily limits.",
        })
      }
    >
      <LogIn />
      Sign in
    </Button>
  )
}
