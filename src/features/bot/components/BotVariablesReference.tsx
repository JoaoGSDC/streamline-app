"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import type { BotVariablesCatalogResponse } from "@services/entities/bot-variables.services";
import { AUTOCOMPLETE_CATEGORY_LABELS } from "@features/bot/utils/bot-variables.utils";

interface BotVariablesReferenceProps {
  catalog: BotVariablesCatalogResponse | null;
  loading?: boolean;
  defaultExpanded?: boolean;
  layout?: "accordion" | "page";
}

function matchesSearch(
  item: {
    key: string;
    label: string;
    description: string;
    usage: string;
    example?: string;
  },
  query: string
) {
  if (!query) return true;
  const haystack = `${item.key} ${item.label} ${item.description} ${item.usage} ${item.example ?? ""}`.toLowerCase();
  return haystack.includes(query);
}

function VariableGroup({
  title,
  items,
  search,
}: {
  title: string;
  items: BotVariablesCatalogResponse["globals"];
  search: string;
}) {
  const filtered = items.filter((item) => matchesSearch(item, search));
  if (filtered.length === 0) return null;

  return (
    <section className="space-y-2">
      <h4 className="font-headline text-body-sm font-semibold text-foreground">
        {title}
      </h4>
      <ul className="space-y-2">
        {filtered.map((variable) => (
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
            {variable.example ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Resultado: {variable.example}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function VariablesBody({
  catalog,
  search,
}: {
  catalog: BotVariablesCatalogResponse;
  search: string;
}) {
  const expandedEntries = catalog.expandedGroups
    ? Object.entries(catalog.expandedGroups)
    : [];

  return (
    <div className="space-y-6">
      <p className="text-body-sm text-muted-foreground">
        Use chaves entre chaves na mensagem do comando ou timer. O bot substitui
        automaticamente no chat da Twitch.
      </p>

      <VariableGroup title="Globais" items={catalog.globals} search={search} />
      <VariableGroup
        title="Argumentos do comando"
        items={catalog.commandArgs ?? []}
        search={search}
      />
      {expandedEntries.map(([category, items]) => (
        <VariableGroup
          key={category}
          title={AUTOCOMPLETE_CATEGORY_LABELS[category] ?? catalog.categories[category] ?? category}
          items={items ?? []}
          search={search}
        />
      ))}
      <VariableGroup title="Contadores" items={catalog.counters} search={search} />
      <VariableGroup title="Timers" items={catalog.timers} search={search} />
      <VariableGroup
        title="Runtime (comandos padrão)"
        items={catalog.runtimeTemplateVariables ?? []}
        search={search}
      />

      {(catalog.commandArgs?.length ?? 0) > 0 ? (
        <div className="rounded-md border border-outline-variant/30 bg-primary-container/10 px-3 py-3 text-body-sm">
          <p className="font-medium text-foreground">Exemplo estilo StreamElements</p>
          <p className="mt-1 text-muted-foreground">
            Comando <code className="text-xs">!hugs @joaomossi7</code> com mensagem{" "}
            <code className="text-xs">{"{displayName} meteu Hugs em {1}"}</code> →{" "}
            <span className="text-foreground">fantonlord meteu Hugs em @joaomossi7</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function BotVariablesReference({
  catalog,
  loading = false,
  defaultExpanded = false,
  layout = "accordion",
}: BotVariablesReferenceProps) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLowerCase();

  const hasVisibleGroups = useMemo(() => {
    if (!catalog) return false;
    const all = [
      ...catalog.globals,
      ...(catalog.commandArgs ?? []),
      ...catalog.counters,
      ...catalog.timers,
      ...(catalog.runtimeTemplateVariables ?? []),
      ...(catalog.expandedGroups
        ? Object.values(catalog.expandedGroups).flat()
        : []),
    ];
    return all.some((item) => matchesSearch(item, normalizedSearch));
  }, [catalog, normalizedSearch]);

  if (layout === "page") {
    return (
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar variáveis..."
            className="pl-9"
          />
        </div>
        {loading ? (
          <p className="text-body-sm text-muted-foreground">Carregando…</p>
        ) : !catalog ? (
          <p className="text-body-sm text-muted-foreground">
            Não foi possível carregar o catálogo.
          </p>
        ) : !hasVisibleGroups ? (
          <p className="text-body-sm text-muted-foreground">
            Nenhuma variável encontrada para &quot;{search}&quot;.
          </p>
        ) : (
          <VariablesBody catalog={catalog} search={normalizedSearch} />
        )}
      </div>
    );
  }

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
          <div className="relative mb-4 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar variáveis..."
              className="pl-9"
            />
          </div>
          {loading ? (
            <p className="text-body-sm text-muted-foreground">Carregando…</p>
          ) : !catalog ? (
            <p className="text-body-sm text-muted-foreground">
              Não foi possível carregar o catálogo.
            </p>
          ) : !hasVisibleGroups ? (
            <p className="text-body-sm text-muted-foreground">
              Nenhuma variável encontrada.
            </p>
          ) : (
            <VariablesBody catalog={catalog} search={normalizedSearch} />
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
