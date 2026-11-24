import summonSkills from '../data/summonSkillMap.json'

// The source data uses both 火/炎 and 电/雷, as well as spaces inside some words.
const elements = { 炎: '火炎', 雷: '触电', 冰: '结冰', 风: '强风', 斩: '裂伤' }
const canon = tag => ({ 火: '炎', 电: '雷' }[tag] || tag)
const clean = text => (text || '').normalize('NFKC').replace(/[“”]/g, '"').replace(/\s/g, '')

// These link a specific mechanic on the main hero to a companion effect which supplies it.
// Generic attack/defence bonuses provide no evidence of a particular pairing.
const interactions = [
  [/若将敌[方人]一击必杀|一击必杀的概率/, /以斩属性攻击对敌方一击必杀/],
  [/一齐召唤期间|每次发动一齐召唤|一齐召唤的持续时间/, /一齐召唤计量条.{0,8}(?:增加|获得量\+|\+)/],
  [/一齐召唤计量条.{0,12}(?:增加|获得量|获取量|\+)/, /一齐召唤期间|每次发动一齐召唤|发动一齐召唤时/],
  [/无双计量条.{0,12}(?:增加|获得量|获取量|\+)/, /(?:发动|若以)?无双乱舞\/无双奥义/],
  [/消耗无双计量条|以无双乱舞\/无双奥义/, /无双计量条.{0,14}(?:获得量|增加|\+)/],
  [/在危险地带中|每次突破危险地带/, /更容易出现危险地带/],
  [/更容易出现危险地带/, /在危险地带中|每次突破危险地带|于危险地带开始/],
  [/若获得桃子|获得桃子时|桃子的体力恢复量/, /(?:将|会)获得桃子|掉落桃子/],
  [/每次复活/, /可复活/],
  [/可复活/, /每次复活/],
  [/每持有\d+个(?:亡者的)?红泪|每次消耗红泪|获得红泪时|若获得红泪/, /(?:将|会)获得红泪|掉落红泪|红泪(?:的)?获得量\+|红泪\+\d/],
  [/红泪(?:的)?获得量\+|红泪\+\d|掉落红泪/, /每持有\d+个(?:亡者的)?红泪|每次消耗红泪|若获得红泪/],
  [/敏捷度的\d+%计入/, /敏捷度.{0,8}\+/],
  [/每当连续\d+次命中/, /攻击速度\+/],
  [/体力不低于\d+%/, /体力恢复\d+%|恢复体力\d+%/],
]

