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
              <VariableGroup title="Argumentos do comando" items={catalog.commandArgs ?? []} />
              <VariableGroup title="Contadores" items={catalog.counters} />
              <VariableGroup title="Timers" items={catalog.timers} />

              {(catalog.commandArgs?.length ?? 0) > 0 && (
                <div className="rounded-md border border-outline-variant/30 bg-primary-container/10 px-3 py-3 text-body-sm">
                  <p className="font-medium text-foreground">
                    Exemplo estilo StreamElements
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    Comando personalizado{" "}
                    <code className="text-xs">!hugs @joaomossi7</code> com mensagem{" "}
                    <code className="text-xs">
                      {"{displayName} meteu Hugs em {1}"}
                    </code>{" "}
                    →{" "}
                    <span className="text-foreground">
                      fantonlord meteu Hugs em @joaomossi7
                    </span>
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    <strong>{`{1}`}</strong> a <strong>{`{9}`}</strong> = cada
                    palavra após o comando. <strong>{`{sender}`}</strong> = quem
                    digitou (igual a {`{displayName}`}). No StreamElements use{" "}
                    <code>${"{sender}"}</code> e <code>${"{1}"}</code>; aqui use{" "}
                    chaves <code>{`{displayName}`}</code> e <code>{`{1}`}</code>.
                  </p>
                </div>
              )}

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
