import { useId, useMemo, useState } from "react";

const roleLabels = { shield_break: "破盾", attack: "攻击", functional: "辅助" };

function searchName(name) {
  return name.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

function MatchedResult({ name, match, onShowCompanion }) {
  const { type, matchBefore, matchAfter } = match;
  let breakthrough = "";
  if (!matchBefore) breakthrough = "仅突破后";
  else if (!matchAfter) breakthrough = "仅突破前";
  const role = matchBefore && matchAfter && matchBefore !== matchAfter
    ? `突破前${roleLabels[matchBefore]}／突破后${roleLabels[matchAfter]}`
    : roleLabels[type];

  return (
    <>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <button type="button" className="min-h-8 text-left font-bold underline decoration-[#8b949e] underline-offset-4 hover:text-[#f1c40f] focus-visible:outline-[#f1c40f]"
          onClick={() => onShowCompanion(type, name)}>{name}</button>
        {breakthrough && <span className="text-xs text-[#a6afb9]" title="随行武将的突破要求">{breakthrough}</span>}
      </span>
      <span className="text-[#78dba5]">{role} · 可用随行</span>
    </>
  );
}

export default function CompanionLookup({ selectedName, groups, allNames, onShowCompanion }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const term = searchName(query);
  const companions = useMemo(() => {
    const matches = new Map();
    for (const [type, members] of Object.entries(groups)) {
      for (const { companion, matchBefore, matchAfter } of members) {
        matches.set(companion.name, { type, matchBefore, matchAfter });
      }
    }
    return matches;
  }, [groups]);
  const results = term
    ? allNames.filter(name => name !== selectedName && searchName(name).includes(term))
    : [];

  return (
    <section aria-label="武将配合查询" className="my-5 rounded-lg border border-[#30363d] bg-[#161b22] p-4 text-[#e6edf3]">
      <label htmlFor={inputId} className="mb-3 block text-sm font-bold">武将配合查询</label>
      <input id={inputId} type="search" autoComplete="off" value={query}
        placeholder={`输入其他武将名，与${selectedName}对照`}
        onChange={event => setQuery(event.target.value)}
        className="w-full rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-base focus:border-[#f1c40f] focus:outline-none"
      />
      {term && (
        <div className="mt-3">
          <p role="status" className={results.length ? "sr-only" : "text-sm text-[#a6afb9]"}>
            {results.length ? `找到 ${results.length} 名武将` : term === searchName(selectedName)
              ? `${selectedName}是当前操作武将，请输入其他武将名。`
              : "没有找到这个名字的武将。"}
          </p>
          {results.length > 0 && (
            <ul className="space-y-2">
              {results.map(name => {
                const match = companions.get(name);
                return (
                  <li key={name} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm leading-6">
                    {match
                      ? <MatchedResult name={name} match={match} onShowCompanion={onShowCompanion} />
                      : <><strong>{name}</strong><span className="text-[#a6afb9]">未列入可用随行</span></>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
