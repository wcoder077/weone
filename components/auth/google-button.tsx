import { signInWithGoogle } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export async function GoogleButton({ next }: { next?: string }) {
  const t = await getT();
  return (
    <form action={signInWithGoogle}>
      {next ? <input type="hidden" name="next" value={next} /> : null}
      <Button type="submit" variant="outline" size="lg" className="w-full">
        {t("Google orqali davom etish")}</Button>
    </form>
  );
}

export async function OrDivider() {
  const t = await getT();
  return (
    <div className="text-muted flex items-center gap-3 text-[13px]" aria-hidden>
      <span className="bg-border h-px flex-1" />
      {t("yoki")}<span className="bg-border h-px flex-1" />
    </div>
  );
}
