import { signInWithGoogle } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

export function GoogleButton({ next }: { next?: string }) {
  return (
    <form action={signInWithGoogle}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Button type="submit" variant="outline" size="lg" className="w-full">
        Google orqali davom etish
      </Button>
    </form>
  );
}

export function OrDivider() {
  return (
    <div className="text-muted flex items-center gap-3 text-[13px]" aria-hidden>
      <span className="bg-border h-px flex-1" />
      yoki
      <span className="bg-border h-px flex-1" />
    </div>
  );
}
