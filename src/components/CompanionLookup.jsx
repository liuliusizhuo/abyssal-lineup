import { useId, useMemo, useState } from "react";

function searchName(name) {
  return name.normalize("NFKC").replace(/\s+/g, "").toLowerCase();
}

export default function CompanionLookup({ selectedName, groups, allNames }) {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const term = searchName(query);
  const companions = useMemo(
    () => new Set(Object.values(groups).flat().map(({ companion }) => companion.name)),
    [groups],
  );
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
                const available = companions.has(name);
                return (
                  <li key={name} className="flex items-baseline justify-between gap-3 rounded-md border border-[#30363d] bg-[#0d1117] px-3 py-2 text-sm leading-6">
                    <strong>{name}</strong>
                    <span className={available ? "text-[#78dba5]" : "text-[#a6afb9]"}>
                      {available ? "可用随行" : "未列入可用随行"}
                    </span>
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
