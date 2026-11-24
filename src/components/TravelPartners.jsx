import { useState } from "react";
import "./TravelPartners.css";

const stages = ["突破前", "突破后"];
const previewCount = 4;

function PartnerList({ partners }) {
  const [expanded, setExpanded] = useState(false);
  if (!partners.length) {
    return <p className="travel-empty">当前主将和同行突破状态下，未找到明确配合的特性。</p>;
  }
  const visible = expanded ? partners : partners.slice(0, previewCount);
  return (
    <>
      <div className="travel-cards">
        {visible.map(partner => (
          <details key={partner.name}>
            <summary>
              <strong>{partner.name}</strong>
              <span>{partner.matches.length} 项特性匹配</span>
            </summary>
            <ul>
              {partner.matches.map(({ traitIndex, effect }) => (
                <li className="travel-effect" key={traitIndex}><span>特性 {traitIndex + 1}</span>{effect}</li>
              ))}
            </ul>
          </details>
        ))}
      </div>
      {partners.length > previewCount && (
        <button type="button" className="travel-more" aria-expanded={expanded} onClick={() => setExpanded(!expanded)}>
          {expanded ? "收起名单" : `查看全部 ${partners.length} 名同行武将`}
        </button>
      )}
    </>
  );
}

export default function TravelPartners({ mainGeneral, byStage }) {
  const [stage, setStage] = useState("突破前");
  return (
    <section className="travel-panel" aria-labelledby="travel-heading">
      <h2 id="travel-heading">同行武将推荐</h2>
      <div className="travel-stages" role="group" aria-label="同行突破状态">
        {stages.map(item => (
          <button type="button" key={item} aria-pressed={stage === item} onClick={() => setStage(item)}>同行{item}</button>
        ))}
      </div>
      <PartnerList key={`${mainGeneral.name}|${mainGeneral.breakthrough}|${stage}`} partners={byStage[stage]} />
    </section>
  );
}
