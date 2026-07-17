import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "./Reveal";

/** Koyu randevu bandı (her sayfa sonunda). */
export function DarkCTA({
  title,
  text,
  buttonLabel,
}: {
  title: string;
  text: string;
  buttonLabel: string;
}) {
  return (
    <Reveal as="section" className="mt-[120px] bg-ink-deep">
      <Container className="flex flex-wrap items-center justify-between gap-10 py-[88px]">
        <div>
          <h2 className="m-0 font-serif text-[44px] font-medium leading-tight text-balance text-cream">
            {title}
          </h2>
          <p className="mt-3.5 max-w-[520px] text-base leading-relaxed text-on-dark-muted">
            {text}
          </p>
        </div>
        <Button variant="light" size="lg" className="flex-none">
          {buttonLabel}
        </Button>
      </Container>
    </Reveal>
  );
}
