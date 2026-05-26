"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { BotVariablesCatalogResponse } from "@services/entities/bot-variables.services";

interface BotVariablesReferenceProps {
  catalog: BotVariablesCatalogResponse | null;
  loading?: boolean;
  defaultExpanded?: boolean;
}

function VariableGroup({
  title,
  items,
}: {
  title: string;
  items: BotVariablesCatalogResponse["globals"];
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      <h4 className="font-headline text-body-sm font-semibold text-foreground">
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((variable) => (
          <li
            key={variable.key}
            className="rounded-md border border-outline-variant/25 bg-surface-container-low/30 px-3 py-2"
          >
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-muted px-1.5 py-0.5 text-body-sm font-medium text-primary">
                {variable.key}
              </code>
              <span className="text-body-sm font-medium">{variable.label}</span>
            </div>
            <p className="mt-1 text-body-sm text-muted-foreground">
              {variable.description}
            </p>
            <p className="mt-1 text-body-sm">
              <span className="text-muted-foreground">Exemplo: </span>
              <code className="text-foreground">{variable.usage}</code>
            </p>
            {variable.example && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Resultado: {variable.example}
              </p>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BotVariablesReference({
  catalog,
  loading = false,
  defaultExpanded = false,
}: BotVariablesReferenceProps) {
  return (
    <Accordion
      type="single"
      collapsible
      defaultValue={defaultExpanded ? "variables" : undefined}
      className="rounded-lg border border-outline-variant/30"
    >
      <AccordionItem value="variables" className="border-0">
        <AccordionTrigger className="px-4 hover:no-underline">
          <span className="font-headline text-body-md font-semibold">
            Variáveis disponíveis na aplicação
          </span>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          {loading ? (
            <p className="text-body-sm text-muted-foreground">Carregando…</p>
          ) : !catalog ? (
            <p className="text-body-sm text-muted-foreground">
              Não foi possível carregar o catálogo.
            </p>
          ) : (
            <div className="space-y-6">
              <p className="text-body-sm text-muted-foreground">
                Use chaves entre chaves na mensagem do comando ou timer. O bot
                substitui automaticamente no chat da Twitch.
              </p>

              <VariableGroup title="Globais" items={catalog.globals} />
              <VariableGroup title="Contadores" items={catalog.counters} />
              <VariableGroup title="Timers" items={catalog.timers} />

              {catalog.globals.some((v) => v.key === "{user}") && (
                <div className="rounded-md bg-primary-container/15 px-3 py-2 text-body-sm">
                  <strong>{`{user}`}</strong> e <strong>{`{displayName}`}</strong>{" "}
                  referem-se a quem digitou o comando.{" "}
                  <strong>{`{channel}`}</strong>, <strong>{`{streamer}`}</strong> e{" "}
                  <strong>{`{streamerName}`}</strong> referem-se ao seu canal.
                </div>
              )}
            </div>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