function mainProfile(main, weapon) {
  const tags = new Set((main.allTags || []).map(canon))
  const text = [main.basicTraits, weapon].map(clean).join('。')
  // Only use unrestricted inherent effects as evidence about the main hero.
  // Another hero's summons/targeted buffs are not the main hero's own actions.
  const inherent = clean(main.inherentSkill?.effect)
  const combat = /若召唤此英豪|召唤技|的英豪/.test(inherent) ? text : text + '。' + inherent
  const marks = new Set(Array.from(text.matchAll(/"([^"]+)"(?:印记)?(?:的)?(?:持有数(?:量)?|持数|获得量)\+/g), m => canon(m[1])))
  const scalingMarks = new Set(Array.from(combat.matchAll(/每持有(?:一|1)个(?:印记)?"([^"]+)"/g), m => canon(m[1])))
  const requiredMarks = new Set(Object.keys(main.inherentSkill?.condition?.tags || {}).map(canon))
  return { tags, marks, scalingMarks, requiredMarks, combat, summon: summonSkills[main.name] }
}

function traitStrength(trait, profile) {
  const effect = clean(trait.effect)
  const { tags, marks, scalingMarks, requiredMarks, combat, summon } = profile
  const namedSummon = effect.match(/召唤技"+([^"]+)"/)?.[1]
  if (namedSummon && namedSummon !== summon) return 0
  let strength = 0
  const consider = weight => { strength = Math.max(strength, weight) }

  // An imprint named as a trigger/scale is different from an imprint mentioned
  // only as a required unlock cost.
  const scaling = effect.match(/每持有(?:一|1)个(?:印记)?"([^"]+?)(?:"|印记)/)
  const mark = scaling && canon(scaling[1])
  // 智/力/技/坚/速/魅 are ability imprints; only 炎/雷/冰/风/斩 are elemental.
  const mainRaisesElements = /所有属性类印记的持有数量\+/.test(combat)
  const mainRaisesMark = marks.has(mark) || (mainRaisesElements && Object.hasOwn(elements, mark))
  if (mark && !tags.has(mark) && !mainRaisesMark && !requiredMarks.has(mark) && !scalingMarks.has(mark)) return 0

  let relevantElement = false
  let hasElementGate = false
  const statusChance = effect.includes('异常状态附加概率')
  for (const [element, status] of Object.entries(elements)) {
    const usesStatus = combat.includes(status)
    const elementalAttack = combat.includes(element + '属性')
    const mentioned = effect.includes(status) || effect.includes(element + '属性')
    if (mentioned) hasElementGate = true
    if (!tags.has(element) && !usesStatus && !elementalAttack) continue
    relevantElement = true
    if (mentioned) consider(usesStatus ? 4 : 3)
    if (statusChance) consider(usesStatus ? 4 : 2)
  }
  // A scaling mark alone does not make an off-element attack buff useful.
  if (hasElementGate && !strength) return 0
  if (effect.includes('陷入异常状态的敌方') && relevantElement)
    consider(2)
  if (mark) {
    if (mainRaisesMark) consider(4)
    else if (requiredMarks.has(mark) || scalingMarks.has(mark)) consider(2)
    else consider(1)
  }
  const generated = effect.match(/"([^"]+)"(?:印记)?(?:的)?(?:持有数(?:量)?|获得量)\+/)
  if (generated) {
    const tag = canon(generated[1])
    if (requiredMarks.has(tag) || scalingMarks.has(tag)) consider(4)
    else if (tags.has(tag) || marks.has(tag)) consider(2)
  }
  if (/所有(?:属性类)?印记的持有数量\+/.test(effect)) {
    const elementalOnly = effect.includes('属性类')
    const supported = [...scalingMarks, ...requiredMarks].some(tag => !elementalOnly || Object.hasOwn(elements, tag))
    if (supported) consider(3)
  }
  if (/每持有(?:一|1)个属性类印记/.test(effect)
      && (mainRaisesElements || [...marks].some(tag => Object.hasOwn(elements, tag))))
    consider(4)
  if (summon && effect.includes(`"${summon}"`))
    consider(4)

  const relic = effect.match(/更容易出现遗宝(.+)$/)
  if (relic && combat.replaceAll('赤免马', '赤兔马').includes(`遗宝"${relic[1].replaceAll('赤免马', '赤兔马')}"`))
    consider(4)
  for (const [mainPattern, partnerPattern] of interactions) {
    if (mainPattern.test(combat) && partnerPattern.test(effect)) consider(3)
  }
  return strength
}

export function recommendTravelPartners(main, breakthrough, generals, weapon = '') {
  if (!main) return []
  const profile = mainProfile(main, weapon)
  const ranked = []
  for (const partner of generals) {
    if (partner.name === main.name || partner.breakthrough !== breakthrough) continue
    const matches = []
    let strongest = 0
    let total = 0
    for (const [traitIndex, trait] of (partner.companionTraits || []).entries()) {
      const strength = traitStrength(trait, profile)
      if (!strength) continue
      total += strength
      strongest = Math.max(strongest, strength)
      matches.push({ traitIndex, effect: trait.effect })
    }
    if (matches.length) ranked.push({
      name: partner.name, breakthrough, matches, strongest, total,
    })
  }
  // Count each trait once using its strongest link; reward several compatible
  // traits. These are matching tiers, not damage estimates.
  return ranked.sort((a, b) => b.total - a.total || b.strongest - a.strongest)
}
