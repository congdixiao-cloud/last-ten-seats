"use client";

import { useEffect, useMemo, useState } from "react";
import { personnelProfiles, type PersonnelQuality } from "./personnel-data";
import { relationshipProfiles, type RelationshipProfile, type RelationshipRole } from "./relationship-data";

type Tab = "房车" | "队伍" | "仓库" | "电脑" | "黑市" | "招聘" | "伴侣" | "物资图鉴" | "人员图鉴";
type GameMode = "base" | "prep" | "explore" | "result";
type Quality = PersonnelQuality;
type GearSlot = "武器" | "防具" | "头盔" | "背包" | "特殊";
type KitSlot = "weapon" | "backpack" | "armor" | "helmet" | "tactical";
type LootType = "食物" | "药品" | "弹药" | "零件" | "装备" | "奢侈品" | "电脑" | "钥匙" | "功能" | "专属";
type StoreKind = "装备柜" | "冰箱" | "存储柜";
type HardwareKind = "CPU" | "GPU" | "内存";
type ExitId = "原路撤离" | "维修通道" | "封锁线车库" | "紧急撤离";
type Injury = { severity: string; treatment: number; required: number };

type Crew = { id: number; name: string; role: string; subRole: string; score: number; attack: number; defense: number; quality: Quality; stamina: number; health: string; trait: string; flaw: string; potential: number; story: string; gear: Record<GearSlot, string>; presentation?: "allure"; injury?: Injury };
type Relationship = RelationshipProfile & { id: number };
type ExclusiveEffect = "combat" | "risk" | "fatal" | "recovery";
type Loot = { id: number; name: string; type: LootType; size: number; grade: number; value: number; story?: string; exclusiveFor?: string; bonus?: string; effect?: ExclusiveEffect; effectValue?: number };
type Place = { id: number; name: string; risk: string; hint: string; accent: string; level: number };
type FieldLoot = Loot & { w: number; h: number; x: number; y: number; searchSeconds: number; revealed: boolean; moved: boolean };
type PackedLoot = FieldLoot & { px: number; py: number };
type LootTemplate = Omit<FieldLoot, "id" | "x" | "y" | "revealed" | "moved">;
type Kit = Record<KitSlot, string>;
type GearOption = { name: string; note: string; stat: number; grade: number; cols?: number; rows?: number };
type AiSquad = { zone: number; searched: number; value: number; status: "搜索中" | "撤离中" | "已撤离" | "被击退"; signal: string };
type CombatUnit = { id: number; name: string; role: string; attack: number; defense: number; maxHp: number; hp: number };
type ContractMetric = "searched" | "extractions" | "squads" | "coreSearches" | "recoverFood" | "recoverEquipment" | "rareRecovered" | "repairs" | "suppliesUsed" | "recruits" | "submitted";
type ContractReward = { kind: "currency" | "coins" | "item" | "equipment" | "supplies"; label: string; amount?: number; itemName?: string };
type ContractDefinition = { id: string; category: string; title: string; description: string; metric: ContractMetric; target: number; icon: string; rewards: ContractReward[]; submitItemName?: string; mystery?: boolean };
type MaterialRequest = { name: string; quantity: number; grade: number };
type ReplacementSource = "recruit" | "ending";
type RelationshipArtMode = "regular" | "allure";

type GameSave = {
  version: 1 | 2 | 3;
  savedAt: number;
  state: {
    tab: Tab; mode: GameMode; day: number; crew: Crew[]; selectedCrew: number; expedition: number[]; seatAssignments: (number | null)[];
    satiety: number; teamHealth: number; resources: { 弹药: number; 零件: number; 货币: number };
    repair: { 发动机: number; 传动系统: number; 密封系统: number; 导航系统: number; 冷却系统: number };
    upgrades: { 床位: number; 仓库: number; 医疗站: number; 工作台: number; 侦察台: number; 武器站: number };
    kit: Kit; ownedEquipment: string[]; plannedPlaceId?: number; activePlace: Place | null; raidSeed: number; zone: number; roomIndex?: number; safeRemaining?: number; overtime?: number; escapeProtection?: number; fieldLoot: FieldLoot[]; risk: number;
    logs: string[]; searchedCount: number; searchSeconds: number; packedBag: PackedLoot[]; safeLoot: PackedLoot[]; ai: AiSquad;
    selectedExit: ExitId; roundOutcome: string[]; survivorCandidates: Crew[]; raidParty?: CombatUnit[]; enemyParty?: CombatUnit[]; enemyLoot?: PackedLoot[]; enemyDefeated?: boolean; enemyWave?: number; battleLogs?: string[]; locationEscapes?: Record<number, number>; relationshipRoster: Relationship[];
    relationshipCandidate: Relationship | null; relationshipAssignments: (number | null)[]; companionUnlocked: boolean; relationshipContacts: number;
    exclusiveLoadout: Record<number, PackedLoot>; equipmentStash: PackedLoot[]; survivalStash: PackedLoot[]; objectStash: PackedLoot[];
    installed: Record<HardwareKind, PackedLoot[]>; miningProgress: number; coins: number; marketOffers: FieldLoot[]; seenItems: string[]; collectedItems: string[];
    contractMainIndex?: number; mysteryContractId?: string | null; contractProgress?: number; contractCompletionNote?: string;
    companionTradeRequirements?: MaterialRequest[]; companionTradeCycle?: number; companionTradeNextRefreshDay?: number;
    endingUnlocked?: boolean; endingLegendaryCandidates?: Crew[]; endingCompanionCandidates?: Relationship[]; endingLegendaryClaimed?: boolean; endingCompanionClaimed?: boolean;
  };
};

const LOCAL_SAVE_KEY = "last-ten-seats-local-save-v1";
const CASH_RESCUE_PRICE = 10000;

const initialCrew: Crew[] = [
  { id: 1, name: "林默", role: "侦察员", subRole: "军需官", score: 71, attack: 10, defense: 16, quality: "熟练", stamina: 100, health: "健康", trait: "路径预判：区域推进风险 -4", flaw: "正面交战 -8%", potential: 86, story: personnelProfiles.find(person => person.name === "林默")!.story, gear: { 武器: "旧式弩", 防具: "轻便夹克", 头盔: "无", 背包: "登山包", 特殊: "望远镜" } },
  { id: 2, name: "陈锋", role: "突击手", subRole: "指挥官", score: 68, attack: 15, defense: 8, quality: "普通", stamina: 100, health: "健康", trait: "火力压制：遭遇战成功率提升", flaw: "搜索速度 -10%", potential: 82, story: personnelProfiles.find(person => person.name === "陈锋")!.story, gear: { 武器: "磨损步枪", 防具: "旧防弹衣", 头盔: "工地头盔", 背包: "帆布包", 特殊: "无" } },
  { id: 3, name: "苏桐", role: "医疗员", subRole: "厨师", score: 66, attack: 10, defense: 18, quality: "普通", stamina: 100, health: "健康", trait: "战地处理：每回合恢复小队健康", flaw: "携带空间 -2", potential: 79, story: personnelProfiles.find(person => person.name === "苏桐")!.story, gear: { 武器: "信号枪", 防具: "医用外套", 头盔: "无", 背包: "医疗包", 特殊: "止血钳" } },
];

const reserveCrew: Crew[] = [
  { id: 40, name: "韩拓", role: "机械师", subRole: "黑市联络员", score: 77, attack: 54, defense: 68, quality: "精英", stamina: 82, health: "轻伤", trait: "维修诊断：提前标记房车所需物资", flaw: "每日额外消耗饱食度", potential: 84, story: personnelProfiles.find(person => person.name === "韩拓")!.story, gear: { 武器: "钉枪", 防具: "维修服", 头盔: "焊工面罩", 背包: "工具袋", 特殊: "万能扳手" } },
  { id: 50, name: "闻岚", role: "狙击手", subRole: "搜救队长", score: 82, attack: 101, defense: 45, quality: "名家", stamina: 75, health: "健康", trait: "静默警戒：更早发现AI队伍", flaw: "弹药消耗 +1", potential: 88, story: personnelProfiles.find(person => person.name === "闻岚")!.story, gear: { 武器: "猎鹿步枪", 防具: "伪装披风", 头盔: "护目镜", 背包: "轻型背囊", 特殊: "测距仪" } },
];

const rvStations = [
  { label: "指挥台", role: "指挥官", skill: "全队遭遇成功率 +6%" }, { label: "侦察席", role: "侦察员", skill: "推进与搜索风险降低" },
  { label: "突击席", role: "突击手", skill: "强攻成功率 +8%" }, { label: "狙击席", role: "狙击手", skill: "提前显示AI队伍动向" },
  { label: "医疗台", role: "医疗员", skill: "每回合恢复小队健康" }, { label: "维修台", role: "机械师", skill: "标记下一项房车修复需求" },
  { label: "厨房", role: "厨师", skill: "每回合额外恢复饱食度" }, { label: "军需席", role: "军需官", skill: "背包纵向增加一格" },
  { label: "暗网终端", role: "黑市联络员", skill: "开启两回合刷新的黑市" }, { label: "搜救电台", role: "搜救队长", skill: "消耗搜救仪定向招聘" },
];

const relationshipStations: Array<{ label: string; role: RelationshipRole; skill: string }> = [
  { label: "双人卡座", role: "伴侣", skill: "提供回合恢复、风险安抚与专属互动" },
  { label: "士气舞台", role: "拉拉队员", skill: "提高行动评分与遭遇成功率" },
];

const locations: Place[] = [
  { id: 1, level: 1, name: "枫叶商业街", risk: "低", hint: "补给稀薄的教学区域，以白色生存物资为主", accent: "safe" },
  { id: 2, level: 2, name: "圣心诊疗中心", risk: "较低", hint: "药品较多，偶尔能找到低阶电脑部件", accent: "safe" },
  { id: 3, level: 3, name: "北环维修厂", risk: "普通", hint: "房车零件与工具集中，敌队开始成形", accent: "mid" },
  { id: 4, level: 4, name: "河岸住宅区", risk: "普通", hint: "房间密集，生存物资与奢侈品混合出现", accent: "mid" },
  { id: 5, level: 5, name: "高速封锁站", risk: "中高", hint: "装备箱增加，精英敌人开始进入角色池", accent: "mid" },
  { id: 6, level: 6, name: "旧港集装箱场", risk: "高", hint: "大型物资与走私装备较多，脱离路线狭窄", accent: "high" },
  { id: 7, level: 7, name: "地下科研站", risk: "高", hint: "电脑设备与实验物资丰富，名家敌人明显增加", accent: "high" },
  { id: 8, level: 8, name: "黑潮军械库", risk: "极高", hint: "高阶武器集中，但每次遇敌都可能是硬仗", accent: "extreme" },
  { id: 9, level: 9, name: "红区物流枢纽", risk: "极高", hint: "金色物资开始稳定出现，传奇敌人可能带队", accent: "extreme" },
  { id: 10, level: 10, name: "零号撤离机场", risk: "致命", hint: "废弃跑道横跨红区，高价值空投与重装敌队同时出现", accent: "extreme" },
  { id: 11, level: 11, name: "沉没化工区", risk: "灾难", hint: "被污染洪水吞没的工业区，红色设备与特殊物资埋在深水厂房", accent: "extreme" },
  { id: 12, level: 12, name: "群峰广播站", risk: "终局", hint: "封锁线外最后仍在发射信号的高山设施，也是撤离路线的最终坐标", accent: "extreme" },
];

const mapMarkerPositions = [
  { left: 10, top: 88 }, { left: 38, top: 82 }, { left: 70, top: 88 }, { left: 87, top: 65 },
  { left: 58, top: 61 }, { left: 26, top: 62 }, { left: 12, top: 38 }, { left: 42, top: 34 },
  { left: 74, top: 40 }, { left: 22, top: 12 }, { left: 55, top: 10 }, { left: 88, top: 15 },
];

type ContractBlueprint = {
  category: string; title: string; metric: ContractMetric; icon: string;
  target: (tier: number) => number;
  description: (tier: number, target: number, submitItem?: string) => string;
  rewards: (tier: number) => ContractReward[];
  submitItemName?: (tier: number) => string;
};

const contractBlueprints: ContractBlueprint[] = [
  { category: "物资搜索", title: "废墟清点", metric: "searched", icon: "搜", target: tier => 3 + tier * 3, description: (_tier, target) => `在任意房间完成 ${target} 次物资搜索。`, rewards: tier => [{ kind: "currency", label: `货币 ¥${500 + tier * 500}`, amount: 500 + tier * 500 }] },
  { category: "安全撤离", title: "把人带回来", metric: "extractions", icon: "撤", target: tier => 1 + Math.floor(tier / 2), description: (_tier, target) => `携带任意战利品成功撤离 ${target} 次。`, rewards: tier => [{ kind: "supplies", label: tier ? "外科手术包" : "救灾口粮", itemName: tier ? "外科手术包" : "救灾口粮" }] },
  { category: "生存回收", title: "补满冰箱", metric: "recoverFood", icon: "粮", target: tier => 2 + tier * 2, description: (_tier, target) => `成功撤离并带回 ${target} 件食物。`, rewards: tier => [{ kind: "item", label: tier ? "精密传动组件" : "通用机械零件", itemName: tier ? "精密传动组件" : "通用机械零件" }] },
  { category: "补给使用", title: "先活过今天", metric: "suppliesUsed", icon: "用", target: tier => 1 + tier, description: (_tier, target) => `在房车或行动中使用 ${target} 件食物或药品。`, rewards: tier => [{ kind: "supplies", label: tier ? "血浆袋" : "医用缝合包", itemName: tier ? "血浆袋" : "医用缝合包" }] },
  { category: "房车维护", title: "让引擎继续转", metric: "repairs", icon: "修", target: tier => 1 + tier, description: (_tier, target) => `完成 ${target} 次房车部件修复。`, rewards: tier => [{ kind: "equipment", label: tier ? "警用防弹衣" : "精准步枪", itemName: tier ? "警用防弹衣" : "精准步枪" }] },
  { category: "敌队压制", title: "清理竞争者", metric: "squads", icon: "战", target: tier => 1 + tier, description: (_tier, target) => `在交火中累计击破 ${target} 支拾荒者小队。`, rewards: tier => [{ kind: "currency", label: `货币 ¥${1400 + tier * 900}`, amount: 1400 + tier * 900 }] },
  { category: "深区侦察", title: "核心留痕", metric: "coreSearches", icon: "核", target: tier => 2 + tier, description: (_tier, target) => `进入任意地点核心区并完成 ${target} 次搜索。`, rewards: () => [{ kind: "item", label: "搜救仪", itemName: "搜救仪" }] },
  { category: "装备回收", title: "武装房车", metric: "recoverEquipment", icon: "装", target: tier => 1 + tier, description: (_tier, target) => `成功撤离并带回 ${target} 件装备。`, rewards: tier => [{ kind: "equipment", label: tier ? "军用全盔" : "防暴头盔", itemName: tier ? "军用全盔" : "防暴头盔" }] },
  { category: "指定提交", title: "无线电指定件", metric: "submitted", icon: "交", target: () => 1, submitItemName: tier => ["通用机械零件", "耐热密封圈组", "精密传动组件"][Math.min(2, tier)], description: (_tier, _target, item) => `从存储柜提交 1 件「${item}」。`, rewards: tier => [{ kind: "coins", label: `矿币 ×${1 + tier}`, amount: 1 + tier }, { kind: "currency", label: `货币 ¥${800 + tier * 600}`, amount: 800 + tier * 600 }] },
  { category: "人员扩编", title: "最后的空座", metric: "recruits", icon: "人", target: () => 1, description: () => "通过现场信号或搜救系统招募 1 名新成员。", rewards: tier => [{ kind: "item", label: "搜救仪", itemName: "搜救仪" }, { kind: "currency", label: `货币 ¥${1200 + tier * 800}`, amount: 1200 + tier * 800 }] },
];

const mysteryContracts: ContractDefinition[] = [
  { id: "signal-cache", category: "神秘信号", title: "把三件东西放在路标下", description: "完成3次物资搜索；频道另一端不在意你找到了什么。", metric: "searched", target: 3, icon: "?", mystery: true, rewards: [{ kind: "currency", label: "货币 ¥3000", amount: 3000 }, { kind: "item", label: "搜救仪", itemName: "搜救仪" }] },
  { id: "signal-return", category: "神秘信号", title: "证明这条路还能回来", description: "成功撤离1次。无需进入内部或核心区。", metric: "extractions", target: 1, icon: "?", mystery: true, rewards: [{ kind: "equipment", label: "军用突击步枪", itemName: "军用突击步枪" }, { kind: "currency", label: "货币 ¥1800", amount: 1800 }] },
  { id: "signal-silence", category: "神秘信号", title: "让一个频道安静下来", description: "击破1支敌方小队。对方的身份并不重要。", metric: "squads", target: 1, icon: "?", mystery: true, rewards: [{ kind: "equipment", label: "重型插板甲", itemName: "重型插板甲" }, { kind: "coins", label: "矿币 ×2", amount: 2 }] },
  { id: "signal-red", category: "神秘信号", title: "带回一件真正稀有的东西", description: "成功带回1件金色或红色品质物资。", metric: "rareRecovered", target: 1, icon: "?", mystery: true, rewards: [{ kind: "currency", label: "货币 ¥4200", amount: 4200 }, { kind: "supplies", label: "再生医疗套装", itemName: "再生医疗套装" }] },
  { id: "signal-kindness", category: "神秘信号", title: "先照顾好还活着的人", description: "使用1件食物或药品。", metric: "suppliesUsed", target: 1, icon: "?", mystery: true, rewards: [{ kind: "item", label: "耐热密封圈组", itemName: "耐热密封圈组" }, { kind: "item", label: "地下金库钥匙", itemName: "地下金库钥匙" }] },
];

function campaignContract(index: number): ContractDefinition {
  const blueprint = contractBlueprints[index % contractBlueprints.length];
  const tier = Math.floor(index / contractBlueprints.length);
  const target = blueprint.target(tier);
  const submitItemName = blueprint.submitItemName?.(tier);
  return { id: `campaign-${index}`, category: blueprint.category, title: blueprint.title, metric: blueprint.metric, icon: blueprint.icon, target, submitItemName, description: blueprint.description(tier, target, submitItemName), rewards: blueprint.rewards(tier) };
}

function contractRewardSummary(contract: ContractDefinition) { return contract.rewards.map(reward => reward.label).join(" + "); }

const qualityClass: Record<Quality, string> = { 普通: "q-common", 熟练: "q-skilled", 精英: "q-elite", 名家: "q-master", 传奇: "q-legend" };
const roleCodes: Record<string, string> = { 指挥官: "CMD", 侦察员: "SCOUT", 突击手: "ATK", 狙击手: "MRK", 医疗员: "MED", 机械师: "ENG", 厨师: "COOK", 军需官: "LOG", 黑市联络员: "LIA", 搜救队长: "SAR" };
function dossierCode(person: Crew) { return `RV-${roleCodes[person.role] ?? "OPS"}-${String(person.id).slice(-3).padStart(3, "0")}`; }
const gradeNames = ["", "白色", "绿色", "蓝色", "紫色", "金色", "红色"];
const zoneNames = ["外围", "内部", "核心"];
const roomZones = [0, 0, 1, 1, 2];
const roomNames = ["入口缓冲间", "外围储藏室", "内部作业间", "内部封锁室", "核心保险库"];
const slots: GearSlot[] = ["武器", "防具", "头盔", "背包", "特殊"];
const kitLabels: Record<KitSlot, string> = { weapon: "武器", backpack: "背包", armor: "护甲", helmet: "头盔", tactical: "战术道具" };
const kitOptions: Record<KitSlot, GearOption[]> = {
  weapon: [{ name: "旧式弩", note: "三人共享战斗力 +8", stat: 8, grade: 1 }, { name: "精准步枪", note: "三人共享战斗力 +18", stat: 18, grade: 3 }, { name: "军用突击步枪", note: "三人共享战斗力 +28", stat: 28, grade: 5 }],
  backpack: [{ name: "帆布背包", note: "6×6 · 36格", stat: 36, grade: 1, cols: 6, rows: 6 }, { name: "战术背包", note: "6×8 · 48格", stat: 48, grade: 3, cols: 6, rows: 8 }, { name: "远征背包", note: "8×8 · 64格", stat: 64, grade: 5, cols: 8, rows: 8 }],
  armor: [{ name: "轻便夹克", note: "三人共享防御 +4", stat: 4, grade: 1 }, { name: "警用防弹衣", note: "三人共享防御 +12", stat: 12, grade: 3 }, { name: "重型插板甲", note: "三人共享防御 +22", stat: 22, grade: 5 }],
  helmet: [{ name: "工地头盔", note: "共享防御 +2，降低严重伤病风险", stat: 2, grade: 1 }, { name: "防暴头盔", note: "共享防御 +6，降低严重伤病风险", stat: 6, grade: 3 }, { name: "军用全盔", note: "共享防御 +11，降低严重伤病风险", stat: 11, grade: 5 }],
  tactical: [{ name: "简易照明棒", note: "搜索速度 +8%", stat: 8, grade: 1 }, { name: "烟雾弹", note: "开启维修通道撤离", stat: 14, grade: 3 }, { name: "战术无人机", note: "显示AI队伍精确进度", stat: 18, grade: 5 }],
};

function gearSlotForName(name: string): KitSlot {
  if (/(背包|背囊|腰包|旅行包|帆布包)/.test(name)) return "backpack";
  if (/(头盔|盔|面具|护目镜|面罩)/.test(name)) return "helmet";
  if (/(护甲|插板甲|防弹衣|背心|夹克|工作服|密封服|装甲|骨架|护臂|手套|伪装服)/.test(name)) return "armor";
  if (/(烟雾弹|无人机|照明棒)/.test(name)) return "tactical";
  return "weapon";
}

function recoveredGearOption(item: Pick<FieldLoot, "name" | "grade">): GearOption {
  const exact = (Object.values(kitOptions).flat()).find(option => option.name === item.name);
  if (exact) return exact;
  const grade = Math.max(1, Math.min(6, item.grade));
  const slot = gearSlotForName(item.name);
  if (slot === "backpack") {
    const dimensions = [[6, 6], [6, 7], [6, 8], [7, 8], [8, 8], [8, 10]][grade - 1];
    return { name: item.name, grade, stat: dimensions[0] * dimensions[1], cols: dimensions[0], rows: dimensions[1], note: `${dimensions[0]}×${dimensions[1]} · ${dimensions[0] * dimensions[1]}格` };
  }
  const stats: Record<Exclude<KitSlot, "backpack">, number[]> = {
    weapon: [8, 11, 16, 22, 28, 36], armor: [4, 6, 10, 15, 22, 29], helmet: [2, 3, 6, 8, 11, 15], tactical: [8, 10, 14, 16, 18, 22],
  };
  const stat = stats[slot][grade - 1];
  const label = slot === "weapon" ? "三人共享战斗力" : slot === "armor" ? "三人共享防御" : slot === "helmet" ? "共享防御并降低严重伤病风险" : "搜索与行动支援";
  return { name: item.name, grade, stat, note: `${label} +${stat}` };
}

const fieldLootTemplates: LootTemplate[] = [
  { name: "瓶装净水", type: "食物", size: 1, grade: 1, value: 55, w: 1, h: 1, searchSeconds: 1 },
  { name: "压缩饼干", type: "食物", size: 2, grade: 1, value: 80, w: 2, h: 1, searchSeconds: 1.2 },
  { name: "午餐肉罐头", type: "食物", size: 2, grade: 2, value: 180, w: 2, h: 1, searchSeconds: 1.5 },
  { name: "净水滤芯", type: "食物", size: 2, grade: 3, value: 520, w: 1, h: 2, searchSeconds: 2.2 },
  { name: "军用自热口粮", type: "食物", size: 4, grade: 4, value: 1150, w: 2, h: 2, searchSeconds: 3 },
  { name: "急救绷带", type: "药品", size: 1, grade: 1, value: 90, w: 1, h: 1, searchSeconds: 1.1 },
  { name: "止痛针", type: "药品", size: 1, grade: 2, value: 240, w: 1, h: 1, searchSeconds: 1.6 },
  { name: "抗生素", type: "药品", size: 2, grade: 3, value: 720, w: 2, h: 1, searchSeconds: 2.4 },
  { name: "军用急救包", type: "药品", size: 6, grade: 4, value: 1400, w: 3, h: 2, searchSeconds: 3.2 },
  { name: "实验型血清", type: "药品", size: 2, grade: 6, value: 11000, w: 2, h: 1, searchSeconds: 5.8 },
  { name: "散装9mm弹药", type: "弹药", size: 2, grade: 1, value: 110, w: 2, h: 1, searchSeconds: 1.2 },
  { name: "步枪弹匣", type: "弹药", size: 2, grade: 2, value: 320, w: 1, h: 2, searchSeconds: 1.8 },
  { name: "步枪弹药箱", type: "弹药", size: 4, grade: 3, value: 680, w: 2, h: 2, searchSeconds: 2.4 },
  { name: "旧式左轮", type: "装备", size: 6, grade: 2, value: 640, w: 3, h: 2, searchSeconds: 2.4 },
  { name: "精准步枪", type: "装备", size: 8, grade: 3, value: 1800, w: 4, h: 2, searchSeconds: 3.4 },
  { name: "警用防弹衣", type: "装备", size: 9, grade: 3, value: 1700, w: 3, h: 3, searchSeconds: 3.6 },
  { name: "战术背包", type: "装备", size: 12, grade: 3, value: 1500, w: 3, h: 4, searchSeconds: 3.2 },
  { name: "防暴头盔", type: "装备", size: 4, grade: 3, value: 1200, w: 2, h: 2, searchSeconds: 2.8 },
  { name: "烟雾弹", type: "装备", size: 1, grade: 3, value: 780, w: 1, h: 1, searchSeconds: 2 },
  { name: "军用突击步枪", type: "装备", size: 10, grade: 5, value: 5200, w: 5, h: 2, searchSeconds: 5 },
  { name: "远征背包", type: "装备", size: 16, grade: 5, value: 4800, w: 4, h: 4, searchSeconds: 5.2 },
  { name: "重型插板甲", type: "装备", size: 12, grade: 5, value: 5600, w: 4, h: 3, searchSeconds: 5.4 },
  { name: "军用全盔", type: "装备", size: 4, grade: 5, value: 3900, w: 2, h: 2, searchSeconds: 4.1 },
  { name: "战术无人机", type: "装备", size: 6, grade: 5, value: 6100, w: 3, h: 2, searchSeconds: 5.8 },
  { name: "通用机械零件", type: "零件", size: 4, grade: 1, value: 160, w: 2, h: 2, searchSeconds: 1.8 },
  { name: "耐热密封圈组", type: "零件", size: 4, grade: 2, value: 430, w: 2, h: 2, searchSeconds: 2.1 },
  { name: "精密传动组件", type: "零件", size: 9, grade: 4, value: 2100, w: 3, h: 3, searchSeconds: 3.8 },
  { name: "完整冷却核心", type: "零件", size: 16, grade: 5, value: 6200, w: 4, h: 4, searchSeconds: 5 },
  { name: "实验型导航核心", type: "零件", size: 16, grade: 6, value: 12000, w: 4, h: 4, searchSeconds: 6.5 },
  { name: "银质打火机", type: "奢侈品", size: 1, grade: 2, value: 380, w: 1, h: 1, searchSeconds: 1.8 },
  { name: "收藏级红酒", type: "奢侈品", size: 3, grade: 3, value: 880, w: 1, h: 3, searchSeconds: 2.6 },
  { name: "钛合金表", type: "奢侈品", size: 1, grade: 5, value: 4600, w: 1, h: 1, searchSeconds: 4 },
  { name: "旧时代金表", type: "奢侈品", size: 1, grade: 5, value: 5200, w: 1, h: 1, searchSeconds: 4.4 },
  { name: "加密数据芯片", type: "奢侈品", size: 2, grade: 6, value: 9800, w: 2, h: 1, searchSeconds: 5.5 },
  { name: "CPU·老式双核", type: "电脑", size: 2, grade: 1, value: 160, w: 2, h: 1, searchSeconds: 1.7 },
  { name: "CPU·i5处理器", type: "电脑", size: 2, grade: 3, value: 980, w: 2, h: 1, searchSeconds: 2.8 },
  { name: "CPU·服务器旗舰", type: "电脑", size: 4, grade: 5, value: 5600, w: 2, h: 2, searchSeconds: 5 },
  { name: "GPU·GTX960", type: "电脑", size: 4, grade: 2, value: 450, w: 2, h: 2, searchSeconds: 2.2 },
  { name: "GPU·RTX4070", type: "电脑", size: 6, grade: 4, value: 2600, w: 3, h: 2, searchSeconds: 3.9 },
  { name: "GPU·RTX5090", type: "电脑", size: 8, grade: 5, value: 7200, w: 4, h: 2, searchSeconds: 5.2 },
  { name: "GPU·RTX6090", type: "电脑", size: 8, grade: 6, value: 16800, w: 4, h: 2, searchSeconds: 6.8 },
  { name: "内存·8GB", type: "电脑", size: 1, grade: 2, value: 260, w: 1, h: 1, searchSeconds: 1.6 },
  { name: "内存·32GB高频", type: "电脑", size: 1, grade: 4, value: 1450, w: 1, h: 1, searchSeconds: 3.1 },
  { name: "内存·实验型模块", type: "电脑", size: 2, grade: 6, value: 7800, w: 2, h: 1, searchSeconds: 5.9 },
  { name: "诊所冷柜钥匙", type: "钥匙", size: 1, grade: 3, value: 650, w: 1, h: 1, searchSeconds: 2.7 },
  { name: "维修主管钥匙", type: "钥匙", size: 1, grade: 4, value: 1500, w: 1, h: 1, searchSeconds: 3.6 },
  { name: "红区安全卡", type: "钥匙", size: 1, grade: 5, value: 4200, w: 1, h: 1, searchSeconds: 5.2 },
  { name: "搜救仪", type: "功能", size: 4, grade: 5, value: 3800, w: 2, h: 2, searchSeconds: 5 },
  { name: "绯红邀约终端", type: "功能", size: 2, grade: 6, value: 24000, w: 2, h: 1, searchSeconds: 7.2, story: "一台覆着暗红玻璃的旧世界私人社交终端。开机后只有一行字：真正稀缺的不是幸存者，而是末日里仍愿意靠近你的人。" },
];

const expandedCatalogNames: Array<{ type: LootType; names: string[] }> = [
  { type: "食物", names: ["半瓶矿泉水", "苏打饼干", "盐渍花生", "水果罐头", "即食燕麦", "真空面包", "午餐肉切片", "脱水蔬菜包", "袋装米", "食用盐", "方糖盒", "速溶咖啡", "能量棒", "蜂蜜罐", "高热量巧克力", "便携净水袋", "冻干牛肉", "复合维生素片", "救灾口粮", "浓缩营养膏", "高级咖啡豆", "密封香料箱", "极地远征口粮", "生态舱培养液"] },
  { type: "药品", names: ["消毒棉片", "医用胶带", "退烧片", "止咳糖浆", "碘伏瓶", "一次性口罩", "简易夹板", "止血带", "生理盐水", "创口贴盒", "胃药", "抗过敏片", "医用缝合包", "肾上腺素针", "便携氧气瓶", "抗感染喷雾", "强效镇痛剂", "血浆袋", "外科手术包", "广谱抗毒剂", "低温器官箱", "纳米止血凝胶", "再生医疗套装", "泛用型免疫血清"] },
  { type: "弹药", names: ["散装猎枪弹", "旧制手枪弹", "小口径弹盒", "弩箭束", "信号弹", "橡胶弹袋", "空包弹箱", "霰弹枪弹带", "冲锋枪弹匣", "步枪散弹包", "狩猎箭袋", "训练用弹盒", "穿甲手枪弹", "曳光弹匣", "消音亚音速弹", "精制猎枪独头弹", "军规步枪弹箱", "轻机枪弹鼓", "反器材弹匣", "燃烧弹箱", "高爆榴弹", "电磁枪弹芯", "钨芯穿甲弹箱", "实验型脉冲弹药"] },
  { type: "装备", names: ["锈蚀撬棍", "木柄消防斧", "自制短弓", "工地射钉枪", "磨损猎枪", "警用伸缩棍", "短管手枪", "生存砍刀", "旧式冲锋枪", "折叠猎弩", "巡逻卡宾枪", "改装霰弹枪", "消音手枪", "制式突击步枪", "精密猎人弩", "近卫短剑", "轻机枪", "半自动狙击枪", "班用机枪", "反器材步枪", "电磁线圈枪", "高斯狙击原型", "特勤模块步枪", "实验型等离子切割器"] },
  { type: "装备", names: ["旧帆布包", "摩托车头盔", "棉质工作服", "焊工手套", "轻型腰包", "工地护目镜", "旧警用背心", "登山头盔", "加固旅行包", "皮革护臂", "防刺背心", "急救员背包", "复合材料头盔", "轻型防弹衣", "模块化背包", "防毒面具", "陶瓷插板甲", "重型战术背包", "全封闭防暴盔", "侦察伪装服", "动力辅助骨架", "纳米纤维护甲", "远征级密封服", "实验型外骨骼装甲"] },
  { type: "零件", names: ["生锈螺栓盒", "橡胶软管", "废旧轴承", "通用保险丝", "铜线线圈", "小型齿轮组", "发动机皮带", "车灯总成", "液压油桶", "火花塞组", "蓄电池电芯", "车载继电器", "高压油泵", "强化悬挂组件", "导航天线", "密封舱门组件", "涡轮增压器", "军用通信模块", "重载传动轴", "复合装甲板", "静音发电机组", "车载净化核心", "量子导航阵列", "聚变动力控制器"] },
  { type: "奢侈品", names: ["旧电影票册", "铜质纪念币", "密封香烟盒", "手工钢笔", "绝版漫画", "银边眼镜", "黑胶唱片", "老式相机", "机械怀表", "签名棒球", "名牌香水", "手绘地图", "古董瓷杯", "限量球鞋", "珠宝胸针", "名家油画", "古董小提琴", "钻石戒指", "皇室瓷器", "稀有邮票册", "陨石雕件", "博物馆皇冠", "失落文明金面具", "未公开原版手稿"] },
  { type: "电脑", names: ["CPU·单核办公芯", "GPU·集成显卡板", "内存·2GB旧条", "CPU·四核低功耗", "GPU·GT730", "内存·4GB普条", "CPU·i3处理器", "GPU·GTX1050", "内存·16GB", "CPU·锐龙5处理器", "GPU·RX6600", "内存·24GB服务器条", "CPU·i7高频版", "GPU·RTX3060Ti", "内存·48GB ECC", "CPU·工作站十二核", "GPU·RTX4080Super", "内存·64GB高频", "CPU·霄龙服务器芯", "GPU·专业计算卡H100", "内存·128GB ECC", "CPU·神经网络原型", "GPU·量子光栅计算卡", "内存·光子存储模块"] },
];

function catalogGrade(index: number, group: number) {
  if (index < 11) return 1;
  if (index < 17) return 2;
  if (index < 21) return 3;
  if (index < 23) return 4;
  return group % 2 === 0 ? 5 : 6;
}

expandedCatalogNames.forEach((group, groupIndex) => group.names.forEach((name, index) => {
  const grade = catalogGrade(index, groupIndex);
  const compact = group.type === "食物" || group.type === "药品" || group.type === "弹药" || group.type === "奢侈品" || group.type === "电脑";
  const w = compact ? 1 + ((index + groupIndex) % 2) : 2 + ((index + groupIndex) % 3);
  const h = compact ? 1 + (index % 4 === 0 ? 1 : 0) : 1 + ((index + 1) % 3);
  const valueBase = [0, 45, 150, 520, 1500, 4600, 11800][grade];
  fieldLootTemplates.push({ name, type: group.type, size: w * h, grade, value: valueBase + index * (grade * 9), w, h, searchSeconds: .8 + grade * .72 + Math.min(1.4, w * h * .12) });
}));

fieldLootTemplates.push(
  { name: "便携辐射计", type: "功能", size: 2, grade: 2, value: 360, w: 2, h: 1, searchSeconds: 2 },
  { name: "加密门禁卡", type: "钥匙", size: 1, grade: 3, value: 920, w: 1, h: 1, searchSeconds: 2.8 },
  { name: "卫星求生信标", type: "功能", size: 4, grade: 4, value: 2400, w: 2, h: 2, searchSeconds: 4.1 },
  { name: "地下金库钥匙", type: "钥匙", size: 1, grade: 5, value: 5800, w: 1, h: 1, searchSeconds: 5.3 },
);

const legendaryRelics: LootTemplate[] = [
  { name: "玉米烟斗", type: "专属", grade: 6, value: 18000, size: 2, w: 2, h: 1, searchSeconds: 6.2, exclusiveFor: "麦克阿瑟", bonus: "指挥官技能额外 +4% 遭遇成功率", effect: "combat", effectValue: 4, story: "烟斗柄上仍留着太平洋海风的盐渍，麦克阿瑟习惯在每次重大决定前把它握在掌心。" },
  { name: "胜利地图夹", type: "专属", grade: 6, value: 18200, size: 4, w: 2, h: 2, searchSeconds: 6.4, exclusiveFor: "朱可夫", bonus: "全队遭遇成功率 +4%", effect: "combat", effectValue: 4, story: "夹层里压着数张不属于这个世界的进军图，新的红线正一路指向感染区出口。" },
  { name: "尸变篇竹简", type: "专属", grade: 6, value: 20000, size: 3, w: 3, h: 1, searchSeconds: 6.5, exclusiveFor: "孙武", bonus: "搜索风险增长 -3", effect: "risk", effectValue: 3, story: "最后一枚竹片墨迹未干，上面只有八个字：敌不知兵，我自知危。" },
  { name: "荒野求生水壶", type: "专属", grade: 6, value: 17200, size: 4, w: 2, h: 2, searchSeconds: 6.1, exclusiveFor: "贝尔·格里尔斯", bonus: "搜索风险增长 -3", effect: "risk", effectValue: 3, story: "壶身布满不明生物留下的咬痕，但持有人坚称里面装过的东西都能提供水分。" },
  { name: "永续直播麦克风", type: "专属", grade: 6, value: 17600, size: 2, w: 1, h: 2, searchSeconds: 6.3, exclusiveFor: "甲亢哥", bonus: "全队行动恢复 +4", effect: "recovery", effectValue: 4, story: "没有网络、没有电源，它的直播指示灯仍在闪烁，仿佛另一端还有数百万人围观。" },
  { name: "幽灵面罩", type: "专属", grade: 6, value: 19600, size: 4, w: 2, h: 2, searchSeconds: 6.8, exclusiveFor: "西蒙·莱利", bonus: "严重伤病风险 -3%", effect: "fatal", effectValue: 3, story: "面罩内侧没有姓名，只有一道被反复划掉的撤离坐标。" },
  { name: "毁灭徽记", type: "专属", grade: 6, value: 22000, size: 1, w: 1, h: 1, searchSeconds: 7, exclusiveFor: "毁灭战士", bonus: "强攻成功率 +6%", effect: "combat", effectValue: 6, story: "金属徽记摸上去始终温热，远处感染者看见它时会本能地停止前进。" },
  { name: "雪原白围巾", type: "专属", grade: 6, value: 18800, size: 3, w: 1, h: 3, searchSeconds: 6.4, exclusiveFor: "西蒙·海耶", bonus: "严重伤病风险 -3%", effect: "fatal", effectValue: 3, story: "它在任何环境下都保持雪白，只有靠近危险时才会短暂结霜。" },
  { name: "平衡护腕", type: "专属", grade: 6, value: 18400, size: 2, w: 1, h: 2, searchSeconds: 6.2, exclusiveFor: "鹰眼", bonus: "远程掩护使遭遇成功率 +4%", effect: "combat", effectValue: 4, story: "护腕上刻着密密麻麻的风速修正值，最后一行写的是：餐叉也能用。" },
  { name: "青囊", type: "专属", grade: 6, value: 20500, size: 4, w: 2, h: 2, searchSeconds: 6.7, exclusiveFor: "华佗", bonus: "回合结算健康恢复 +5", effect: "recovery", effectValue: 5, story: "布囊里没有仙药，只有被认真分类的草叶，以及几张看不懂现代药价的批注。" },
  { name: "脉诊铜铃", type: "专属", grade: 6, value: 17800, size: 1, w: 1, h: 1, searchSeconds: 6, exclusiveFor: "扁鹊", bonus: "严重伤病风险 -3%", effect: "fatal", effectValue: 3, story: "铜铃从不因风而响，只会在附近有人隐瞒伤势时轻轻震动。" },
  { name: "天工墨斗", type: "专属", grade: 6, value: 21000, size: 3, w: 3, h: 1, searchSeconds: 6.8, exclusiveFor: "鲁班", bonus: "搜索风险增长 -3", effect: "risk", effectValue: 3, story: "墨线弹过的机械零件会自行对齐，仿佛材料也不敢违背它定下的规矩。" },
  { name: "星舰控制终端", type: "专属", grade: 6, value: 24000, size: 6, w: 3, h: 2, searchSeconds: 7.2, exclusiveFor: "马斯克", bonus: "全队遭遇成功率 +5%", effect: "combat", effectValue: 5, story: "终端启动页只有一个巨大的X，系统坚持把房车识别为尚未完成首飞的星舰。" },
  { name: "原味银勺", type: "专属", grade: 6, value: 17500, size: 1, w: 1, h: 1, searchSeconds: 6.1, exclusiveFor: "九转大肠主厨", bonus: "回合结算恢复 +4", effect: "recovery", effectValue: 4, story: "银勺被擦得一尘不染，却总能让人回忆起某种无法忽略的原本味道。" },
  { name: "钢铁胃勋章", type: "专属", grade: 6, value: 16800, size: 1, w: 1, h: 1, searchSeconds: 6, exclusiveFor: "老八", bonus: "回合结算恢复 +4", effect: "recovery", effectValue: 4, story: "没有人知道谁颁发了这枚勋章，只知道背面写着：已经没有什么不能吃。" },
  { name: "陶朱算盘", type: "专属", grade: 6, value: 21500, size: 4, w: 2, h: 2, searchSeconds: 6.7, exclusiveFor: "范蠡", bonus: "搜索风险增长 -2", effect: "risk", effectValue: 2, story: "每当市场价格变化，算盘珠会自行移动，唯独“人命”一栏始终无法计价。" },
  { name: "聚财金鞭", type: "专属", grade: 6, value: 25000, size: 6, w: 3, h: 2, searchSeconds: 7.1, exclusiveFor: "财神赵公明", bonus: "全队遭遇成功率 +4%", effect: "combat", effectValue: 4, story: "鞭柄嵌着一枚无法花出的古钱，靠近交易点时总会传来清脆的落币声。" },
  { name: "名单皮箱", type: "专属", grade: 6, value: 23000, size: 6, w: 3, h: 2, searchSeconds: 7, exclusiveFor: "辛德勒", bonus: "严重伤病风险 -4%", effect: "fatal", effectValue: 4, story: "箱中每一页都写着一个曾被保护的名字，末尾还留着足够继续添加的空白。" },
  { name: "金色挑战按钮", type: "专属", grade: 6, value: 26000, size: 4, w: 2, h: 2, searchSeconds: 7.3, exclusiveFor: "MrBeast", bonus: "全队遭遇成功率 +5%", effect: "combat", effectValue: 5, story: "按下按钮会播放掌声并弹出一句提示：最后活着离开的人赢得整座仓库。" },
  { name: "1549号飞行日志", type: "专属", grade: 6, value: 21800, size: 4, w: 2, h: 2, searchSeconds: 6.8, exclusiveFor: "萨伦伯格", bonus: "严重伤病风险 -4%", effect: "fatal", effectValue: 4, story: "日志最后记录的不是高度，而是一条穿过感染区、几乎不可能成功的撤离航线。" },
  { name: "氪星家徽", type: "专属", grade: 6, value: 28000, size: 4, w: 2, h: 2, searchSeconds: 7.5, exclusiveFor: "超人", bonus: "强攻成功率 +6%", effect: "combat", effectValue: 6, story: "红色纹章在黑暗中像心跳一样明灭，提醒它的主人力量并不是唯一答案。" },
];
fieldLootTemplates.push(...legendaryRelics);

const catalogQualities: Quality[] = ["普通", "熟练", "精英", "名家", "传奇"];
const roleCombatBias: Record<string, { attack: number; defense: number }> = {
  指挥官: { attack: 4, defense: 8 }, 侦察员: { attack: -3, defense: 4 }, 突击手: { attack: 12, defense: -5 }, 狙击手: { attack: 16, defense: -9 },
  医疗员: { attack: -7, defense: 11 }, 机械师: { attack: 1, defense: 13 }, 厨师: { attack: -5, defense: 6 }, 军需官: { attack: -1, defense: 15 },
  黑市联络员: { attack: -6, defense: 2 }, 搜救队长: { attack: 7, defense: 7 },
};
function combatStatsFor(name: string, role: string, quality: Quality, seed = 0) {
  const qualityIndex = catalogQualities.indexOf(quality);
  const attackBase = [12, 29, 52, 79, 108][qualityIndex];
  const defenseBase = [12, 30, 54, 82, 112][qualityIndex];
  const spans = [9, 15, 22, 28, 35];
  const nameSeed = [...name].reduce((sum, char) => sum + char.charCodeAt(0), seed * 17);
  const bias = roleCombatBias[role] ?? { attack: 0, defense: 0 };
  const attack = Math.max(10, Math.min(150, attackBase + nameSeed % spans[qualityIndex] + bias.attack));
  const defense = Math.max(8, Math.min(150, defenseBase + Math.floor(nameSeed / 7) % spans[qualityIndex] + bias.defense));
  return { attack, defense };
}
function normalizeCrewCombat(person: Crew, seed = 0): Crew {
  const normalized = Number.isFinite(person.attack) && Number.isFinite(person.defense) ? person : { ...person, ...combatStatsFor(person.name, person.role, person.quality, seed) };
  if (!normalized.injury && normalized.health === "重伤") return { ...normalized, health: "受伤", injury: { severity: "旧伤复发", treatment: 0, required: 100 } };
  if (normalized.injury && normalized.injury.treatment >= normalized.injury.required) return { ...normalized, health: "健康", injury: undefined };
  return normalized.injury ? { ...normalized, health: "受伤" } : normalized;
}
const knownCrew = [...initialCrew, ...reserveCrew];
const allPersonnelCatalog: Crew[] = personnelProfiles.map((profile, index) => {
  const existing = knownCrew.find(person => person.name === profile.name);
  if (existing) return existing;
  const roleIndex = rvStations.findIndex(station => station.role === profile.role);
  const qualityIndex = catalogQualities.indexOf(profile.quality);
  const combat = combatStatsFor(profile.name, profile.role, profile.quality, index);
  return {
    id: 1000 + index,
    name: profile.name,
    role: profile.role,
    subRole: rvStations[(roleIndex + qualityIndex + 3) % rvStations.length].role,
    score: 58 + qualityIndex * 8 + (roleIndex % 3),
    ...combat,
    quality: profile.quality,
    stamina: 100,
    health: "健康",
    trait: rvStations[roleIndex].skill,
    flaw: qualityIndex >= 3 ? "稀有且招聘成本高" : "需要实战培养",
    potential: Math.min(99, 72 + qualityIndex * 6 + (roleIndex % 4)),
    story: profile.story,
    gear: { 武器: "未知", 防具: "未知", 头盔: "未知", 背包: "未知", 特殊: "未知" },
  };
});
const peakCombatant = [...allPersonnelCatalog].filter(person => person.quality === "传奇").sort((a, b) => b.attack - a.attack)[0];
if (peakCombatant) peakCombatant.attack = 150;

const allRelationshipCatalog: Relationship[] = relationshipProfiles.map((profile, index) => ({ ...profile, id: 5000 + index }));

const relationshipArtSlugs: Record<string, string> = {
  桃夭: "taoyao", 绯夏: "feixia", 蜜糖: "mitang", 露娜: "luna", 夜莺: "yeying",
  维拉: "vera", 赤练: "chilian", 塞琳: "celine", 伊芙: "eve", 九尾: "jiuwei",
  莫妮卡: "monica", 黑蔷薇: "blackrose", 魅魔莉莉丝: "lilith", 克利奥帕特拉: "cleopatra", 貂蝉: "diaochan",
};
const relationshipArtVersions: Partial<Record<string, string>> = {
  克利奥帕特拉: "v2",
  魅魔莉莉丝: "v3",
  貂蝉: "v3",
};
function relationshipArt(person: Relationship, mode: "regular" | "allure") {
  const slug = relationshipArtSlugs[person.name] ?? `profile-${person.id}`;
  const version = relationshipArtVersions[person.name] ?? "v1";
  return `/assets/companions/companion-${slug}-${mode}-${version}.png`;
}

const miningRates: Record<string, number> = { "CPU·老式双核": .002, "CPU·i5处理器": .008, "CPU·服务器旗舰": .025, "GPU·GTX960": .01, "GPU·RTX4070": .035, "GPU·RTX5090": .065, "GPU·RTX6090": .1, "内存·8GB": .003, "内存·32GB高频": .012, "内存·实验型模块": .03 };
function miningYield(item: Loot) { return miningRates[item.name] ?? (item.type === "电脑" ? [0, .001, .004, .01, .022, .05, .1][item.grade] : 0); }
function medicineTreatment(item: Loot) { return item.type === "药品" ? [0, 10, 16, 24, 34, 48, 72][Math.max(1, Math.min(6, item.grade))] : 0; }

function seeded(seed: number) { const value = Math.sin(seed * 999.91) * 43758.5453; return value - Math.floor(value); }
const repairMaterialTracks: Record<"发动机" | "传动系统" | "密封系统" | "导航系统" | "冷却系统", string[]> = {
  发动机: ["通用机械零件", "通用机械零件", "精密传动组件", "耐热密封圈组", "精密传动组件", "完整冷却核心", "耐热密封圈组", "精密传动组件", "完整冷却核心", "实验型导航核心"],
  传动系统: ["通用机械零件", "精密传动组件", "通用机械零件", "精密传动组件", "耐热密封圈组", "精密传动组件", "完整冷却核心", "精密传动组件", "完整冷却核心", "实验型导航核心"],
  密封系统: ["耐热密封圈组", "通用机械零件", "耐热密封圈组", "精密传动组件", "耐热密封圈组", "完整冷却核心", "精密传动组件", "耐热密封圈组", "完整冷却核心", "实验型导航核心"],
  导航系统: ["加密数据芯片", "便携辐射计", "加密数据芯片", "精密传动组件", "便携辐射计", "实验型导航核心", "加密数据芯片", "实验型导航核心", "星舰控制终端", "实验型导航核心"],
  冷却系统: ["净水滤芯", "耐热密封圈组", "净水滤芯", "完整冷却核心", "耐热密封圈组", "完整冷却核心", "精密传动组件", "完整冷却核心", "实验型导航核心", "完整冷却核心"],
};
const upgradeMaterialTracks: Record<"床位" | "仓库" | "医疗站" | "工作台" | "侦察台" | "武器站", string[]> = {
  床位: ["通用机械零件", "耐热密封圈组", "精密传动组件"], 仓库: ["通用机械零件", "精密传动组件", "耐热密封圈组"],
  医疗站: ["抗生素", "血浆袋", "实验型血清"], 工作台: ["通用机械零件", "精密传动组件", "完整冷却核心"],
  侦察台: ["便携辐射计", "加密数据芯片", "实验型导航核心"], 武器站: ["步枪弹药箱", "精准步枪", "军用突击步枪"],
};
function generateCompanionTradeRequirements(cycle: number): MaterialRequest[] {
  const allowed = fieldLootTemplates.filter(item => item.grade <= 4 && item.type !== "专属" && item.name !== "绯红邀约终端" && item.name !== "搜救仪");
  const picked: MaterialRequest[] = [];
  const count = 3;
  let remaining = 4 + Math.floor(seeded(cycle * 71 + 19) * 5);
  for (let index = 0; index < count; index++) {
    const roll = seeded(cycle * 101 + index * 37);
    let grade = cycle === 0 ? (index === 1 ? 2 : 1) : roll < .78 ? 1 : roll < .97 ? 2 : roll < .998 ? 3 : 4;
    if (index === count - 1 && grade >= 3 && remaining > 1) grade = 1;
    const pool = allowed.filter(item => item.grade === grade);
    const fallback = allowed.filter(item => item.grade <= 2);
    const template = (pool.length ? pool : fallback)[Math.floor(seeded(cycle * 149 + index * 61) * (pool.length || fallback.length))];
    if (!template) continue;
    const slotsLeft = count - index;
    const quantity = grade >= 3 ? 1 : index === count - 1 ? remaining : Math.max(1, Math.min(remaining - (slotsLeft - 1), 1 + Math.floor(seeded(cycle * 181 + index * 83) * 3)));
    remaining -= quantity;
    picked.push({ name: template.name, quantity, grade: template.grade });
  }
  if (remaining > 0 && picked.length) picked[0].quantity += remaining;
  return picked;
}
function relationshipQuality(seed: number): Quality {
  const roll = seeded(seed) * 100;
  return roll < 65 ? "普通" : roll < 89 ? "熟练" : roll < 97 ? "精英" : roll < 99.7 ? "名家" : "传奇";
}
function pickRelationship(seed: number, ownedNames: string[]) {
  const quality = relationshipQuality(seed);
  const availableAtQuality = allRelationshipCatalog.filter(person => person.quality === quality && !ownedNames.includes(person.name));
  const fallback = allRelationshipCatalog.filter(person => !ownedNames.includes(person.name));
  const pool = availableAtQuality.length ? availableAtQuality : fallback;
  return pool[Math.floor(seeded(seed * 1.77 + 31) * pool.length)];
}
function survivorQuality(roll: number): Quality { return roll < .56 ? "普通" : roll < .83 ? "熟练" : roll < .94 ? "精英" : roll < .99 ? "名家" : "传奇"; }
function generateSurvivors(count: number, ownedNames: string[]) {
  const picked: Crew[] = [];
  for (let index = 0; index < count; index++) {
    const quality = survivorQuality(Math.random());
    const blocked = new Set([...ownedNames, ...picked.map(person => person.name)]);
    const exact = allPersonnelCatalog.filter(person => person.quality === quality && !blocked.has(person.name));
    const fallback = allPersonnelCatalog.filter(person => !blocked.has(person.name));
    const pool = exact.length ? exact : fallback;
    const person = pool[Math.floor(Math.random() * pool.length)];
    if (person) picked.push({ ...person, id: Date.now() + index + Math.floor(Math.random() * 100000), stamina: 100, health: "健康", gear: { 武器: "无", 防具: "无", 头盔: "无", 背包: "无", 特殊: "无" } });
  }
  return picked;
}
function generateSurvivorCandidates(ownedNames: string[]) {
  return generateSurvivors(1 + Math.floor(Math.random() * 3), ownedNames);
}
function generateStartingCrew() {
  return generateSurvivors(3, []);
}
function assignCrewToStations(members: Crew[]) {
  const assignments: (number | null)[] = Array(rvStations.length).fill(null);
  members.forEach(person => {
    const registered = rvStations.findIndex((station, index) => station.role === person.role && assignments[index] === null);
    const familiar = rvStations.findIndex((station, index) => station.role === person.subRole && assignments[index] === null);
    const available = assignments.findIndex(id => id === null);
    const target = registered >= 0 ? registered : familiar >= 0 ? familiar : available;
    if (target >= 0) assignments[target] = person.id;
  });
  return assignments;
}
function pickGrade(seed: number, zone: number, place: number, market = false) {
  const fieldWeights = [
    [79, 17.5, 2.8, .55, .13, .02], [72, 21, 5, 1.6, .35, .05], [64, 24, 8.5, 2.7, .7, .1], [56, 26, 11.5, 4.8, 1.5, .2],
    [48, 27, 15, 7, 2.6, .4], [40, 27, 18, 9.5, 4.5, 1], [32, 26, 21, 12, 7, 2], [25, 23, 23, 16, 10, 3],
  ];
  const lootTier = Math.max(0, Math.min(7, Math.floor((place - 1) * .64 + zone * 1.2)));
  const weights = market ? [66, 22, 8, 3, .85, .15] : fieldWeights[lootTier];
  const roll = seeded(seed) * 100; let total = 0;
  for (let i = 0; i < weights.length; i++) { total += weights[i]; if (roll <= total) return i + 1; }
  return 1;
}
function generateField(placeId: number, day: number, zone: number, raidSeed: number, room = 0): FieldLoot[] {
  const grid = Array.from({ length: 10 }, () => Array(10).fill(false)); const results: FieldLoot[] = []; const count = 5 + zone + (placeId % 2);
  for (let i = 0; i < count; i++) {
    const grade = pickGrade(raidSeed * .17 + day * 97 + placeId * 31 + zone * 17 + i * 13, zone, placeId); const pool = fieldLootTemplates.filter(item => item.grade === grade); const template = pool[Math.floor(seeded(raidSeed * .29 + day * 131 + placeId * 29 + zone * 19 + i * 41) * pool.length)] ?? fieldLootTemplates[0];
    for (let attempt = 0; attempt < 120; attempt++) {
      const x = Math.floor(seeded(raidSeed * .41 + day * 17 + placeId * 23 + zone * 37 + i * 43 + attempt * 53) * (11 - template.w)); const y = Math.floor(seeded(raidSeed * .53 + day * 61 + placeId * 13 + zone * 47 + i * 59 + attempt * 71) * (11 - template.h));
      let free = true; for (let yy = y; yy < y + template.h; yy++) for (let xx = x; xx < x + template.w; xx++) if (grid[yy][xx]) free = false; if (!free) continue;
      for (let yy = y; yy < y + template.h; yy++) for (let xx = x; xx < x + template.w; xx++) grid[yy][xx] = true; results.push({ ...template, id: day * 100000 + placeId * 10000 + zone * 1000 + room * 100 + i, x, y, revealed: false, moved: false }); break;
    }
  }
  return results;
}
function generateMarket(day: number): FieldLoot[] {
  return Array.from({ length: 10 }, (_, i) => { const grade = pickGrade(day * 101 + i * 23, 0, 1, true); const pool = fieldLootTemplates.filter(item => item.grade === grade); const template = pool[Math.floor(seeded(day * 191 + i * 37) * pool.length)] ?? fieldLootTemplates[0]; return { ...template, id: 800000 + day * 100 + i, x: 0, y: 0, revealed: true, moved: false, value: Math.ceil(template.value * 1.25) }; });
}
function enemyQuality(place: Place, seed: number): Quality {
  const baseProgress = (place.level - 1) / 9;
  const locationSwing = (seeded(seed * .37 + 97) - .5) * .24;
  const progress = Math.max(0, Math.min(1, baseProgress + locationSwing));
  const low = [82, 12, 4.5, 1.3, .2];
  const high = [6, 12, 24, 36, 22];
  const weights = low.map((value, index) => value + (high[index] - value) * progress);
  const roll = seeded(seed) * weights.reduce((sum, value) => sum + value, 0); let cursor = 0;
  for (let index = 0; index < weights.length; index++) { cursor += weights[index]; if (roll <= cursor) return catalogQualities[index]; }
  return "普通";
}
function generateEnemyParty(place: Place, day: number, raidSeed: number, wave = 1): CombatUnit[] {
  const chosen = new Set<string>();
  const locationPressure = (place.level - 1) / 9;
  const dayPressure = Math.min(.6, Math.max(0, day - 1) * .02);
  const veteranBonus = Math.min(90, Math.max(0, day - 1) * 3);
  const wavePressure = wave === 2 ? .2 : 0;
  const attackMultiplier = 1.12 + locationPressure * .75 + dayPressure + wavePressure;
  const defenseMultiplier = 1.1 + locationPressure * .6 + dayPressure * .75 + wavePressure * .9;
  return Array.from({ length: 3 }, (_, index) => {
    const quality = enemyQuality(place, raidSeed + wave * 1543 + day * 211 + index * 991);
    const exact = allPersonnelCatalog.filter(person => person.quality === quality && !chosen.has(person.name));
    const fallback = allPersonnelCatalog.filter(person => !chosen.has(person.name));
    const pool = exact.length ? exact : fallback;
    const person = pool[Math.floor(seeded(raidSeed * .31 + wave * 269 + place.id * 71 + day * 43 + index * 137) * pool.length)] ?? allPersonnelCatalog[0];
    chosen.add(person.name);
    const outlier = seeded(raidSeed * .67 + wave * 463 + place.id * 229 + day * 107 + index * 613) < .08;
    const attackVariance = .82 + seeded(raidSeed * .79 + wave * 331 + place.id * 163 + day * 89 + index * 479) * .48 + (outlier ? .2 : 0);
    const defenseVariance = .84 + seeded(raidSeed * .91 + wave * 277 + place.id * 197 + day * 113 + index * 541) * .42 + (outlier ? .14 : 0);
    const attack = Math.round(((person.attack + place.level * 2.5) * attackMultiplier + veteranBonus + (wave === 2 ? 15 : 0)) * attackVariance);
    const defense = Math.round(((person.defense + place.level * 2.5) * defenseMultiplier + veteranBonus * .8 + (wave === 2 ? 12 : 0)) * defenseVariance);
    const maxHp = Math.round(90 + defense * .75 + place.level * 5 + veteranBonus * 1.4 + (wave === 2 ? 24 : 0));
    return { id: -(wave * 100000 + place.id * 1000 + day * 10 + index + 1), name: person.name, role: `第${wave}队 · ${person.quality} · ${person.role}${outlier ? " · 精锐" : ""}`, attack, defense, maxHp, hp: maxHp };
  });
}
function generateEnemyLoot(place: Place, day: number, wave = 1): PackedLoot[] {
  const picked: PackedLoot[] = [];
  for (let index = 0; index < 5; index++) {
    const grade = pickGrade(day * 173 + place.id * 67 + index * 31, Math.min(2, Math.floor((place.id - 1) / 4)), place.id);
    const exact = fieldLootTemplates.filter(item => item.grade === grade && item.type !== "专属" && (index < 3 ? item.type === "装备" : true));
    const fallback = fieldLootTemplates.filter(item => item.grade <= grade && item.type !== "专属" && (index < 3 ? item.type === "装备" : true));
    const pool = exact.length ? exact : fallback;
    const template = pool[Math.floor(seeded(day * 73 + place.id * 41 + index * 29) * pool.length)] ?? fieldLootTemplates[0];
    const fit = firstFit(picked, template.w, template.h, 8, 10);
    if (fit) picked.push({ ...template, id: 950000 + wave * 10000 + day * 100 + place.id * 10 + index, x: 0, y: 0, revealed: true, moved: true, ...fit });
  }
  return picked;
}
function firstFit(items: PackedLoot[], w: number, h: number, cols: number, rows: number) {
  const used = Array.from({ length: rows }, () => Array(cols).fill(false)); items.forEach(item => { for (let y = item.py; y < item.py + item.h; y++) for (let x = item.px; x < item.px + item.w; x++) if (used[y]) used[y][x] = true; });
  for (let y = 0; y <= rows - h; y++) for (let x = 0; x <= cols - w; x++) { let free = true; for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (used[yy][xx]) free = false; if (free) return { px: x, py: y }; }
  return null;
}
function repack(items: PackedLoot[], cols = 10, rows = 24) { const packed: PackedLoot[] = []; items.forEach(item => { const fit = firstFit(packed, item.w, item.h, cols, rows); if (fit) packed.push({ ...item, ...fit }); }); return packed; }
function createStarterCrimsonTerminal(): PackedLoot {
  const template = fieldLootTemplates.find(item => item.name === "绯红邀约终端")!;
  return { ...template, id: 990000001, x: 0, y: 0, revealed: true, moved: true, px: 0, py: 0 };
}
function storeKind(item: Loot): StoreKind { return item.type === "食物" || item.type === "药品" ? "冰箱" : item.type === "装备" || item.type === "弹药" || item.type === "专属" ? "装备柜" : "存储柜"; }
function hardwareKind(name: string): HardwareKind | null { return name.startsWith("CPU") ? "CPU" : name.startsWith("GPU") ? "GPU" : name.startsWith("内存") ? "内存" : null; }
function purpose(item: Loot) { if (item.name === "绯红邀约终端") return "成功撤离后启用，永久解锁房车「伴侣」板块"; if (item.type === "食物") return "局内应急 / 房车补充饱食度"; if (item.type === "药品") return "局内救治 / 房车恢复健康"; if (item.type === "装备") return "配置出战装备，为三人行动组提供共享增益"; if (item.type === "专属") return `仅限${item.exclusiveFor}装备 · ${item.bonus}`; if (item.type === "弹药") return "军用贸易物资；战斗不再消耗弹药"; if (item.type === "零件") return "用于房车指定修复、建设或交换需求"; if (item.type === "奢侈品") return "高价出售换取货币"; if (item.type === "电脑") return "安装至电脑，持续产出矿币"; if (item.type === "钥匙") return "开启核心区密室或特殊撤离"; return "消耗后触发特殊系统"; }
function lootStory(item: Loot) {
  if (item.story) return item.story;
  const stories: Record<LootType, string[]> = {
    食物: ["包装上还印着灾难前的促销日期，如今一口热量比任何折扣都更诚实。", "它曾安静躺在普通货架上，直到饥饿让每一克重量都有了意义。", "封口处留下匆忙搬运的划痕，上一位主人没能把它带出这里。"],
    药品: ["褪色标签记录着旧世界对疾病的秩序，而现在每一剂都可能决定谁能上车。", "外壳沾着诊室的灰尘，里面保存的却是灾难后最昂贵的时间。", "它从一只没能合上的急救箱里滚出，仍在等待下一位伤员。"],
    弹药: ["铜壳在灯下发出冷光，每一发都意味着一条必须认真选择的退路。", "弹盒上的批次编号已无从追溯，剩余数量却被人用指甲反复刻过。", "它比食物更沉，也比承诺更可靠，但开火后会把整片区域叫醒。"],
    零件: ["没人记得它最初属于哪台机器，现在它可能成为房车继续前进的那一小步。", "油污遮住了生产编号，齿痕却证明它仍愿意再工作一个回合。", "在旧世界只是可替换件，在感染区却足以决定车轮能否再次转动。"],
    装备: ["表面的磨损记录了上一任使用者的逃亡路线，最后一道划痕停在撤离点前。", "它不是全新的，但所有关键结构仍可靠，像一名不爱说话的老队员。", "制造商承诺它能应付恶劣环境，大概没想过环境会恶劣到世界末日。"],
    奢侈品: ["它曾用来证明拥有者的身份，现在只证明文明真的存在过。", "在饥饿面前毫无用途，却总有人愿意用一箱罐头换回旧世界的幻觉。", "精致表面没有一道划痕，仿佛末日只是橱窗外发生的事。"],
    电脑: ["风扇里积满废墟灰尘，通电后仍执着地计算一个已经崩溃的世界。", "它曾追逐更高帧率，现在每一次运算都被换算成房车的生存资金。", "散热片还留着温度，说明有人在不久前放弃了这台机器。"],
    钥匙: ["钥匙上的编号对应一扇仍未打开的门，门后可能是财富，也可能只是更深的麻烦。", "它被上一位主人攥得发亮，却没能替他找到正确的出口。", "小小齿纹把危险与宝藏锁在同一侧，区别只在于谁先转动它。"],
    功能: ["这件工具为灾难前的特殊场景设计，却在末日找到了真正的使用说明。", "说明书已经遗失，留下的按键仍在邀请某个胆大的人尝试。", "它安静得不像重要物品，直到指示灯在黑暗中第一次亮起。"],
    专属: ["这件物品与某个名字绑定，其他人拿在手中只会觉得它异常沉重。"],
  };
  const pool = stories[item.type];
  const seed = Array.from(item.name).reduce((sum, char) => sum + (char.codePointAt(0) ?? 0), 0);
  return `${item.name}：${pool[seed % pool.length]}`;
}

function CrewCard({ person, selected, joined, onClick }: { person: Crew; selected?: boolean; joined?: boolean; onClick?: () => void }) {
  const treatmentPercent = person.injury ? Math.round(person.injury.treatment / person.injury.required * 100) : 0;
  return <button onClick={onClick} aria-disabled={!!person.injury} className={`crew-card ${qualityClass[person.quality]} ${person.presentation === "allure" ? "allure-card" : ""} ${selected ? "selected" : ""} ${person.injury ? "injured" : ""}`}>
    <i className="card-foil" />
    <div className="dossier-spine"><span>PERSONNEL</span><i /></div>
    <div className="card-top"><span>档案 {dossierCode(person)}</span><em>{person.quality}</em></div>
    <div className="card-art"><div className="portrait"><span>{person.name.slice(0, 1)}</span><i /></div><small>身份影像 · VERIFIED</small><b>{roleCodes[person.role] ?? "OPS"}</b>{person.presentation === "allure" && <em className="allure-mark">AFTER DARK · 成年</em>}</div>
    <div className="card-record">
      <div className="card-summary"><div className="card-identity"><small>{person.role} / {person.subRole}</small><strong>{person.name}</strong></div><div className="card-score"><small>能力</small>{person.score}</div></div>
      <div className="card-combat-stats"><span><small>战斗力</small><b>{person.attack}</b></span><span><small>防御力</small><b>{person.defense}</b></span></div>
      <div className="card-metrics"><span><small>潜力</small><b>{person.potential}</b></span><span><small>体力</small><b>{person.stamina}</b></span><span><small>健康</small><b>{person.health}</b></span></div>
      {person.injury && <div className="injury-card-status"><span>{person.injury.severity} · 无法出战</span><b>{treatmentPercent}%</b><i><em style={{ width: `${treatmentPercent}%` }} /></i></div>}
      {joined !== undefined && <span className={`card-status ${joined ? "joined" : ""}`}><i />{joined ? "ACTIVE · 在队" : "UNLOCATED · 待搜救"}</span>}
      <div className="stamina"><i style={{ width: `${person.stamina}%` }} /></div>
    </div>
  </button>;
}

function PersonDetail({ person, joined, onClose, panel = false, exclusiveEquipped, exclusiveAvailable, onEquipExclusive, onUnequipExclusive, onDismiss, dismissDisabled = false }: { person: Crew; joined: boolean; onClose?: () => void; panel?: boolean; exclusiveEquipped?: PackedLoot; exclusiveAvailable?: PackedLoot; onEquipExclusive?: () => void; onUnequipExclusive?: () => void; onDismiss?: () => void; dismissDisabled?: boolean }) {
  const [dismissArmed, setDismissArmed] = useState(false);
  const content = <article className={`${panel ? "detail-panel" : "person-detail-card"} ${qualityClass[person.quality]} ${person.presentation === "allure" ? "allure-dossier" : ""}`} onClick={event => event.stopPropagation()}>
    {onClose && <button className="person-detail-close" onClick={onClose} aria-label="关闭人物详情">×</button>}
    <header className="dossier-header">
      <div><span>RV SURVIVOR ADMINISTRATION</span><b>感染区幸存者管理局</b></div>
      <p><small>档案编号</small>{dossierCode(person)}</p>
    </header>
    <div className="dossier-classification"><span>{person.presentation === "allure" ? "AFTER DARK PERSONNEL" : "PERSONNEL DOSSIER"}</span><b>{person.quality}权限</b><em>{joined ? "ACTIVE / 已归队" : "UNLOCATED / 待搜救"}</em></div>
    <div className="person-detail-hero">
      <div className="detail-photo"><div className="person-detail-avatar"><span>{person.name.slice(0, 1)}</span><i /></div><small>IMAGE REF. 01-A</small><b>{roleCodes[person.role] ?? "OPS"}</b></div>
      <div className="detail-identity">
        <span>登记姓名 / SUBJECT</span><h2>{person.name}</h2>
        <p>主职 {person.role} <i /> 兼任 {person.subRole}</p>
        <div className="person-detail-badges"><span>{person.health}</span><span>{joined ? "房车成员" : "公开档案"}</span>{person.presentation === "allure" && <span className="allure-badge">魅力特勤 · 成年</span>}</div>
      </div>
      <strong className="person-detail-score"><small>综合评估</small>{person.score}<em>/100</em></strong>
    </div>
    <div className="person-stat-grid">
      <div className="combat-attack"><span>战斗力</span><b>{person.attack}</b><i style={{ width: `${person.attack / 1.5}%` }} /></div><div className="combat-defense"><span>防御力</span><b>{person.defense}</b><i style={{ width: `${person.defense / 1.5}%` }} /></div>
      <div><span>作业能力</span><b>{person.score}</b><i style={{ width: `${person.score}%` }} /></div><div><span>成长潜力</span><b>{person.potential}</b><i style={{ width: `${person.potential}%` }} /></div>
      <div><span>体能储备</span><b>{person.stamina}%</b><i style={{ width: `${person.stamina}%` }} /></div><div><span>档案等级</span><b>{person.quality}</b><i style={{ width: `${(catalogQualities.indexOf(person.quality) + 1) * 20}%` }} /></div>
    </div>
    {person.injury && <section className="injury-dossier"><header><div><small>MEDICAL RESTRICTION</small><b>伤病停赛 · {person.injury.severity}</b></div><span>禁止出战</span></header><p>该人物暂时无法加入三人行动组。前往仓库的冰箱，选择药品并用于此人，可推进治疗进度。</p><div><span>治疗进度</span><b>{person.injury.treatment} / {person.injury.required}</b><i><em style={{ width: `${person.injury.treatment / person.injury.required * 100}%` }} /></i></div><footer>中等品质药物每次通常提供24点治疗，约需4–5件完成康复。</footer></section>}
    <section className="person-story"><div><small>ORIGIN REPORT</small><b>来源与遭遇记录</b><em>已核验</em></div><p>{person.story}</p><footer><span>记录员 // RV-AI</span><span>最后更新 // 第 1 日</span></footer></section>
    <div className="dossier-assessment"><small>FIELD ASSESSMENT · 现场评估</small><div className="traits"><div><span>01</span><p><small>职业能力</small><b>{person.trait}</b></p></div><div><span>02</span><p><small>风险备注</small><b>{person.flaw}</b></p></div></div></div>
    {joined && person.quality === "传奇" && <section className={`exclusive-slot ${exclusiveEquipped ? "equipped" : ""}`}><header><div><small>BOUND RELIC SLOT</small><b>传奇专属道具</b></div><span>{exclusiveEquipped ? "已激活" : "空插槽"}</span></header>{exclusiveEquipped ? <div className="exclusive-slot-item"><i>{exclusiveEquipped.name.slice(0, 1)}</i><div><small>{exclusiveEquipped.exclusiveFor}专属</small><b>{exclusiveEquipped.name}</b><p>{exclusiveEquipped.bonus}</p></div><button onClick={onUnequipExclusive}>卸下</button></div> : exclusiveAvailable ? <div className="exclusive-slot-item available"><i>{exclusiveAvailable.name.slice(0, 1)}</i><div><small>装备柜中已发现</small><b>{exclusiveAvailable.name}</b><p>{exclusiveAvailable.bonus}</p></div><button onClick={onEquipExclusive}>装入</button></div> : <div className="exclusive-slot-empty"><span>＋</span><div><b>尚未获得对应专属物资</b><p>只有「{person.name}」对应的红色专属道具可以放入这里。</p></div></div>}</section>}
    <div className="gear-heading"><div><small>ISSUED EQUIPMENT</small><h3>随身装备清单</h3></div><span>{slots.length} ITEMS</span></div>
    <div className="gear-list">{slots.map((slot, index) => <div key={slot}><em>{String(index + 1).padStart(2, "0")}</em><span>{slot}</span><b>{person.gear[slot]}</b><i>已登记</i></div>)}</div>
    {joined && onDismiss && <section className="dismiss-personnel"><div><small>PERSONNEL RELEASE</small><b>解除同行关系</b><p>赶出后该人物会离开房车、岗位和行动组，已装备的传奇专属物会退回装备柜。</p></div><button disabled={dismissDisabled} className={dismissArmed ? "armed" : ""} onClick={() => dismissArmed ? onDismiss() : setDismissArmed(true)}>{dismissDisabled ? "至少保留3名健康成员" : dismissArmed ? `确认赶出 ${person.name}` : "赶出队伍"}</button></section>}
    <footer className="dossier-footer"><span>{dossierCode(person)}</span><i /><b>CONFIDENTIAL // RV USE ONLY</b></footer>
  </article>;
  return panel ? content : <div className="person-detail-backdrop" onClick={onClose}>{content}</div>;
}

function RelationshipCard({ person, joined, assigned, onClick }: { person: Relationship; joined: boolean; assigned?: boolean; artMode?: RelationshipArtMode; hoverAllure?: boolean; onToggleArt?: () => void; onClick: () => void }) {
  return <article className={`relationship-card ${qualityClass[person.quality]} ${joined ? "joined" : "allure-locked"}`}>
    <button className="relationship-card-main" onClick={onClick} aria-label={`查看${person.name}的完整档案`}>
      <div className="relationship-card-art" aria-hidden="true">
        <img className="relationship-art-regular" src={relationshipArt(person, "regular")} alt="" />
        <img className="relationship-art-allure" src={relationshipArt(person, "allure")} alt="" />
      </div>
      <div className="relationship-card-shade" />
      {!joined && <div className="relationship-allure-lock"><span>获得该人物后解锁暮色形态</span></div>}
      <header className="relationship-card-top"><span>{person.role}</span><em>{person.quality}</em></header>
      <section className="relationship-card-copy">
        <h3>{person.name}</h3>
        <small>{person.role} / {person.subRole} · 成年 {person.age}</small>
        <p className="relationship-card-tagline">“{person.tagline}”</p>
        <footer>{assigned ? "ON BOARD · 已入席" : joined ? "AVAILABLE · 已同行" : "UNMET · 未邂逅"}</footer>
      </section>
    </button>
  </article>;
}

function RelationshipDetail({ person, joined, assigned, onClose }: { person: Relationship; joined: boolean; assigned: boolean; artMode?: RelationshipArtMode; onToggleArt?: () => void; onClose: () => void }) {
  return <div className="relationship-detail-backdrop" onClick={onClose}><article className={`relationship-detail relationship-detail-gallery ${qualityClass[person.quality]}`} onClick={event => event.stopPropagation()}>
    <button className="relationship-detail-close" onClick={onClose} aria-label="关闭暮色档案">×</button>
    <section className={`relationship-detail-visual ${joined ? "" : "allure-locked"}`}>
      <img className="relationship-detail-regular" src={relationshipArt(person, "regular")} alt={`${person.name}常规人物立绘`} />
      <img className="relationship-detail-allure" src={relationshipArt(person, "allure")} alt={`${person.name}第二形态人物立绘`} />
      <span>{joined ? "悬停查看第二形态" : "获得该人物后解锁暮色形态"}</span>
    </section>
    <section className="relationship-detail-dossier">
      <header className="relationship-detail-head"><div><small>PRIVATE RV ACCESS</small><b>暮色同行者私密档案</b></div><span>21+ · CONSENSUAL</span></header>
      <div className="relationship-clearance"><span>{person.quality}通行证</span><b>{person.role}</b><em>{assigned ? "ON BOARD / 已入席" : joined ? "AVAILABLE / 已同行" : "UNMET / 未邂逅"}</em></div>
      <div className="relationship-detail-identity"><div><small>REGISTERED ADULT / 成年角色</small><h2>{person.name}</h2><p>{person.age}岁 · 主职{person.role} · 兼任{person.subRole}</p></div><strong>{person.score}<small>/100</small></strong></div>
      <blockquote className="relationship-detail-quote">“{person.tagline}”</blockquote>
      <div className="relationship-stat-grid"><div><span>综合能力</span><b>{person.score}</b></div><div><span>魅力评级</span><b>{person.charm}</b></div><div><span>当前默契</span><b>{person.bond}</b></div><div><span>档案品质</span><b>{person.quality}</b></div></div>
      <section className="relationship-story"><header><span>AFTER HOURS LOG</span><b>邂逅记录</b></header><p>{person.story}</p></section>
      <div className="relationship-assessment"><div><small>房车增益</small><b>{person.skill}</b></div><div><small>相处提醒</small><b>{person.flaw}</b></div></div>
      <footer className="relationship-detail-footer"><span>所有关系角色均为成年人</span><i /><b>亲密也需要尊重与选择</b></footer>
    </section>
  </article></div>;
}

function SurvivorCandidateChoices({ candidates, canRecruit, onRecruit, onReplace, source }: { candidates: Crew[]; canRecruit: boolean; onRecruit: (person: Crew) => void; onReplace: (person: Crew) => void; source: "现场" | "搜救" }) {
  return <div className="candidate-choice-grid">{candidates.map(person => <article className={`candidate-choice ${qualityClass[person.quality]}`} key={person.id}><header><span>{source}候选</span><em>{person.quality}</em></header><div className="candidate-choice-avatar">{person.name.slice(0, 1)}</div><strong>{person.score}</strong><h3>{person.name}</h3><p>{person.role} · 兼任{person.subRole}</p><small>战斗 {person.attack} · 防御 {person.defense} · 潜力 {person.potential}</small><div className="candidate-actions"><button disabled={!canRecruit} onClick={() => onRecruit(person)}>{canRecruit ? "加入空位" : "队伍已满"}</button><button className="replace" onClick={() => onReplace(person)}>替换旧成员</button></div></article>)}</div>;
}
function ReplacementModal({ candidate, crew, onReplace, onClose }: { candidate: Crew; crew: Crew[]; onReplace: (person: Crew) => void; onClose: () => void }) {
  return <div className="replacement-backdrop" onClick={onClose}><section className="replacement-modal" onClick={event => event.stopPropagation()}><button className="replacement-close" onClick={onClose}>×</button><header><small>CREW REPLACEMENT</small><h2>选择要被替换的成员</h2><p>新成员 <b>{candidate.name}</b> 将继承被替换者在房车与行动组中的位置；旧成员的专属道具会退回装备柜。</p></header><div className="replacement-candidate"><span>{candidate.name.slice(0, 1)}</span><div><b>{candidate.name}</b><small>{candidate.quality} · {candidate.role} / {candidate.subRole}</small></div><strong>战 {candidate.attack} · 防 {candidate.defense}</strong></div><div className="replacement-list">{crew.map(person => <button onClick={() => onReplace(person)} key={person.id}><span>{person.name.slice(0, 1)}</span><div><b>{person.name}</b><small>{person.role} · {person.quality}</small></div><em>战 {person.attack} / 防 {person.defense}</em><strong>替换</strong></button>)}</div></section></div>;
}
function GridCells({ cols, rows }: { cols: number; rows: number }) { return <>{Array.from({ length: cols * rows }).map((_, index) => <i aria-hidden="true" style={{ gridColumn: index % cols + 1, gridRow: Math.floor(index / cols) + 1 }} key={index} />)}</>; }
function WarehouseGrid({ items, action }: { items: PackedLoot[]; action: (item: PackedLoot) => void }) { return <div className="stash-grid expanded-grid"><GridCells cols={10} rows={24} />{items.map(item => <button onClick={() => action(item)} className={`packed-object grade-${item.grade} ${item.w * item.h <= 2 ? "compact-object" : ""}`} style={{ gridColumn: `${item.px + 1} / span ${item.w}`, gridRow: `${item.py + 1} / span ${item.h}` }} key={item.id}><span>{gradeNames[item.grade]} · {item.type}</span><b>{item.name}</b><small>{item.w}×{item.h} · ¥{item.value}</small><em>查看详情</em></button>)}</div>; }

function LootCard({ item, collected, onClick }: { item: LootTemplate; collected: boolean; onClick: () => void }) {
  const loot = { ...item, id: 0 } as Loot;
  return <button className={`loot-atlas-card item-grade-${item.grade} ${item.type === "专属" ? "exclusive" : ""}`} onClick={onClick}>
    <i className="loot-card-glint" />
    <header><span>{gradeNames[item.grade]}品质</span><em>{item.type}</em></header>
    <div className="loot-card-art"><span>{item.name.slice(0, 1)}</span><i /><small>{item.w}×{item.h}</small>{item.exclusiveFor && <b>{item.exclusiveFor}专属</b>}</div>
    <section><small>{item.type === "专属" ? "LEGENDARY RELIC" : "RECOVERED OBJECT"}</small><h3>{item.name}</h3><p>{purpose(loot)}</p></section>
    <footer><span>¥{item.value.toLocaleString()}</span><em>{collected ? "已收集" : "未收集"}</em></footer>
  </button>;
}

function LootArchiveDetail({ item, collected, onClose, actionLabel, onAction, actionDisabled = false, actionTone = "default", secondaryActionLabel, onSecondaryAction, secondaryActionTone = "default" }: { item: LootTemplate; collected: boolean; onClose: () => void; actionLabel?: string; onAction?: () => void; actionDisabled?: boolean; actionTone?: "default" | "danger"; secondaryActionLabel?: string; onSecondaryAction?: () => void; secondaryActionTone?: "default" | "danger" }) {
  const loot = { ...item, id: 0 } as Loot;
  return <div className="item-detail-backdrop loot-detail-backdrop" onClick={onClose}><article className={`loot-detail-card item-grade-${item.grade} ${item.type === "专属" ? "exclusive" : ""}`} onClick={event => event.stopPropagation()}>
    <button className="item-detail-close" onClick={onClose} aria-label="关闭物资详情">×</button>
    <header className="loot-dossier-head"><div><small>RECOVERED OBJECT ARCHIVE</small><b>回收物资档案</b></div><span>OBJ-{String(item.grade)}-{item.name.length.toString().padStart(2, "0")}</span></header>
    <div className="loot-clearance"><span>{gradeNames[item.grade]}品质</span><b>{item.type}</b><em>{collected ? "COLLECTED / 已收集" : "UNSEEN / 未收集"}</em></div>
    <div className="loot-detail-hero"><div className="loot-detail-art"><span>{item.name.slice(0, 1)}</span><i /><small>{item.w} × {item.h}</small></div><div><small>{item.type === "专属" ? "LEGENDARY RELIC" : "OBJECT IDENTITY"}</small><h2>{item.name}</h2><p>{purpose(loot)}</p>{item.exclusiveFor && <strong>身份绑定 · {item.exclusiveFor}</strong>}</div><b>¥{item.value.toLocaleString()}</b></div>
    <div className="loot-detail-metrics"><div><span>稀有品质</span><b>{gradeNames[item.grade]}</b></div><div><span>占用空间</span><b>{item.w * item.h}格</b></div><div><span>搜索耗时</span><b>{item.searchSeconds.toFixed(1)}秒</b></div><div><span>仓储分类</span><b>{storeKind(loot)}</b></div></div>
    <section className="loot-story"><header><span>OBJECT HISTORY</span><b>物资故事</b><em>一句话档案</em></header><p>{lootStory(loot)}</p></section>
    {item.exclusiveFor && <section className="relic-effect"><span>EXCLUSIVE EFFECT</span><div><b>{item.exclusiveFor}</b><p>{item.bonus}</p></div><small>该道具与人物身份绑定，无法装备给其他幸存者。</small></section>}
    {(actionLabel || secondaryActionLabel) && <div className="loot-detail-actions">
      {actionLabel && <button className={`loot-detail-action ${actionTone === "danger" ? "danger" : ""}`} disabled={actionDisabled} onClick={onAction}>{actionLabel}<span>→</span></button>}
      {secondaryActionLabel && <button className={`loot-detail-action secondary ${secondaryActionTone === "danger" ? "danger" : ""}`} onClick={onSecondaryAction}>{secondaryActionLabel}<span>×</span></button>}
    </div>}
    <footer className="loot-detail-footer"><span>RV OBJECT ARCHIVE</span><i /><b>点击右上角关闭</b></footer>
  </article></div>;
}

export default function Home() {
  const [tab, setTab] = useState<Tab>("房车");
  const [mode, setMode] = useState<GameMode>("base");
  const [day, setDay] = useState(1);
  const [crew, setCrew] = useState<Crew[]>(initialCrew);
  const [selectedCrew, setSelectedCrew] = useState(1);
  const [selectedAtlasPerson, setSelectedAtlasPerson] = useState<Crew | null>(null);
  const [expedition, setExpedition] = useState<number[]>([1, 2, 3]);
  const [seatAssignments, setSeatAssignments] = useState<(number | null)[]>([null, 1, 2, null, 3, null, null, null, null, null]);
  const [draggedCrew, setDraggedCrew] = useState<number | null>(null);
  const [draggedOverSeat, setDraggedOverSeat] = useState<number | null>(null);
  const [satiety, setSatiety] = useState(72);
  const [teamHealth, setTeamHealth] = useState(86);
  const [resources, setResources] = useState({ 弹药: 12, 零件: 0, 货币: 600 });
  const [repair, setRepair] = useState({ 发动机: 2, 传动系统: 1, 密封系统: 0, 导航系统: 0, 冷却系统: 0 });
  const [upgrades, setUpgrades] = useState({ 床位: 1, 仓库: 0, 医疗站: 0, 工作台: 0, 侦察台: 0, 武器站: 0 });
  const [kit, setKit] = useState<Kit>({ weapon: "旧式弩", backpack: "帆布背包", armor: "轻便夹克", helmet: "工地头盔", tactical: "简易照明棒" });
  const [ownedEquipment, setOwnedEquipment] = useState(["旧式弩", "帆布背包", "轻便夹克", "工地头盔", "简易照明棒"]);
  const [prepSlot, setPrepSlot] = useState<KitSlot>("weapon");
  const [loadoutModalOpen, setLoadoutModalOpen] = useState(false);
  const [crewModalOpen, setCrewModalOpen] = useState(false);
  const [crewModalSlot, setCrewModalSlot] = useState(0);
  const [plannedPlaceId, setPlannedPlaceId] = useState(1);
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [locationEscapes, setLocationEscapes] = useState<Record<number, number>>({});
  const [raidSeed, setRaidSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [zone, setZone] = useState(0);
  const [roomIndex, setRoomIndex] = useState(0);
  const [safeRemaining, setSafeRemaining] = useState(0);
  const [overtime, setOvertime] = useState(0);
  const [escapeProtection, setEscapeProtection] = useState(0);
  const [fieldLoot, setFieldLoot] = useState<FieldLoot[]>([]);
  const [risk, setRisk] = useState(6);
  const [logs, setLogs] = useState(["道路很安静，但远处一直有金属摩擦声。"]);
  const [searchedCount, setSearchedCount] = useState(0);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [searchingId, setSearchingId] = useState<number | null>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const [draggedLoot, setDraggedLoot] = useState<{ id: number; source: "field" | "bag" | "safe" | "enemy" } | null>(null);
  const [packedBag, setPackedBag] = useState<PackedLoot[]>([]);
  const [safeLoot, setSafeLoot] = useState<PackedLoot[]>([]);
  const [battle, setBattle] = useState(false);
  const [ai, setAi] = useState<AiSquad>({ zone: 0, searched: 0, value: 0, status: "搜索中", signal: "远处出现另一辆车的灯光" });
  const [raidParty, setRaidParty] = useState<CombatUnit[]>([]);
  const [enemyParty, setEnemyParty] = useState<CombatUnit[]>([]);
  const [enemyLoot, setEnemyLoot] = useState<PackedLoot[]>([]);
  const [enemyDefeated, setEnemyDefeated] = useState(false);
  const [enemyWave, setEnemyWave] = useState(1);
  const [escapeCooldown, setEscapeCooldown] = useState(0);
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [ambushWarning, setAmbushWarning] = useState<{ itemName: string; trigger: string } | null>(null);
  const [extracting, setExtracting] = useState(0);
  const [selectedExit, setSelectedExit] = useState<ExitId>("原路撤离");
  const [roundOutcome, setRoundOutcome] = useState<string[]>([]);
  const [survivorCandidates, setSurvivorCandidates] = useState<Crew[]>([]);
  const [relationshipRoster, setRelationshipRoster] = useState<Relationship[]>([]);
  const [relationshipCandidate, setRelationshipCandidate] = useState<Relationship | null>(null);
  const [relationshipAssignments, setRelationshipAssignments] = useState<(number | null)[]>([null, null]);
  const [draggedRelationship, setDraggedRelationship] = useState<number | null>(null);
  const [companionUnlocked, setCompanionUnlocked] = useState(false);
  const [relationshipContacts, setRelationshipContacts] = useState(0);
  const [companionTradeRequirements, setCompanionTradeRequirements] = useState<MaterialRequest[]>(() => generateCompanionTradeRequirements(0));
  const [companionTradeCycle, setCompanionTradeCycle] = useState(0);
  const [companionTradeNextRefreshDay, setCompanionTradeNextRefreshDay] = useState(3);
  const [relationshipArtModes, setRelationshipArtModes] = useState<Record<string, RelationshipArtMode>>({});
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [replacementCandidate, setReplacementCandidate] = useState<Crew | null>(null);
  const [replacementSource, setReplacementSource] = useState<ReplacementSource>("recruit");
  const [endingUnlocked, setEndingUnlocked] = useState(false);
  const [endingOpen, setEndingOpen] = useState(false);
  const [endingLegendaryCandidates, setEndingLegendaryCandidates] = useState<Crew[]>([]);
  const [endingCompanionCandidates, setEndingCompanionCandidates] = useState<Relationship[]>([]);
  const [endingLegendaryClaimed, setEndingLegendaryClaimed] = useState(false);
  const [endingCompanionClaimed, setEndingCompanionClaimed] = useState(false);
  const [peopleAtlasTab, setPeopleAtlasTab] = useState<"幸存者档案" | "魅力型角色">("幸存者档案");
  const [warehouseTab, setWarehouseTab] = useState<StoreKind>("装备柜");
  const [selectedStorageItem, setSelectedStorageItem] = useState<PackedLoot | null>(null);
  const [selectedAtlasItem, setSelectedAtlasItem] = useState<LootTemplate | null>(null);
  const [selectedMarketItem, setSelectedMarketItem] = useState<FieldLoot | null>(null);
  const [selectedRaidItem, setSelectedRaidItem] = useState<{ item: FieldLoot; source: "field" | "bag" | "safe" } | null>(null);
  const [exclusiveLoadout, setExclusiveLoadout] = useState<Record<number, PackedLoot>>({});
  const [equipmentStash, setEquipmentStash] = useState<PackedLoot[]>([]);
  const [survivalStash, setSurvivalStash] = useState<PackedLoot[]>([]);
  const [objectStash, setObjectStash] = useState<PackedLoot[]>([]);
  const [installed, setInstalled] = useState<Record<HardwareKind, PackedLoot[]>>({ CPU: [], GPU: [], 内存: [] });
  const [miningProgress, setMiningProgress] = useState(0);
  const [coins, setCoins] = useState(0);
  const [marketOffers, setMarketOffers] = useState<FieldLoot[]>(() => generateMarket(1));
  const [seenItems, setSeenItems] = useState<string[]>([]);
  const [collectedItems, setCollectedItems] = useState<string[]>([]);
  const [contractMainIndex, setContractMainIndex] = useState(0);
  const [mysteryContractId, setMysteryContractId] = useState<string | null>(null);
  const [contractProgress, setContractProgress] = useState(0);
  const [contractCompletionNote, setContractCompletionNote] = useState("");
  const [atlasFilter, setAtlasFilter] = useState<"全部" | StoreKind>("全部");
  const [saveReady, setSaveReady] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);

  const activeRole = (role: string) => crew.some(member => member.role === role || member.subRole === role);
  const assignedRelationships = relationshipAssignments.map(id => relationshipRoster.find(person => person.id === id)).filter(Boolean) as Relationship[];
  const relationshipAtRole = (role: RelationshipRole) => { const index = relationshipStations.findIndex(station => station.role === role); return relationshipRoster.find(person => person.id === relationshipAssignments[index]); };
  const activeRelationshipRole = (role: RelationshipRole) => companionUnlocked && !!relationshipAtRole(role);
  const relationshipQualityPower = (role: RelationshipRole) => { const person = relationshipAtRole(role); return companionUnlocked && person ? catalogQualities.indexOf(person.quality) + 1 : 0; };
  const selected = crew.find(c => c.id === selectedCrew) ?? crew[0];
  const availableGearOptions = (slot: KitSlot) => {
    const options = [
      ...kitOptions[slot].filter(option => ownedEquipment.includes(option.name)),
      ...equipmentStash.filter(item => item.type === "装备" && gearSlotForName(item.name) === slot).map(recoveredGearOption),
    ];
    return options.filter((option, index, all) => all.findIndex(entry => entry.name === option.name) === index);
  };
  const selectedGear = (slot: KitSlot): GearOption => availableGearOptions(slot).find(option => option.name === kit[slot]) ?? { name: "无装备", note: "该位置没有可用装备", stat: 0, grade: 1, cols: slot === "backpack" ? 4 : undefined, rows: slot === "backpack" ? 4 : undefined };
  const bagGear = selectedGear("backpack");
  const bagCols = bagGear.cols ?? 6;
  const bagRows = (bagGear.rows ?? 6) + (activeRole("军需官") ? 1 : 0);
  const teamRating = expedition.length ? Math.round(expedition.reduce((sum, id) => sum + (crew.find(c => c.id === id)?.score ?? 0), 0) / expedition.length) : 0;
  const preparationScore = Math.round(teamRating + (selectedGear("weapon").stat + selectedGear("armor").stat + selectedGear("helmet").stat + selectedGear("tactical").stat) / 4 + (activeRole("侦察员") ? 3 : 0) + (activeRole("指挥官") ? 2 : 0));
  const preparationTier = preparationScore >= 92 ? 2 : preparationScore >= 76 ? 1 : 0;
  const roomSafeTime = (targetZone: number, place = activePlace) => {
    const table = [[8, 11, 15], [6, 9, 12], [4, 7, 10]];
    const placePenalty = place ? Math.floor((place.level - 1) / 3) : 0;
    return Math.max(3, table[targetZone][preparationTier] + (activeRole("侦察员") ? 1 : 0) - placePenalty);
  };
  const equippedRelics = Object.values(exclusiveLoadout);
  const exclusiveEffect = (effect: ExclusiveEffect) => equippedRelics.filter(item => item.effect === effect).reduce((sum, item) => sum + (item.effectValue ?? 0), 0);
  const encounterChance = Math.min(80, 20 + overtime);
  const bagLoadRatio = packedBag.reduce((sum, item) => sum + item.w * item.h, 0) / Math.max(1, bagCols * bagRows);
  const extractionDuration = (exit: ExitId) => ({ 原路撤离: 7, 维修通道: 5, 封锁线车库: 3, 紧急撤离: 3 }[exit] + Math.ceil(bagLoadRatio * 2));
  const allyHpRatio = raidParty.length ? raidParty.reduce((sum, unit) => sum + unit.hp, 0) / raidParty.reduce((sum, unit) => sum + unit.maxHp, 0) : 1;
  const enemyHpRatio = enemyParty.length ? enemyParty.reduce((sum, unit) => sum + unit.hp, 0) / enemyParty.reduce((sum, unit) => sum + unit.maxHp, 0) : 1;
  const allyPower = raidParty.reduce((sum, unit) => sum + (unit.hp > 0 ? unit.attack + unit.defense : 0), 0);
  const enemyPower = enemyParty.reduce((sum, unit) => sum + (unit.hp > 0 ? unit.attack + unit.defense : 0), 0);
  const enemySquadsDefeated = enemyDefeated ? 2 : enemyWave - 1;
  const disengageChance = Math.max(30, Math.min(95, Math.round(50 + (allyPower - enemyPower) * .09 + (1 - enemyHpRatio) * 25 - (1 - allyHpRatio) * 14 - zone * 5 + (activeRole("侦察员") ? 14 : 0) + (kit.tactical === "烟雾弹" ? 22 : 0))));
  const injuredCrew = crew.filter(person => person.injury);
  const repairTotal = Object.values(repair).reduce((a, b) => a + b, 0);
  const repairPercent = Math.min(100, Math.round(repairTotal / 50 * 100));
  const miningRate = (Object.values(installed).flat() as PackedLoot[]).reduce((sum, item) => sum + miningYield(item), 0);
  const miningOnline = installed.CPU.length > 0 && installed.GPU.length > 0 && installed.内存.length > 0;
  const hasSearchCaptain = activeRole("搜救队长");
  const hasMarketLiaison = activeRole("黑市联络员");
  const searchDevices = objectStash.filter(item => item.name === "搜救仪").length;
  const crimsonTerminal = objectStash.find(item => item.name === "绯红邀约终端");
  const plannedPlace = locations.find(place => place.id === plannedPlaceId) ?? locations[0];
  const actionCrew = expedition.map(id => crew.find(person => person.id === id)).filter(Boolean) as Crew[];
  const actionCrewReady = actionCrew.length === 3 && actionCrew.every(person => !person.injury);
  const actionAttack = actionCrew.reduce((sum, person) => sum + person.attack, 0) + selectedGear("weapon").stat * 3;
  const actionDefense = actionCrew.reduce((sum, person) => sum + person.defense, 0) + (selectedGear("armor").stat + selectedGear("helmet").stat) * 3;
  const operationRiskLabel = plannedPlace.level >= 8 ? "极高" : plannedPlace.level >= 6 ? "高" : plannedPlace.level >= 4 ? "中等" : "较低";
  const currentStorage = warehouseTab === "装备柜" ? equipmentStash : warehouseTab === "冰箱" ? survivalStash : objectStash;
  const activeContract = mysteryContracts.find(contract => contract.id === mysteryContractId) ?? campaignContract(contractMainIndex);
  const contractSubmitItem = activeContract.submitItemName ? [...equipmentStash, ...survivalStash, ...objectStash].find(item => item.name === activeContract.submitItemName) : undefined;
  const allStoredItems = [...equipmentStash, ...survivalStash, ...objectStash];
  const storedCount = (name: string) => allStoredItems.filter(item => item.name === name).length;
  const companionTradeReady = companionTradeRequirements.length > 0 && companionTradeRequirements.every(request => storedCount(request.name) >= request.quantity);
  const companionTradeRefreshReady = day >= companionTradeNextRefreshDay;
  const companionTradeRefreshRounds = Math.max(0, companionTradeNextRefreshDay - day);
  const contractsUntilSignal = 5 - (contractMainIndex % 5);
  const selectedHardwareKind = selectedStorageItem ? hardwareKind(selectedStorageItem.name) : null;
  const selectedHardwareFull = selectedHardwareKind ? installed[selectedHardwareKind].length >= ({ CPU: 2, GPU: 8, 内存: 5 }[selectedHardwareKind]) : false;
  const riskBreakdown = [
    { name: "区域深度", value: zone * 12 }, { name: "搜索动作", value: searchedCount * 5 },
    { name: "停留时间", value: Math.round(searchSeconds * 1.4) }, { name: "AI接近", value: ai.status === "搜索中" && ai.zone === zone ? 12 : 0 },
    { name: "职业减免", value: -(activeRole("侦察员") ? 5 : 0) - (activeRole("狙击手") ? 3 : 0) },
  ];

  useEffect(() => {
    const startFreshGame = () => {
      const startingCrew = generateStartingCrew();
      setCrew(startingCrew);
      setSelectedCrew(startingCrew[0]?.id ?? 0);
      setExpedition(startingCrew.map(person => person.id));
      setSeatAssignments(assignCrewToStations(startingCrew));
      setObjectStash([createStarterCrimsonTerminal()]);
      setSeenItems(["绯红邀约终端"]);
      setCollectedItems(["绯红邀约终端"]);
    };
    try {
      const raw = window.localStorage.getItem(LOCAL_SAVE_KEY);
      if (!raw) { startFreshGame(); return; }
      const saved = JSON.parse(raw) as GameSave;
      if (![1, 2, 3].includes(saved.version) || !saved.state || !Array.isArray(saved.state.crew) || !Number.isFinite(saved.state.day)) { startFreshGame(); return; }
      const state = saved.state;
      const shouldGrantLegacyStarter = saved.version === 1 && !state.companionUnlocked && !state.objectStash.some(item => item.name === "绯红邀约终端");
      const restoredObjectStash = shouldGrantLegacyStarter ? repack([...state.objectStash, createStarterCrimsonTerminal()]) : state.objectStash;
      const restoredCrew = state.crew.map((person, index) => normalizeCrewCombat(person, index));
      const injuredIds = new Set(restoredCrew.filter(person => person.injury).map(person => person.id));
      setTab(state.tab); setMode(state.mode); setDay(state.day); setCrew(restoredCrew); setSelectedCrew(state.selectedCrew);
      setExpedition(state.expedition.filter(id => !injuredIds.has(id))); setSeatAssignments(state.seatAssignments); setSatiety(state.satiety); setTeamHealth(state.teamHealth);
      setResources(state.resources); setRepair(state.repair); setUpgrades(state.upgrades); setKit(state.kit); setOwnedEquipment(state.ownedEquipment); setPlannedPlaceId(state.plannedPlaceId ?? state.activePlace?.id ?? 1);
      const restoredPlace = state.activePlace ? locations.find(place => place.id === state.activePlace?.id) ?? state.activePlace : null;
      setActivePlace(restoredPlace); setLocationEscapes(state.locationEscapes ?? {}); setRaidSeed(state.raidSeed); setZone(state.zone); setRoomIndex(state.roomIndex ?? 0); setSafeRemaining(state.safeRemaining ?? 0); setOvertime(state.overtime ?? 0); setEscapeProtection(state.escapeProtection ?? 0); setFieldLoot(state.fieldLoot); setRisk(state.risk);
      setLogs(state.logs); setSearchedCount(state.searchedCount); setSearchSeconds(state.searchSeconds); setPackedBag(state.packedBag); setSafeLoot(state.safeLoot);
      setAi(state.ai); setSelectedExit(state.selectedExit); setRoundOutcome(state.roundOutcome); setSurvivorCandidates((state.survivorCandidates ?? []).map((person, index) => normalizeCrewCombat(person, index))); setRaidParty(state.raidParty ?? []); setEnemyParty(state.enemyParty ?? []); setEnemyLoot(state.enemyLoot ?? []); setEnemyDefeated(state.enemyDefeated ?? false); setEnemyWave(state.enemyWave ?? (state.enemyDefeated ? 2 : 1)); setBattleLogs(state.battleLogs ?? []);
      setRelationshipRoster(state.relationshipRoster); setRelationshipCandidate(state.relationshipCandidate); setRelationshipAssignments(state.relationshipAssignments);
      setCompanionUnlocked(state.companionUnlocked); setRelationshipContacts(state.relationshipContacts); setExclusiveLoadout(state.exclusiveLoadout);
      setEquipmentStash(state.equipmentStash); setSurvivalStash(state.survivalStash); setObjectStash(restoredObjectStash); setInstalled(state.installed);
      setMiningProgress(state.miningProgress); setCoins(state.coins); setMarketOffers(state.marketOffers); setSeenItems(shouldGrantLegacyStarter ? Array.from(new Set([...state.seenItems, "绯红邀约终端"])) : state.seenItems); setCollectedItems(shouldGrantLegacyStarter ? Array.from(new Set([...state.collectedItems, "绯红邀约终端"])) : state.collectedItems);
      setContractMainIndex(state.contractMainIndex ?? 0); setMysteryContractId(state.mysteryContractId ?? null); setContractProgress(state.contractProgress ?? 0); setContractCompletionNote(state.contractCompletionNote ?? "");
      const restoredTradeCycle = state.companionTradeCycle ?? Math.floor((state.day - 1) / 2);
      setCompanionTradeCycle(restoredTradeCycle); setCompanionTradeRequirements(state.companionTradeRequirements?.length ? state.companionTradeRequirements : generateCompanionTradeRequirements(restoredTradeCycle));
      setCompanionTradeNextRefreshDay(state.companionTradeNextRefreshDay ?? state.day);
      setEndingUnlocked(state.endingUnlocked ?? false); setEndingLegendaryCandidates(state.endingLegendaryCandidates ?? []); setEndingCompanionCandidates(state.endingCompanionCandidates ?? []); setEndingLegendaryClaimed(state.endingLegendaryClaimed ?? false); setEndingCompanionClaimed(state.endingCompanionClaimed ?? false);
      setSearchingId(null); setSearchProgress(0); setDraggedLoot(null); setBattle(false); setAmbushWarning(null); setExtracting(0); setSelectedRaidItem(null);
    } catch {
      // 损坏或旧格式的存档不会阻止游戏启动；下一次有效状态变化会覆盖它。
      startFreshGame();
    } finally {
      setSaveReady(true);
    }
  }, []);

  useEffect(() => {
    if (!saveReady) return;
    const save: GameSave = {
      version: 3,
      savedAt: Date.now(),
      state: {
        tab, mode, day, crew, selectedCrew, expedition, seatAssignments, satiety, teamHealth, resources, repair, upgrades, kit, ownedEquipment, plannedPlaceId,
        activePlace, locationEscapes, raidSeed, zone, roomIndex, safeRemaining, overtime, escapeProtection, fieldLoot, risk, logs, searchedCount, searchSeconds, packedBag, safeLoot, ai, selectedExit, roundOutcome,
        survivorCandidates, raidParty, enemyParty, enemyLoot, enemyDefeated, enemyWave, battleLogs, relationshipRoster, relationshipCandidate, relationshipAssignments, companionUnlocked, relationshipContacts,
        exclusiveLoadout, equipmentStash, survivalStash, objectStash, installed, miningProgress, coins, marketOffers, seenItems, collectedItems,
        contractMainIndex, mysteryContractId, contractProgress, contractCompletionNote, companionTradeRequirements, companionTradeCycle, companionTradeNextRefreshDay,
        endingUnlocked, endingLegendaryCandidates, endingCompanionCandidates, endingLegendaryClaimed, endingCompanionClaimed,
      },
    };
    try { window.localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(save)); } catch { /* 浏览器禁用或空间不足时保持当前内存进度。 */ }
  }, [saveReady, tab, mode, day, crew, selectedCrew, expedition, seatAssignments, satiety, teamHealth, resources, repair, upgrades, kit, ownedEquipment, plannedPlaceId, activePlace, locationEscapes, raidSeed, zone, roomIndex, safeRemaining, overtime, escapeProtection, fieldLoot, risk, logs, searchedCount, searchSeconds, packedBag, safeLoot, ai, selectedExit, roundOutcome, survivorCandidates, raidParty, enemyParty, enemyLoot, enemyDefeated, enemyWave, battleLogs, relationshipRoster, relationshipCandidate, relationshipAssignments, companionUnlocked, relationshipContacts, exclusiveLoadout, equipmentStash, survivalStash, objectStash, installed, miningProgress, coins, marketOffers, seenItems, collectedItems, contractMainIndex, mysteryContractId, contractProgress, contractCompletionNote, companionTradeRequirements, companionTradeCycle, companionTradeNextRefreshDay, endingUnlocked, endingLegendaryCandidates, endingCompanionCandidates, endingLegendaryClaimed, endingCompanionClaimed]);

  function completeActiveContract() {
    if (contractProgress < activeContract.target) return;
    grantContractRewards(activeContract);
    setContractCompletionNote(`已完成「${activeContract.mystery ? "来自神秘信号的委托" : activeContract.title}」· 获得 ${contractRewardSummary(activeContract)}`);
    setContractProgress(0);
    if (activeContract.mystery) {
      setMysteryContractId(null);
      return;
    }
    const nextMainIndex = contractMainIndex + 1;
    setContractMainIndex(nextMainIndex);
    if (nextMainIndex % 5 === 0) {
      const signalIndex = Math.floor(Math.random() * mysteryContracts.length);
      setMysteryContractId(mysteryContracts[signalIndex].id);
    }
  }

  useEffect(() => {
    if (!saveReady || repairPercent < 100 || endingUnlocked) return;
    const ownedCrew = new Set(crew.map(person => person.name));
    const legendaryPool = allPersonnelCatalog.filter(person => person.quality === "传奇" && !ownedCrew.has(person.name));
    const legendaryChoices = [...(legendaryPool.length >= 3 ? legendaryPool : allPersonnelCatalog.filter(person => person.quality === "传奇"))]
      .sort((a, b) => seeded(day * 991 + a.id * 13) - seeded(day * 991 + b.id * 13)).slice(0, 3);
    const ownedCompanions = new Set(relationshipRoster.map(person => person.name));
    const companionPool = allRelationshipCatalog.filter(person => !ownedCompanions.has(person.name));
    const companionChoices = [...(companionPool.length >= 3 ? companionPool : allRelationshipCatalog)]
      .sort((a, b) => seeded(day * 577 + a.id * 17) - seeded(day * 577 + b.id * 17)).slice(0, 3);
    setEndingLegendaryCandidates(legendaryChoices); setEndingCompanionCandidates(companionChoices); setEndingUnlocked(true); setEndingOpen(true);
  }, [saveReady, repairPercent, endingUnlocked, day, crew, relationshipRoster]);

  function createContractRewardItem(name: string, offset: number): PackedLoot | null {
    const template = [...fieldLootTemplates, ...legendaryRelics].find(item => item.name === name);
    if (!template) return null;
    return { ...template, id: Date.now() + offset + Math.floor(Math.random() * 1000), x: 0, y: 0, revealed: true, moved: true, px: 0, py: 0 } as PackedLoot;
  }

  function grantContractRewards(contract: ContractDefinition) {
    contract.rewards.forEach((reward, index) => {
      if (reward.kind === "currency") { setResources(prev => ({ ...prev, 货币: prev.货币 + (reward.amount ?? 0) })); return; }
      if (reward.kind === "coins") { setCoins(value => value + (reward.amount ?? 0)); return; }
      if (!reward.itemName) return;
      const item = createContractRewardItem(reward.itemName, index * 1777);
      if (!item) return;
      const kind = storeKind(item);
      if (kind === "装备柜") {
        setEquipmentStash(prev => repack([...prev, item]));
        if (item.type === "装备") setOwnedEquipment(prev => Array.from(new Set([...prev, item.name])));
      } else if (kind === "冰箱") setSurvivalStash(prev => repack([...prev, item]));
      else setObjectStash(prev => repack([...prev, item]));
      setSeenItems(prev => Array.from(new Set([...prev, item.name])));
      setCollectedItems(prev => Array.from(new Set([...prev, item.name])));
    });
  }

  function advanceContract(metric: ContractMetric, amount = 1) {
    if (activeContract.metric !== metric || amount <= 0) return;
    setContractProgress(value => Math.min(activeContract.target, value + amount));
  }

  useEffect(() => {
    if (!saveReady || mode !== "explore" || !activePlace) return;
    if (raidParty.length === 0) setRaidParty(buildRaidParty());
    if (!enemyDefeated && enemyParty.length === 0) setEnemyParty(generateEnemyParty(activePlace, day, raidSeed, enemyWave));
    if (!enemyDefeated && enemyLoot.length === 0) setEnemyLoot(generateEnemyLoot(activePlace, day, enemyWave));
    if (safeRemaining === 0 && overtime === 0) setSafeRemaining(roomSafeTime(zone));
  }, [saveReady]);

  useEffect(() => {
    if (searchingId === null) return;
    const item = fieldLoot.find(entry => entry.id === searchingId);
    if (!item) return;
    const duration = item.searchSeconds * (kit.tactical === "简易照明棒" ? .92 : 1);
    const started = Date.now();
    setSearchProgress(0);
    const timer = window.setInterval(() => {
      const elapsed = (Date.now() - started) / 1000;
      setSearchProgress(Math.min(100, elapsed / duration * 100));
      if (elapsed < duration) return;
      window.clearInterval(timer);
      setFieldLoot(prev => prev.map(entry => entry.id === item.id ? { ...entry, revealed: true } : entry));
      setSearchingId(null); setSearchProgress(100); setSeenItems(prev => Array.from(new Set([...prev, item.name])));
      const nextSearch = searchedCount + 1; setSearchedCount(nextSearch); setSearchSeconds(total => total + duration);
      advanceContract("searched"); if (zone === 2) advanceContract("coreSearches");
      const nextRisk = Math.min(98, risk + Math.max(2, Math.round(duration * 1.7 + nextSearch * 1.8 + 2 + zone * 3 - (activeRole("侦察员") ? 3 : 0) - exclusiveEffect("risk"))));
      setRisk(nextRisk); setLogs(prev => [`搜索完成：${gradeNames[item.grade]}「${item.name}」；${purpose(item)}。`, ...prev].slice(0, 6));
      const aiSearched = ai.searched + 1;
      setAi(prev => ({ ...prev, zone, searched: aiSearched, value: prev.value + 250 + zone * 280, signal: enemyDefeated ? "敌方队伍已经被清除" : "对方也在本区域积累战利品" }));
      if (survivorCandidates.length === 0 && zone === 2 && nextSearch >= 3 && item.id % 3 === 0) {
        const found = generateSurvivorCandidates(crew.map(person => person.name));
        if (found.length) { setSurvivorCandidates(found); setLogs(prev => [`发现${found.length}名幸存者的求救信号；撤离后只能邀请其中一人。`, ...prev].slice(0, 6)); }
      }
      const midnightEncounter = seeded(raidSeed * .83 + item.id * 1.13 + nextSearch * 97);
      if (!relationshipCandidate && zone === 2 && nextSearch >= 4 && midnightEncounter < .005) {
        const found = pickRelationship(raidSeed + item.id + day * 211, relationshipRoster.map(person => person.name));
        if (found) { setRelationshipCandidate(found); setLogs(prev => [`极罕见邂逅：无线电里传来一段私人频道邀请，署名「${found.name}」。`, ...prev].slice(0, 6)); }
      }
      const lootAmbush = seeded(raidSeed * 1.37 + item.id * 2.11 + nextSearch * 193) < .05;
      if (!enemyDefeated && lootAmbush) warnLootAmbush(item.name);
    }, 80);
    return () => window.clearInterval(timer);
  }, [searchingId]);

  useEffect(() => {
    if (!ambushWarning) return;
    const timer = window.setTimeout(() => {
      const trigger = ambushWarning.trigger;
      setAmbushWarning(null);
      beginCombat(trigger);
    }, 2000);
    return () => window.clearTimeout(timer);
  }, [ambushWarning]);

  useEffect(() => {
    if (extracting <= 0) return;
    const timer = window.setTimeout(() => extracting === 1 ? resolveExtraction() : setExtracting(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [extracting]);

  useEffect(() => {
    if (mode !== "explore" || !activePlace || battle || ambushWarning || enemyDefeated) return;
    const timer = window.setTimeout(() => {
      // The final countdown second is the finish line, not another hidden failure roll.
      if (extracting === 1) return;
      if (escapeProtection > 0) { setEscapeProtection(value => Math.max(0, value - 1)); return; }
      if (safeRemaining > 0) { setSafeRemaining(value => Math.max(0, value - 1)); return; }
      const next = overtime + 1;
      setOvertime(next);
      if (next % 3 === 0) {
        const chance = Math.min(80, 20 + next);
        if (Math.random() * 100 < chance) beginCombat();
        else setLogs(prev => [`暴露检定未触发：当前遇敌率 ${chance}%，下一次检定在3秒后。`, ...prev].slice(0, 6));
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [mode, activePlace, battle, ambushWarning, enemyDefeated, safeRemaining, overtime, escapeProtection, extracting]);

  useEffect(() => {
    if (!battle) return;
    if (!raidParty.some(unit => unit.hp > 0)) { resolvePartyWipe(); return; }
    if (!enemyParty.some(unit => unit.hp > 0)) { resolveBattleVictory(); return; }
    const timer = window.setTimeout(() => {
      const nextEnemies = enemyParty.map(unit => ({ ...unit }));
      const nextAllies = raidParty.map(unit => ({ ...unit }));
      const events: string[] = [];
      const livingAllies = raidParty.filter(unit => unit.hp > 0);
      const livingEnemies = enemyParty.filter(unit => unit.hp > 0);
      const damageFor = (attacker: CombatUnit, target: CombatUnit) => Math.max(1, Math.min(105, Math.round(4 + attacker.attack * (.38 + Math.random() * .1) - target.defense * .18)));
      livingAllies.forEach((attacker, index) => {
        const targets = nextEnemies.filter(unit => unit.hp > 0); const target = targets[index % targets.length]; if (!target) return;
        const damage = damageFor(attacker, target);
        target.hp = Math.max(0, target.hp - damage); events.push(`${attacker.name}命中${target.name}，造成${damage}伤害${target.hp === 0 ? "并将其击倒" : ""}`);
      });
      // 双方以回合开始时的存活名单同时出手，避免我方先手击倒后让敌人无条件少打一轮。
      livingEnemies.forEach((attacker, index) => {
        const targets = nextAllies.filter(unit => unit.hp > 0); const target = targets[index % targets.length]; if (!target) return;
        const damage = damageFor(attacker, target);
        target.hp = Math.max(0, target.hp - damage); events.push(`${attacker.name}反击${target.name}，造成${damage}伤害${target.hp === 0 ? "并将其击倒" : ""}`);
      });
      if (activeRole("医疗员")) {
        const patient = [...nextAllies].filter(unit => unit.hp > 0 && unit.hp < unit.maxHp).sort((a, b) => a.hp - b.hp)[0];
        if (patient) { patient.hp = Math.min(patient.maxHp, patient.hp + 2); events.push(`医疗支援为${patient.name}恢复2点生命`); }
      }
      setRaidParty(nextAllies); setEnemyParty(nextEnemies); setEscapeCooldown(value => Math.max(0, value - 1));
      setBattleLogs(prev => [...events, ...prev].slice(0, 12));
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [battle, raidParty, enemyParty]);

  function startRun() { setMode("prep"); }
  function openCrewModal(slot = 0) {
    setCrewModalSlot(Math.max(0, Math.min(2, slot)));
    setCrewModalOpen(true);
  }
  function assignExpeditionSlot(id: number) {
    const person = crew.find(member => member.id === id);
    if (!person || person.injury) return;
    setExpedition(prev => {
      const next = [...prev];
      const existingIndex = next.indexOf(id);
      if (existingIndex === crewModalSlot) return prev;
      if (existingIndex >= 0) {
        const displaced = next[crewModalSlot];
        next[crewModalSlot] = id;
        if (displaced !== undefined) next[existingIndex] = displaced;
      } else if (crewModalSlot < next.length) next[crewModalSlot] = id;
      else next.push(id);
      return next.filter((memberId, index, all) => all.indexOf(memberId) === index).slice(0, 3);
    });
  }
  function resetLocalGame() {
    if (!resetArmed) { setResetArmed(true); return; }
    window.localStorage.removeItem(LOCAL_SAVE_KEY); window.location.reload();
  }
  function buildRaidParty(): CombatUnit[] {
    const weaponBuff = selectedGear("weapon").stat;
    const defenseBuff = selectedGear("armor").stat + selectedGear("helmet").stat;
    return expedition.map(id => crew.find(person => person.id === id)).filter(Boolean).map(person => {
      const member = person as Crew;
      const attack = member.attack + weaponBuff + (member.role === "突击手" ? 4 : member.role === "狙击手" ? 6 : 0);
      const defense = member.defense + defenseBuff;
      const maxHp = Math.round(72 + defense * .48);
      return { id: member.id, name: member.name, role: member.role, attack, defense, maxHp, hp: maxHp };
    });
  }

  function enterRoom(nextRoom: number, reason = "继续推进") {
    if (!activePlace || nextRoom < 0 || nextRoom >= roomZones.length) return;
    const nextZone = roomZones[nextRoom];
    setRoomIndex(nextRoom); setZone(nextZone); setSafeRemaining(roomSafeTime(nextZone)); setOvertime(0);
    setFieldLoot(generateField(activePlace.id, day, nextZone, raidSeed + nextRoom * 7919, nextRoom));
    setAi(prev => ({ ...prev, zone: nextZone, signal: enemyDefeated ? "敌方队伍已经被清除" : "敌方队伍也进入了这间房" }));
    setRisk(value => Math.min(98, value + (nextRoom ? 5 + nextZone * 3 : 0)));
    setLogs(prev => [`${reason}：进入${roomNames[nextRoom]}，获得 ${roomSafeTime(nextZone)} 秒安全搜索时间。`, ...prev].slice(0, 6));
  }

  function beginCombat(trigger?: string) {
    if (battle || enemyDefeated || !enemyParty.some(unit => unit.hp > 0)) return;
    const interruptedExit = extracting > 0 ? `${selectedExit}倒计时剩余${extracting}秒时被敌队截停。` : null;
    const encounterLog = interruptedExit ?? trigger ?? `暴露检定触发：第${enemyWave}支拾荒者小队在${roomNames[roomIndex]}发现了你们。`;
    setExtracting(0); setSearchingId(null); setSearchProgress(0); setSelectedRaidItem(null); setAmbushWarning(null); setBattle(true); setEscapeCooldown(5);
    setBattleLogs([encounterLog]);
    if (interruptedExit) setRoundOutcome(prev => [interruptedExit, ...prev]);
    setLogs(prev => [encounterLog, `遭遇第${enemyWave}/2支敌方三人小队；双方生命会保留到下一次接触。`, ...prev].slice(0, 6));
  }

  function warnLootAmbush(itemName: string) {
    if (battle || ambushWarning || enemyDefeated || !enemyParty.some(unit => unit.hp > 0)) return;
    const trigger = `物资伏击：搜索「${itemName}」时发现敌人，短暂警戒后双方开火。`;
    setExtracting(0); setSelectedRaidItem(null); setAmbushWarning({ itemName, trigger });
    setAi(prev => ({ ...prev, status: "搜索中", signal: `「${itemName}」附近侦测到敌方活动` }));
    setLogs(prev => [`危险信号：搜索「${itemName}」时发现近距离敌人，2秒后进入战斗。`, ...prev].slice(0, 6));
  }

  function resolveBattleVictory() {
    advanceContract("squads");
    if (enemyWave === 1 && activePlace) {
      const secondParty = generateEnemyParty(activePlace, day, raidSeed, 2);
      const secondLoot = generateEnemyLoot(activePlace, day, 2);
      setBattle(false); setEnemyWave(2); setEnemyParty(secondParty); setEnemyLoot(prev => [...prev, ...secondLoot]); setEscapeCooldown(0);
      setAi(prev => ({ ...prev, status: "搜索中", signal: "第一队已经失联，第二支强化小队仍在区域内搜索" }));
      setLogs(prev => [`第一支敌队已击破：返回当前房间继续搜刮。安全时间与暴露进度不会重置，第二队须等待后续遇敌检定。`, ...prev].slice(0, 6));
      setBattleLogs(prev => [`第一支敌队已全员倒地；交火暂时结束。`, ...prev].slice(0, 12));
      setRoundOutcome(prev => [`击破第1/2支拾荒者小队，第二队仍在区域内活动`, ...prev]);
      return;
    }
    setBattle(false); setEnemyDefeated(true); setEscapeCooldown(0);
    setAi(prev => ({ ...prev, status: "被击退", signal: "两支敌队全部倒地，战局中不再有其他搜索者" }));
    setLogs(prev => [`两支敌队全部倒地：已控制双方背包，此后房间不再进行遇敌检定。`, ...prev].slice(0, 6));
    setRoundOutcome(prev => [`击败全部2支拾荒者小队，可检索双方装备与背包`, ...prev]);
  }

  function resolvePartyWipe() {
    if (!activePlace) return;
    const enemyHealth = enemyParty.reduce((sum, unit) => sum + unit.hp, 0) / Math.max(1, enemyParty.reduce((sum, unit) => sum + unit.maxHp, 0));
    const powerGap = Math.max(0, enemyPower - allyPower);
    const injuryChance = Math.max(18, Math.min(82, Math.round([28, 38, 50][zone] + enemyHealth * 22 + powerGap * .04 - selectedGear("armor").stat * .25 - selectedGear("helmet").stat * .55 - (activeRole("医疗员") ? 6 : 0) - exclusiveEffect("fatal"))));
    const healthyCount = crew.filter(person => !person.injury).length;
    const maxNewInjuries = Math.max(0, healthyCount - 3);
    const rolledInjuries = expedition.filter(id => !crew.find(person => person.id === id)?.injury && Math.random() * 100 < injuryChance);
    const injuries = (rolledInjuries.length ? rolledInjuries : maxNewInjuries > 0 ? [expedition[Math.floor(Math.random() * expedition.length)]] : []).slice(0, maxNewInjuries);
    const severityByZone = [["软组织挫伤", "轻度骨裂"], ["贯穿伤", "复合骨折"], ["严重枪伤", "感染性创伤"]][zone];
    const lostEquipment = Object.values(kit).filter(name => name !== "无装备");
    setCrew(prev => prev.map(person => injuries.includes(person.id) ? { ...person, stamina: Math.min(person.stamina, 20), health: "受伤", injury: { severity: severityByZone[Math.floor(Math.random() * severityByZone.length)], treatment: 0, required: 100 } } : expedition.includes(person.id) ? { ...person, stamina: Math.min(person.stamina, 25) } : person));
    setExpedition(prev => prev.filter(id => !injuries.includes(id)));
    setOwnedEquipment(prev => prev.filter(name => !lostEquipment.includes(name)));
    setEquipmentStash(prev => { const pending = [...lostEquipment]; return repack(prev.filter(item => { const index = pending.indexOf(item.name); if (index < 0) return true; pending.splice(index, 1); return false; })); });
    setKit({ weapon: "无装备", backpack: "无装备", armor: "无装备", helmet: "无装备", tactical: "无装备" });
    setPackedBag([]); setBattle(false); setAi(prev => ({ ...prev, status: "已撤离", signal: "敌方带走了行动组的装备和背包" }));
    setRoundOutcome([`撤离失败原因：三人行动组全部被击倒`, `背包与出战装备全部遗失；保险箱保留`, injuries.length ? `伤病判定 ${injuryChance}%：${injuries.map(id => crew.find(person => person.id === id)?.name).join("、")}进入治疗名单，不会永久死亡` : `伤病判定 ${injuryChance}%：紧急医疗组完成稳定，无新增长期伤病`]);
    setMode("result");
  }

  function attemptDisengage() {
    if (!battle || escapeCooldown > 0) return;
    if (Math.random() * 100 >= disengageChance) { setEscapeCooldown(5); setBattleLogs(prev => [`脱离失败（${disengageChance}%），交火继续。`, ...prev].slice(0, 12)); return; }
    setBattle(false); setEscapeCooldown(0); setEscapeProtection(8);
    if (roomIndex >= roomZones.length - 1) {
      setBattleLogs(prev => [`脱离成功（${disengageChance}%），获得8秒拉开距离保护并冲向紧急出口。`, ...prev]);
      setLogs(prev => [`核心交火脱离成功：8秒内不会再次遇敌，紧急撤离倒计时结束即成功。`, ...prev].slice(0, 6));
      setSelectedExit("紧急撤离"); setExtracting(extractionDuration("紧急撤离")); return;
    }
    enterRoom(roomIndex + 1, `脱离成功（${disengageChance}%），双方带伤转移`);
  }

  function takeEnemyLoot(item: PackedLoot) {
    const fit = firstFit(packedBag, item.w, item.h, bagCols, bagRows);
    if (!fit) { setLogs(prev => [`背包没有足够空间容纳敌方战利品「${item.name}」。`, ...prev].slice(0, 6)); return; }
    setPackedBag(prev => [...prev, { ...item, ...fit }]); setEnemyLoot(prev => prev.filter(entry => entry.id !== item.id));
    setLogs(prev => [`从敌方背包取走「${item.name}」。`, ...prev].slice(0, 6));
  }

  function confirmPreparation() {
    if (expedition.length !== 3 || expedition.some(id => crew.find(person => person.id === id)?.injury)) return;
    const nextSeed = Math.floor(Math.random() * 1_000_000_000);
    const firstSafe = roomSafeTime(0, plannedPlace);
    setMode("explore"); setRaidSeed(nextSeed); setActivePlace(plannedPlace); setZone(0); setRoomIndex(0); setSafeRemaining(firstSafe); setOvertime(0); setEscapeProtection(0); setRisk(Math.min(95, 5 + plannedPlace.level * 4)); setPackedBag([]); setSafeLoot([]); setFieldLoot(generateField(plannedPlace.id, day, 0, nextSeed, 0)); setSearchedCount(0); setSearchSeconds(0); setSearchingId(null); setSelectedRaidItem(null); setBattle(false); setAmbushWarning(null); setRaidParty(buildRaidParty()); setEnemyParty(generateEnemyParty(plannedPlace, day, nextSeed, 1)); setEnemyLoot(generateEnemyLoot(plannedPlace, day, 1)); setEnemyDefeated(false); setEnemyWave(1); setBattleLogs([]); setSurvivorCandidates([]); setRoundOutcome([]); setExtracting(0);
    setAi({ zone: 0, searched: 0, value: 0, status: "搜索中", signal: "无线电捕捉到两支队伍交替通联" });
    setLogs([`装备检查完毕，三人行动组抵达${plannedPlace.name}；安全搜索时间 ${firstSafe} 秒。`]);
  }
  function enterPlace(place: Place) { if (place.id > 1 && (locationEscapes[place.id - 1] ?? 0) < 2) return; const firstSafe = roomSafeTime(0, place); setActivePlace(place); setRoomIndex(0); setZone(0); setSafeRemaining(firstSafe); setOvertime(0); setFieldLoot(generateField(place.id, day, 0, raidSeed, 0)); setRaidParty(current => current.length ? current : buildRaidParty()); setEnemyWave(1); setEnemyParty(generateEnemyParty(place, day, raidSeed, 1)); setEnemyLoot(generateEnemyLoot(place, day, 1)); setEnemyDefeated(false); setRisk(Math.min(95, 5 + place.level * 4)); setLogs([`进入${place.name}·${roomNames[0]}。本局存在2支敌队；安全搜索时间 ${firstSafe} 秒，每件物资另有5%伏击概率。`]); }
  function advanceRoom() { if (!activePlace || roomIndex >= roomZones.length - 1 || searchingId !== null || battle || ambushWarning) return; enterRoom(roomIndex + 1); }
  function beginSearch(id: number) { const item = fieldLoot.find(entry => entry.id === id); if (!item || item.revealed || item.moved || searchingId !== null || battle || ambushWarning || extracting > 0) return; setSearchingId(id); setLogs(prev => [`正在辨认一个 ${item.w}×${item.h} 的未知物品……`, ...prev].slice(0, 6)); }

  function moveLoot(target: "bag" | "safe") {
    if (!draggedLoot) return;
    const source = draggedLoot.source === "bag" ? packedBag : draggedLoot.source === "safe" ? safeLoot : fieldLoot;
    const item = source.find(entry => entry.id === draggedLoot.id);
    if (!item || !item.revealed) { setDraggedLoot(null); return; }
    if (target === "safe" && (item.w > 2 || item.h > 2)) { setLogs(prev => [`${item.name}放不进2×2保险箱。`, ...prev]); setDraggedLoot(null); return; }
    const destination = target === "bag" ? packedBag.filter(entry => entry.id !== item.id) : safeLoot.filter(entry => entry.id !== item.id);
    const fit = firstFit(destination, item.w, item.h, target === "bag" ? bagCols : 2, target === "bag" ? bagRows : 2);
    if (!fit) { setLogs(prev => [`${target === "bag" ? "背包" : "保险箱"}没有合法空位。`, ...prev]); setDraggedLoot(null); return; }
    setPackedBag(prev => prev.filter(entry => entry.id !== item.id)); setSafeLoot(prev => prev.filter(entry => entry.id !== item.id)); setFieldLoot(prev => prev.map(entry => entry.id === item.id ? { ...entry, moved: true } : entry));
    const packed = { ...item, ...fit } as PackedLoot;
    if (target === "bag") setPackedBag(prev => [...prev.filter(entry => entry.id !== item.id), packed]); else setSafeLoot(prev => [...prev.filter(entry => entry.id !== item.id), packed]);
    setDraggedLoot(null);
  }

  function useRaidItem(item: PackedLoot) {
    if (item.type !== "食物" && item.type !== "药品") return;
    if (item.type === "食物") setSatiety(value => Math.min(100, value + 7 + item.grade * 3));
    else {
      setTeamHealth(value => Math.min(100, value + 8 + item.grade * 4));
      setRaidParty(prev => { const next = prev.map(unit => ({ ...unit })); const patient = [...next].sort((a, b) => a.hp - b.hp)[0]; if (patient) patient.hp = Math.min(patient.maxHp, patient.hp + 12 + item.grade * 6); return next; });
    }
    setPackedBag(prev => repack(prev.filter(entry => entry.id !== item.id), bagCols, bagRows)); advanceContract("suppliesUsed");
    setLogs(prev => [`局内使用${item.name}，小队${item.type === "食物" ? "饱食度" : "健康"}得到恢复。`, ...prev]);
  }

  function discardRaidItem() {
    if (!selectedRaidItem || selectedRaidItem.source === "field") return;
    const { item, source } = selectedRaidItem;
    if (source === "bag") setPackedBag(prev => repack(prev.filter(entry => entry.id !== item.id), bagCols, bagRows));
    else setSafeLoot(prev => repack(prev.filter(entry => entry.id !== item.id), 2, 2));
    setLogs(prev => [`已丢弃${source === "bag" ? "背包" : "保险箱"}中的「${item.name}」，腾出 ${item.w * item.h} 格空间。`, ...prev].slice(0, 6));
    setSelectedRaidItem(null);
  }

  function useSelectedRaidItem() {
    if (!selectedRaidItem || selectedRaidItem.source !== "bag") return;
    useRaidItem(selectedRaidItem.item as PackedLoot);
    setSelectedRaidItem(null);
  }

  function startLootDrag(id: number, source: "field" | "bag" | "safe" | "enemy") {
    setDraggedLoot({ id, source });
  }

  function finishLootDrag() {
    window.setTimeout(() => setDraggedLoot(null), 0);
  }

  function openRaidItem(item: FieldLoot, source: "field" | "bag" | "safe") {
    setSelectedRaidItem({ item, source });
  }

  function unlockCache() {
    if (!activePlace || zone !== 2) return;
    const key = packedBag.find(item => item.type === "钥匙") ?? safeLoot.find(item => item.type === "钥匙");
    if (!key) { setLogs(prev => ["核心密室需要一把地点钥匙或红区安全卡。", ...prev]); return; }
    setPackedBag(prev => repack(prev.filter(item => item.id !== key.id), bagCols, bagRows)); setSafeLoot(prev => repack(prev.filter(item => item.id !== key.id), 2, 2));
    const rares = fieldLootTemplates.filter(item => item.grade >= 4); const rare = rares[(day + activePlace.id) % rares.length]; const bonus = { ...rare, id: day * 77777 + activePlace.id, x: 0, y: 0, revealed: true, moved: false } as FieldLoot;
    const fit = firstFit(packedBag, bonus.w, bonus.h, bagCols, bagRows); if (fit) setPackedBag(prev => [...prev, { ...bonus, ...fit }]);
    setRisk(value => Math.min(100, value + 14)); setLogs(prev => [`${key.name}打开了核心密室：发现${bonus.name}，但警报被触发。`, ...prev]);
  }

  function startExtraction(exit: ExitId) {
    if (searchingId !== null || extracting > 0) return;
    const allowed = exit === "原路撤离" || (exit === "维修通道" && zone >= 1 && (kit.tactical === "烟雾弹" || activeRole("侦察员"))) || (exit === "封锁线车库" && zone === 2 && [...packedBag, ...safeLoot].some(item => item.name === "红区安全卡"));
    if (!allowed) return;
    setSelectedExit(exit); setExtracting(extractionDuration(exit)); if (exit === "维修通道") setRisk(value => Math.min(100, value + 4));
  }

  function resolveExtraction() {
    setExtracting(0);
    if (selectedExit === "封锁线车库") { const card = [...packedBag, ...safeLoot].find(item => item.name === "红区安全卡"); if (card) { setPackedBag(prev => repack(prev.filter(item => item.id !== card.id), bagCols, bagRows)); setSafeLoot(prev => repack(prev.filter(item => item.id !== card.id), 2, 2)); } }
    setRoundOutcome(prev => [`${selectedExit}倒计时完成：行动组成功撤离`, ...prev]);
    setMode("result"); setBattle(false); setAmbushWarning(null);
  }

  function storeReturned(items: PackedLoot[]) {
    setEquipmentStash(prev => repack([...prev, ...items.filter(item => storeKind(item) === "装备柜")]));
    setSurvivalStash(prev => repack([...prev, ...items.filter(item => storeKind(item) === "冰箱")]));
    setObjectStash(prev => repack([...prev, ...items.filter(item => storeKind(item) === "存储柜")]));
  }

  function settleRun() {
    const returned = [...packedBag, ...safeLoot]; storeReturned(returned); setCollectedItems(prev => Array.from(new Set([...prev, ...returned.map(item => item.name)])));
    const extractionSucceeded = roundOutcome.some(line => line.includes("成功撤离"));
    if (extractionSucceeded && activePlace) {
      advanceContract("extractions");
      advanceContract("recoverFood", returned.filter(item => item.type === "食物").length);
      advanceContract("recoverEquipment", returned.filter(item => item.type === "装备").length);
      advanceContract("rareRecovered", returned.filter(item => item.grade >= 5).length);
      const nextClears = (locationEscapes[activePlace.id] ?? 0) + 1;
      setLocationEscapes(prev => ({ ...prev, [activePlace.id]: nextClears }));
      if (nextClears >= 2 && activePlace.id < locations.length) setPlannedPlaceId(activePlace.id + 1);
    }
    const foundGear = returned.filter(item => item.type === "装备").map(item => item.name); setOwnedEquipment(prev => Array.from(new Set([...prev, ...foundGear])));
    const relicRecovery = exclusiveEffect("recovery");
    const companionPower = relationshipQualityPower("伴侣");
    const nextSatiety = Math.max(0, satiety - 10 + (activeRole("厨师") ? 4 : 0) + companionPower + relicRecovery); setSatiety(nextSatiety); setTeamHealth(value => Math.min(100, Math.max(0, value + (activeRole("医疗员") ? 3 : 0) + companionPower * 2 + relicRecovery - (nextSatiety < 25 ? 8 : 0))));
    if (miningOnline) { const total = miningProgress + miningRate; const mined = Math.floor(total); setMiningProgress(total - mined); if (mined) setCoins(value => value + mined); }
    setCrew(prev => prev.map(member => ({ ...member, stamina: Math.min(100, member.stamina + (expedition.includes(member.id) ? 18 : 30)), score: expedition.includes(member.id) && member.score < member.potential ? member.score + 1 : member.score })));
    const nextDay = day + 1; setDay(nextDay); if (nextDay % 2 === 0) setMarketOffers(generateMarket(nextDay));
    setMode("base"); setTab("房车"); setPackedBag([]); setSafeLoot([]);
  }

  function moveCrewToSeat(crewId: number, target: number) { setSeatAssignments(prev => { const next = [...prev]; const source = next.findIndex(id => id === crewId); if (source < 0 || source === target) return prev; const occupant = next[target]; next[target] = crewId; next[source] = occupant; return next; }); setDraggedCrew(null); setDraggedOverSeat(null); setSelectedCrew(crewId); }
  function dismissCrew(person: Crew) {
    if (crew.filter(member => member.id !== person.id && !member.injury).length < 3) return;
    const relic = exclusiveLoadout[person.id];
    if (relic) { setEquipmentStash(prev => repack([...prev, relic])); setExclusiveLoadout(prev => { const next = { ...prev }; delete next[person.id]; return next; }); }
    const remaining = crew.filter(member => member.id !== person.id);
    setCrew(remaining); setExpedition(prev => prev.filter(id => id !== person.id)); setSeatAssignments(prev => prev.map(id => id === person.id ? null : id));
    setSelectedCrew(remaining[0]?.id ?? 0); setSelectedAtlasPerson(null);
  }
  function repairPart(name: keyof typeof repair) {
    if (repair[name] >= 10) return;
    const required = repairMaterialTracks[name][repair[name]];
    const item = [...equipmentStash, ...survivalStash, ...objectStash].find(entry => entry.name === required);
    if (!item) return;
    removeStoredItem(item); setRepair(prev => ({ ...prev, [name]: prev[name] + 1 })); advanceContract("repairs");
  }
  function upgradeRv(name: keyof typeof upgrades) {
    if (upgrades[name] >= 3) return;
    const required = upgradeMaterialTracks[name][upgrades[name]];
    const item = [...equipmentStash, ...survivalStash, ...objectStash].find(entry => entry.name === required);
    if (!item) return;
    removeStoredItem(item); setUpgrades(prev => ({ ...prev, [name]: prev[name] + 1 }));
  }

  function removeStoredItem(item: PackedLoot) {
    const kind = storeKind(item);
    if (kind === "装备柜") setEquipmentStash(prev => repack(prev.filter(entry => entry.id !== item.id)));
    else if (kind === "冰箱") setSurvivalStash(prev => repack(prev.filter(entry => entry.id !== item.id)));
    else setObjectStash(prev => repack(prev.filter(entry => entry.id !== item.id)));
  }

  function useStoredItem(item: PackedLoot) {
    if (item.type === "食物") setSatiety(value => Math.min(100, value + 8 + item.grade * 4));
    else if (item.type === "药品") setTeamHealth(value => Math.min(100, value + 10 + item.grade * 5));
    else return;
    removeStoredItem(item); setSelectedStorageItem(null); advanceContract("suppliesUsed");
  }

  function submitActiveContractItem() {
    if (activeContract.metric !== "submitted" || !contractSubmitItem) return;
    removeStoredItem(contractSubmitItem);
    setSelectedStorageItem(null);
    setContractProgress(activeContract.target);
  }

  function treatCrewInjury(item: PackedLoot, crewId: number) {
    const amount = medicineTreatment(item);
    if (!amount || item.type !== "药品") return;
    setCrew(prev => prev.map(person => {
      if (person.id !== crewId || !person.injury) return person;
      const treatment = Math.min(person.injury.required, person.injury.treatment + amount);
      return treatment >= person.injury.required
        ? { ...person, health: "健康", stamina: Math.max(50, person.stamina), injury: undefined }
        : { ...person, health: "受伤", injury: { ...person.injury, treatment } };
    }));
    setTeamHealth(value => Math.min(100, value + Math.max(3, Math.round(amount / 4))));
    removeStoredItem(item); setSelectedStorageItem(null); advanceContract("suppliesUsed");
  }

  function consumeMaterialRequests(requests: MaterialRequest[]) {
    const consumedIds = new Set<number>();
    requests.forEach(request => allStoredItems.filter(item => item.name === request.name).slice(0, request.quantity).forEach(item => consumedIds.add(item.id)));
    setEquipmentStash(prev => repack(prev.filter(item => !consumedIds.has(item.id))));
    setSurvivalStash(prev => repack(prev.filter(item => !consumedIds.has(item.id))));
    setObjectStash(prev => repack(prev.filter(item => !consumedIds.has(item.id))));
  }

  function sellStoredItem(item: PackedLoot) {
    setResources(prev => ({ ...prev, 货币: prev.货币 + item.value }));
    removeStoredItem(item);
    if (item.type === "装备" && ownedEquipment.includes(item.name)) {
      setOwnedEquipment(prev => prev.filter(name => name !== item.name));
      setKit(prev => { const next = { ...prev }; (Object.keys(next) as KitSlot[]).forEach(slot => { if (next[slot] === item.name) next[slot] = "无装备"; }); return next; });
    }
    setSelectedStorageItem(null);
  }

  function installHardware(item: PackedLoot) { const kind = hardwareKind(item.name); if (!kind) return; const cap = { CPU: 2, GPU: 8, 内存: 5 }[kind]; if (installed[kind].length >= cap) return; setInstalled(prev => ({ ...prev, [kind]: [...prev[kind], item] })); setObjectStash(prev => repack(prev.filter(entry => entry.id !== item.id))); }
  function uninstallHardware(kind: HardwareKind, item: PackedLoot) { const fit = firstFit(objectStash, item.w, item.h, 10, 24); if (!fit) return; setObjectStash(prev => [...prev, { ...item, ...fit }]); setInstalled(prev => ({ ...prev, [kind]: prev[kind].filter(entry => entry.id !== item.id) })); }

  function equipExclusive(person: Crew) {
    if (person.quality !== "传奇" || exclusiveLoadout[person.id]) return;
    const relic = equipmentStash.find(item => item.type === "专属" && item.exclusiveFor === person.name);
    if (!relic) return;
    setEquipmentStash(prev => repack(prev.filter(item => item.id !== relic.id)));
    setExclusiveLoadout(prev => ({ ...prev, [person.id]: relic }));
  }

  function unequipExclusive(person: Crew) {
    const relic = exclusiveLoadout[person.id];
    if (!relic) return;
    const fit = firstFit(equipmentStash, relic.w, relic.h, 10, 24);
    if (!fit) return;
    setEquipmentStash(prev => [...prev, { ...relic, ...fit }]);
    setExclusiveLoadout(prev => { const next = { ...prev }; delete next[person.id]; return next; });
  }

  function buyOffer(item: FieldLoot) {
    if (!hasMarketLiaison || resources.货币 < item.value) return;
    const packed = { ...item, px: 0, py: 0 } as PackedLoot; const kind = storeKind(item); const target = kind === "装备柜" ? equipmentStash : kind === "冰箱" ? survivalStash : objectStash; const fit = firstFit(target, item.w, item.h, 10, 24); if (!fit) return;
    setResources(prev => ({ ...prev, 货币: prev.货币 - item.value })); if (kind === "装备柜") setEquipmentStash(prev => [...prev, { ...packed, ...fit }]); else if (kind === "冰箱") setSurvivalStash(prev => [...prev, { ...packed, ...fit }]); else setObjectStash(prev => [...prev, { ...packed, ...fit }]);
    setMarketOffers(prev => prev.filter(entry => entry.id !== item.id)); setCollectedItems(prev => Array.from(new Set([...prev, item.name])));
  }

  function scanSurvivor(method: "device" | "cash") {
    if (!hasSearchCaptain || survivorCandidates.length > 0) return;
    if (method === "device") {
      if (searchDevices === 0) return;
      const device = objectStash.find(item => item.name === "搜救仪")!;
      setObjectStash(prev => repack(prev.filter(item => item.id !== device.id)));
    } else {
      if (resources.货币 < CASH_RESCUE_PRICE) return;
      setResources(prev => ({ ...prev, 货币: prev.货币 - CASH_RESCUE_PRICE }));
    }
    setSurvivorCandidates(generateSurvivorCandidates(crew.map(person => person.name)));
  }
  function recruitCandidate(candidate: Crew) { if (crew.length >= 10 || !survivorCandidates.some(person => person.id === candidate.id)) return; setCrew(prev => [...prev, candidate]); setSeatAssignments(prev => { const next = [...prev]; const exact = next.findIndex((id, index) => id === null && rvStations[index].role === candidate.role); const empty = exact >= 0 ? exact : next.findIndex(id => id === null); if (empty >= 0) next[empty] = candidate.id; return next; }); setSurvivorCandidates([]); advanceContract("recruits"); }
  function openReplacement(candidate: Crew, source: ReplacementSource = "recruit") { setReplacementCandidate(candidate); setReplacementSource(source); }
  function replaceCrewWithCandidate(replaced: Crew) {
    if (!replacementCandidate) return;
    const joining = replacementCandidate;
    const relic = exclusiveLoadout[replaced.id];
    if (relic) { setEquipmentStash(prev => repack([...prev, relic])); setExclusiveLoadout(prev => { const next = { ...prev }; delete next[replaced.id]; return next; }); }
    setCrew(prev => prev.map(person => person.id === replaced.id ? joining : person));
    setExpedition(prev => prev.map(id => id === replaced.id ? joining.id : id));
    setSeatAssignments(prev => prev.map(id => id === replaced.id ? joining.id : id));
    setSelectedCrew(joining.id);
    if (replacementSource === "recruit") { setSurvivorCandidates([]); advanceContract("recruits"); }
    else setEndingLegendaryClaimed(true);
    setReplacementCandidate(null);
  }

  function unlockCompanionSystem() {
    if (!crimsonTerminal || companionUnlocked) return;
    setObjectStash(prev => repack(prev.filter(item => item.id !== crimsonTerminal.id)));
    setCompanionUnlocked(true); setSelectedStorageItem(null); setTab("伴侣");
  }

  function submitCompanionTrade() {
    if (!companionUnlocked || relationshipCandidate || !companionTradeReady) return;
    const picked = pickRelationship(day * 977 + relationshipContacts * 193 + relationshipRoster.length * 71, relationshipRoster.map(person => person.name));
    if (!picked) return;
    consumeMaterialRequests(companionTradeRequirements); setRelationshipContacts(value => value + 1); setRelationshipCandidate(picked);
  }

  function refreshCompanionTrade() {
    if (!companionUnlocked || relationshipCandidate || !companionTradeRefreshReady) return;
    const nextCycle = companionTradeCycle + 1;
    setCompanionTradeCycle(nextCycle);
    setCompanionTradeRequirements(generateCompanionTradeRequirements(nextCycle));
    setCompanionTradeNextRefreshDay(day + 2);
  }

  function toggleRelationshipArt(person: Relationship) {
    setRelationshipArtModes(previous => ({ ...previous, [person.name]: previous[person.name] === "allure" ? "regular" : "allure" }));
  }

  function recruitRelationshipCandidate() {
    if (!relationshipCandidate || relationshipRoster.some(person => person.name === relationshipCandidate.name)) return;
    const joining = relationshipCandidate;
    setRelationshipRoster(prev => [...prev, joining]);
    if (companionUnlocked) setRelationshipAssignments(prev => { const next = [...prev]; const exact = relationshipStations.findIndex((station, index) => next[index] === null && station.role === joining.role); const empty = exact >= 0 ? exact : next.findIndex(id => id === null); if (empty >= 0) next[empty] = joining.id; return next; });
    setRelationshipCandidate(null);
  }

  function chooseEndingLegendary(candidate: Crew) {
    if (endingLegendaryClaimed) return;
    const joining = { ...candidate, id: Date.now() + Math.floor(Math.random() * 100000), stamina: 100, health: "健康", injury: undefined };
    if (crew.length >= 10) { openReplacement(joining, "ending"); return; }
    setCrew(prev => [...prev, joining]); setSeatAssignments(prev => { const next = [...prev]; const exact = next.findIndex((id, index) => id === null && rvStations[index].role === joining.role); const empty = exact >= 0 ? exact : next.findIndex(id => id === null); if (empty >= 0) next[empty] = joining.id; return next; }); setEndingLegendaryClaimed(true);
  }
  function chooseEndingCompanion(candidate: Relationship) {
    if (endingCompanionClaimed) return;
    const joining = { ...candidate, id: Date.now() + 300000 + Math.floor(Math.random() * 100000) };
    setRelationshipRoster(prev => prev.some(person => person.name === joining.name) ? prev : [...prev, joining]); setEndingCompanionClaimed(true);
  }

  function moveRelationshipToSeat(id: number, target: number) {
    if (!companionUnlocked) return;
    setRelationshipAssignments(prev => { const next = [...prev]; const source = next.findIndex(personId => personId === id); if (source === target) return prev; const occupant = next[target]; next[target] = id; if (source >= 0) next[source] = occupant; return next; });
    setDraggedRelationship(null);
  }

  if (mode === "prep") {
    const plannedUnlocked = plannedPlace.id === 1 || (locationEscapes[plannedPlace.id - 1] ?? 0) >= 2;
    return <main className="game-shell prep-shell map-prep-shell">
      <header className="topbar map-prep-topbar"><div className="brand"><span className="brand-mark">//</span><div><b>行动规划</b><small>选择目的地 · 确认情报 · 点火出发</small></div></div><div className="map-prep-status"><span>行动组 <b>{actionCrew.length}/3</b></span><span>战斗力 <b>{actionAttack}</b></span><span>防御 <b>{actionDefense}</b></span></div><button className="ghost" onClick={() => setMode("base")}>返回房车</button></header>
      <section className="mission-map-layout">
        <article className="mission-map-panel">
          <header><div><small>QUARANTINE REGION · 12 OPERATIONS</small><h1>选择行动地点</h1><p>地图由外围向封锁线深处推进；前一地点成功撤离2次后，才能解锁下一处。</p></div><div><span>已解锁</span><b>{locations.filter(place => place.id === 1 || (locationEscapes[place.id - 1] ?? 0) >= 2).length}<i>/12</i></b></div></header>
          <div className="mission-region-map" role="img" aria-label="感染区十二地点俯视行动地图">
            <div className="mission-route-glow" />
            <div className="mission-location-safe-zone">
              {locations.map((place, index) => { const unlocked = place.id === 1 || (locationEscapes[place.id - 1] ?? 0) >= 2; const selectedPlace = plannedPlaceId === place.id; const clears = locationEscapes[place.id] ?? 0; const position = mapMarkerPositions[index]; return <button aria-label={`${place.name}，${place.risk}危险，${unlocked ? "已解锁" : "未解锁"}`} className={`map-location-node ${place.accent} ${selectedPlace ? "selected" : ""} ${unlocked ? "unlocked" : "locked"}`} style={{ left: `${position.left}%`, top: `${position.top}%` }} onClick={() => setPlannedPlaceId(place.id)} key={place.id}><span>{String(place.id).padStart(2, "0")}</span><div><b>{place.name}</b><small>{place.risk}危险 · {unlocked ? `已解锁 ${clears}/2` : "未解锁"}</small></div><em>{unlocked ? selectedPlace ? "●" : "○" : "×"}</em></button>; })}
            </div>
            <div className="mission-map-legend"><span><i className="available" />已解锁</span><span><i className="selected" />当前选择</span><span><i className="locked" />封锁中</span></div>
          </div>
        </article>
        <aside className={`mission-detail-card ${plannedPlace.accent} ${plannedUnlocked ? "" : "locked"}`}>
          <header><div><small>OPERATION {String(plannedPlace.id).padStart(2, "0")} · LOCATION DOSSIER</small><span className={`risk-${plannedPlace.accent}`}>{plannedPlace.risk}危险</span></div><h2>{plannedPlace.name}</h2><p>{plannedPlace.hint}</p></header>
          <div className="mission-detail-visual"><span>{String(plannedPlace.id).padStart(2, "0")}</span><div><small>{plannedUnlocked ? "ACCESS GRANTED" : "ACCESS LOCKED"}</small><b>{plannedUnlocked ? "路线已开放" : `需先完成 ${locations[plannedPlace.id - 2]?.name ?? "前置区域"}`}</b></div></div>
          <section className="mission-detail-stats"><div><span>推荐战斗力</span><b>{50 + plannedPlace.level * 15}</b></div><div><span>敌方队伍</span><b>2 支</b></div><div><span>初始遇敌率</span><b className="danger">20%</b></div><div><span>撤离记录</span><b>{locationEscapes[plannedPlace.id] ?? 0}/2</b></div></section>
          <section className="mission-time-profile"><header><span>安全搜索窗口</span><b>{preparationTier === 2 ? "强力配置" : preparationTier === 1 ? "良好配置" : "普通配置"}</b></header><div><span>外围 <b>{roomSafeTime(0, plannedPlace)}秒</b></span><span>内部 <b>{roomSafeTime(1, plannedPlace)}秒</b></span><span>核心 <b>{roomSafeTime(2, plannedPlace)}秒</b></span></div></section>
          <section className="mission-readonly-loadout"><header><span>当前出发配置</span><b>{actionCrewReady ? "行动组就绪" : "需要返回房车调整"}</b></header><div className="mission-crew-strip">{actionCrew.map(person => <span key={person.id}><i>{person.name.slice(0, 1)}</i><b>{person.name}</b><small>{person.role}</small></span>)}</div><p>{kit.weapon} · {kit.armor} · {kit.helmet} · {kit.backpack} · {kit.tactical}</p></section>
          {!plannedUnlocked && <div className="mission-lock-requirement"><span>解锁条件</span><b>在「{locations[plannedPlace.id - 2]?.name ?? "前置区域"}」成功撤离2次</b><small>当前进度 {(locationEscapes[plannedPlace.id - 1] ?? 0)}/2</small></div>}
          <button className="mission-depart-button" disabled={!plannedUnlocked || !actionCrewReady} onClick={confirmPreparation}><span>{!plannedUnlocked ? "地点尚未解锁" : !actionCrewReady ? "行动组尚未就绪" : "确认路线并点火出发"}</span><b>{plannedPlace.name} →</b></button>
        </aside>
      </section>
    </main>;
  }

  if (mode === "explore") return <main className="game-shell explore-shell grid-loot-shell">
    <header className="topbar explore-top"><div className="brand"><span className="brand-mark">//</span><div><b>现场搜刮</b><small>{activePlace?.name ?? "选择地点"} · 第 {day} 日</small></div></div>{activePlace && <div className="room-progress">{roomNames.map((name, index) => <span className={index < roomIndex ? "done" : index === roomIndex ? "active" : ""} key={name}><i>{index + 1}</i><b>{index === roomIndex ? name : zoneNames[roomZones[index]]}</b></span>)}</div>}<div className={`raid-clock ${overtime > 0 ? "exposed" : ""} ${enemyDefeated ? "cleared" : ""}`}>{!activePlace ? <><span>行动准备度</span><strong>{preparationScore}</strong><small>{preparationTier === 2 ? "强力" : preparationTier === 1 ? "良好" : "普通"}</small></> : enemyDefeated ? <><span>区域已经清场</span><strong>SAFE</strong><small>不会再出现其他搜索者</small></> : safeRemaining > 0 ? <><span>安全搜索时间</span><strong>00:{String(safeRemaining).padStart(2, "0")}</strong><small>{preparationTier === 2 ? "强力配置" : preparationTier === 1 ? "良好配置" : "普通配置"} · 准备度 {preparationScore}</small></> : <><span>已暴露 {overtime}秒</span><strong>{encounterChance}%</strong><small>遇敌率 · {3 - overtime % 3}秒后检定</small></>}</div></header>
    {!activePlace ? <section className="location-select"><div className="section-title"><small>CHOOSE A RAID · 12 STAGES</small><h1>十二个地点，逐段突破感染区</h1><p>默认只开放第一个地点；在一个地点成功撤离2次，才会解锁下一区域。越深处高品质物资和高阶敌人越常见。</p></div><div className="location-grid">{locations.map((place, i) => { const previousEscapes = place.id === 1 ? 2 : locationEscapes[place.id - 1] ?? 0; const unlocked = place.id === 1 || previousEscapes >= 2; const clears = locationEscapes[place.id] ?? 0; return <button disabled={!unlocked} className={`location-card ${place.accent} ${unlocked ? "" : "locked"}`} onClick={() => enterPlace(place)} key={place.id}><span>{String(i + 1).padStart(2, "0")}</span><em>{place.risk}风险</em><h3>{place.name}</h3><p>{place.hint}</p><div className="location-clearance"><i style={{ width: `${Math.min(100, clears * 50)}%` }} /><small>{unlocked ? `本区成功撤离 ${clears}/2` : `上一区域 ${previousEscapes}/2`}</small></div><b>{unlocked ? "进入第一个房间 →" : "LOCKED · 完成上一区域"}</b></button>; })}</div></section> :
      <section className="tarkov-layout">
        <aside className="raid-sidebar"><small>RIVAL SQUADS · 2 TEAMS</small><div className={`ai-card ${ai.status === "搜索中" ? "active" : ""}`}><div><b>双队拾荒者编队</b><span>{enemyDefeated ? "全部清除" : `第${enemyWave}/2队 · ${ai.status}`}</span></div><strong>{roomNames[roomIndex]}</strong><p>{activeRole("狙击手") || kit.tactical === "战术无人机" ? `已击破${enemySquadsDefeated}/2队 · 当前${enemyParty.filter(unit => unit.hp > 0).length}人可战 · 战利品估值¥${enemyLoot.reduce((sum, item) => sum + item.value, 0)}` : ai.signal}</p><i><em style={{ width: `${enemyDefeated ? 100 : enemySquadsDefeated * 50 + Math.min(50, (3 - enemyParty.filter(unit => unit.hp > 0).length) / 3 * 50)}%` }} /></i></div>
          <div className="live-odds"><small>本房间遭遇规则</small><div><span>安全时间</span><b>{roomSafeTime(zone)}秒</b></div><div><span>搜索伏击</span><b className="amber">5%/件</b></div><div><span>超时基础遇敌</span><b>20%</b></div><div><span>概率增长</span><b className="amber">+1%/秒</b></div><div><span>敌队进度</span><b>{enemyDefeated ? "2/2 已清场" : `${enemySquadsDefeated}/2击破 · 当前${enemyParty.filter(unit => unit.hp > 0).length}/3人`}</b></div></div>
          <div className="raid-kit"><small>全局技能均已生效</small>{rvStations.filter(station => activeRole(station.role)).map(station => <div key={station.role}><span>{station.role}</span><b>{station.skill}</b></div>)}{relationshipStations.filter(station => activeRelationshipRole(station.role)).map(station => <div className="relationship-support" key={station.role}><span>{station.role}</span><b>{station.skill}</b></div>)}</div>
        </aside>
        <section className="loot-field-panel"><div className="field-heading"><div><small>ROOM {roomIndex + 1}/5 · 10 × 10 · {zoneNames[zone]}</small><h2>{roomNames[roomIndex]}</h2></div><div><span>已搜 {searchedCount} 件 · 物资搜索 {Math.round(searchSeconds)} 秒</span><b>{safeRemaining > 0 ? `还可安全停留 ${safeRemaining} 秒` : enemyDefeated ? "敌队已清除，可自由搜索" : `已暴露 ${overtime} 秒 · 遇敌率 ${encounterChance}%`}</b></div></div>
          <div className="field-grid-10"><GridCells cols={10} rows={10} />{fieldLoot.filter(item => !item.moved).map(item => <button draggable={item.revealed} onDragStart={() => item.revealed && startLootDrag(item.id, "field")} onDragEnd={finishLootDrag} onClick={() => item.revealed ? openRaidItem(item, "field") : beginSearch(item.id)} key={item.id} className={`field-object ${item.w * item.h <= 2 ? "compact-object" : ""} ${item.revealed ? `revealed grade-${item.grade}` : "masked"} ${searchingId === item.id ? "searching" : ""}`} style={{ gridColumn: `${item.x + 1} / span ${item.w}`, gridRow: `${item.y + 1} / span ${item.h}` }}>{item.revealed ? <><span>{gradeNames[item.grade]} · {item.type}</span><b>{item.name}</b><small>{purpose(item)}</small></> : <><b>?</b><span>{item.w}×{item.h} 未知物品</span>{searchingId === item.id && <em style={{ width: `${searchProgress}%` }} />}</>}</button>)}</div>
          <div className="zone-actions">{roomIndex < roomZones.length - 1 ? <button onClick={advanceRoom}><span>放弃剩余物资，推进下一房间</span><b>{roomNames[roomIndex + 1]} · 新安全时间 {roomSafeTime(roomZones[roomIndex + 1])} 秒</b></button> : <button onClick={unlockCache}><span>开启核心密室</span><b>{[...packedBag, ...safeLoot].some(item => item.type === "钥匙") ? "消耗钥匙并触发警报" : "需要任意地点钥匙"}</b></button>}</div>
          <div className="field-log compact-log">{logs.slice(0, 4).map((log, i) => <p key={i} className={i === 0 ? "latest" : ""}><span>现场</span>{log}</p>)}</div>
        </section>
        <aside className="carry-panel"><div className="carry-section"><div className="bag-title"><div><small>SECURE CASE</small><h2>保险箱</h2></div><b>2×2</b></div><div className="secure-grid" onDragOver={event => event.preventDefault()} onDrop={() => moveLoot("safe")}><GridCells cols={2} rows={2} />{safeLoot.map(item => <button draggable onDragStart={() => startLootDrag(item.id, "safe")} onDragEnd={finishLootDrag} onClick={() => openRaidItem(item, "safe")} aria-label={`查看${item.name}详情`} className={`packed-object grade-${item.grade} ${item.w * item.h <= 2 ? "compact-object" : ""}`} style={{ gridColumn: `${item.px + 1} / span ${item.w}`, gridRow: `${item.py + 1} / span ${item.h}` }} key={item.id}><b>{item.name}</b><small>点击详情 · 必定带回</small></button>)}</div></div>
          <div className="carry-section"><div className="bag-title"><div><small>BACKPACK</small><h2>{kit.backpack}</h2></div><b>{packedBag.reduce((n, i) => n + i.w * i.h, 0)} / {bagCols * bagRows}</b></div><div className="strict-bag-grid" onDragOver={event => event.preventDefault()} onDrop={() => moveLoot("bag")} style={{ gridTemplateColumns: `repeat(${bagCols},1fr)`, gridTemplateRows: `repeat(${bagRows},1fr)`, aspectRatio: `${bagCols}/${bagRows}` }}><GridCells cols={bagCols} rows={bagRows} />{packedBag.map(item => <button draggable onDragStart={() => startLootDrag(item.id, "bag")} onDragEnd={finishLootDrag} onClick={() => openRaidItem(item, "bag")} aria-label={`查看${item.name}详情`} className={`packed-object grade-${item.grade} ${item.w * item.h <= 2 ? "compact-object" : ""}`} style={{ gridColumn: `${item.px + 1} / span ${item.w}`, gridRow: `${item.py + 1} / span ${item.h}` }} key={item.id}><b>{item.name}</b><small>{item.type === "食物" || item.type === "药品" ? "点击详情 · 可局内使用" : "点击详情 · 拖动整理"}</small></button>)}</div></div>
          {enemyDefeated && <div className="enemy-spoils"><div className="bag-title"><div><small>CAPTURED LOADOUTS · 2 SQUADS</small><h2>双方敌队背包</h2></div><b>{enemyLoot.length}件</b></div><p>两支敌队全部击破，双方装备和搜刮物现已展开。点击物品尝试装入自己的背包。</p><div>{enemyLoot.map(item => <button className={`grade-${item.grade}`} onClick={() => takeEnemyLoot(item)} key={item.id}><span>{gradeNames[item.grade]} · {item.type}</span><b>{item.name}</b><small>{item.w}×{item.h} · ¥{item.value.toLocaleString()}</small></button>)}{enemyLoot.length === 0 && <span>双方敌队背包已检索完毕</span>}</div></div>}
          <div className="exit-routes"><small>EXTRACTION ROUTES</small><p className="extraction-rule">倒计时归零即成功；背包越满耗时越长，暴露状态下仍可能每3秒遇敌。</p><button onClick={() => startExtraction("原路撤离")}><b>原路撤离 · {extractionDuration("原路撤离")}秒</b><span>始终可用 · 距离长但条件稳定</span></button><button disabled={zone < 1 || !(kit.tactical === "烟雾弹" || activeRole("侦察员"))} onClick={() => startExtraction("维修通道")}><b>维修通道 · {extractionDuration("维修通道")}秒</b><span>内部起可用 · 需烟雾弹或侦察员</span></button><button disabled={zone < 2 || ![...packedBag, ...safeLoot].some(item => item.name === "红区安全卡")} onClick={() => startExtraction("封锁线车库")}><b>封锁线车库 · {extractionDuration("封锁线车库")}秒</b><span>核心限定 · 消耗红区安全卡</span></button></div>
        </aside>
      </section>}
    {selectedRaidItem && <LootArchiveDetail item={selectedRaidItem.item} collected onClose={() => setSelectedRaidItem(null)} actionLabel={selectedRaidItem.source === "bag" && (selectedRaidItem.item.type === "食物" || selectedRaidItem.item.type === "药品") ? "立即在局内使用" : selectedRaidItem.source === "field" ? undefined : `丢弃物品 · 腾出 ${selectedRaidItem.item.w * selectedRaidItem.item.h} 格`} onAction={selectedRaidItem.source === "bag" && (selectedRaidItem.item.type === "食物" || selectedRaidItem.item.type === "药品") ? useSelectedRaidItem : selectedRaidItem.source === "field" ? undefined : discardRaidItem} actionTone={selectedRaidItem.source !== "field" && !(selectedRaidItem.source === "bag" && (selectedRaidItem.item.type === "食物" || selectedRaidItem.item.type === "药品")) ? "danger" : "default"} secondaryActionLabel={selectedRaidItem.source === "bag" && (selectedRaidItem.item.type === "食物" || selectedRaidItem.item.type === "药品") ? "丢弃此物品" : undefined} onSecondaryAction={discardRaidItem} secondaryActionTone="danger" />}
    {ambushWarning && <div className="modal-backdrop ambush-warning-layer" role="alert" aria-live="assertive"><section className="ambush-warning-card"><div className="ambush-radar"><i /><i /><i /><span>!</span></div><small>UNEXPECTED CONTACT · LOOT AMBUSH</small><h2>搜刮点里藏着敌人</h2><p>搜索「{ambushWarning.itemName}」时侦测到近距离活动，小队正在举枪警戒。</p><div className="ambush-scan"><span>威胁确认中</span><b>2 SEC</b><i><em /></i></div><footer><span>区域计时已暂停</span><strong>即将进入战斗</strong></footer></section></div>}
    {battle && <div className="modal-backdrop battle-layer"><section className="raid-battle-scene"><header><div><small>LIVE CONTACT · ENEMY WAVE {enemyWave}/2 · ROOM {roomIndex + 1}</small><h2>{roomNames[roomIndex]}交火</h2><p>每秒自动结算一轮攻击；击破本队后返回搜刮场景，另一队只会在后续遇敌检定命中时出现。</p></div><div><span>脱离成功率</span><strong>{disengageChance}%</strong><button disabled={escapeCooldown > 0} onClick={attemptDisengage}>{escapeCooldown > 0 ? `${escapeCooldown}秒后可脱离` : "尝试脱离战斗"}</button></div></header><div className="combat-board"><section><div className="combat-side-title"><span>RV ACTION TEAM</span><b>{raidParty.filter(unit => unit.hp > 0).length}/3 可战</b></div>{raidParty.map(unit => <article className={unit.hp === 0 ? "downed" : ""} key={unit.id}><div><span>{unit.role}</span><b>{unit.name}</b></div><strong>{unit.hp}<small>/{unit.maxHp}</small></strong><i><em style={{ width: `${unit.hp / unit.maxHp * 100}%` }} /></i><footer><span>战斗 {unit.attack}</span><span>防御 {unit.defense}</span></footer></article>)}</section><div className="combat-center"><b>VS</b><span>第 {enemyWave}/2 队</span><i /><small>血量跨遭遇与跨房间保留</small></div><section className="enemy-side"><div className="combat-side-title"><span>SCAVENGER SQUAD · WAVE {enemyWave}</span><b>{enemyParty.filter(unit => unit.hp > 0).length}/3 可战</b></div>{enemyParty.map(unit => <article className={unit.hp === 0 ? "downed" : ""} key={unit.id}><div><span>{unit.role}</span><b>{unit.name}</b></div><strong>{unit.hp}<small>/{unit.maxHp}</small></strong><i><em style={{ width: `${unit.hp / unit.maxHp * 100}%` }} /></i><footer><span>战斗 {unit.attack}</span><span>防御 {unit.defense}</span></footer></article>)}</section></div><div className="combat-log"><header><span>COMBAT FEED</span><b>失败脱离不会重置血量</b></header>{battleLogs.slice(0, 6).map((line, index) => <p className={index === 0 ? "latest" : ""} key={`${line}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{line}</p>)}</div></section></div>}
    {extracting > 0 && <div className="modal-backdrop extracting-layer"><div className="extract-countdown"><small>{selectedExit}</small><strong>{extracting}</strong><h2>坚持到 0，撤离立即成功</h2><p>{escapeProtection > 0 ? `脱离保护剩余 ${escapeProtection} 秒，期间不会再次遇敌。` : safeRemaining > 0 || enemyDefeated ? "撤离正在安全窗口内执行，不会触发敌队拦截。" : `当前已暴露 ${overtime} 秒；倒计时期间仍会每3秒检定遇敌，一旦遭遇则撤离中断。`}</p><div><span>行动组生命 {Math.round(allyHpRatio * 100)}%</span><span>背包装载 {Math.round(bagLoadRatio * 100)}%</span><span>没有隐藏失败判定</span></div></div></div>}
  </main>;

  if (mode === "result") {
    const returned = [...packedBag, ...safeLoot];
    const extractionSucceeded = roundOutcome.some(line => line.includes("成功撤离"));
    return <main className="result-shell"><section className="result-card"><small>RAID REPORT</small><h1>{returned.length ? "这次冒险带回了能改变房车的东西" : extractionSucceeded ? "行动组成功撤离，但没有带回物资" : "撤离失败，至少人还在"}</h1><p>搜索 {searchedCount} 件物品，深入至{zoneNames[zone]}，停留 {Math.round(searchSeconds)} 秒，AI队伍状态：{ai.status}。</p><div className="outcome-list">{roundOutcome.map((line, i) => <div key={i}><span>{i ? "过程" : "结果"}</span><b>{line}</b></div>)}</div><div className="result-loot">{returned.map(item => <div key={item.id} className={`grade-${item.grade}`}><span>{safeLoot.some(entry => entry.id === item.id) ? "保险箱" : "背包"} · {gradeNames[item.grade]}</span><b>{item.name}</b><small>{purpose(item)}</small></div>)}</div>{survivorCandidates.length > 0 && <section className="result-candidates"><header><div><small>SURVIVOR SIGNALS</small><h2>发现 {survivorCandidates.length} 名幸存者</h2></div><span>只能选择其中一人加入或替换旧成员</span></header><SurvivorCandidateChoices candidates={survivorCandidates} canRecruit={crew.length < 10} onRecruit={recruitCandidate} onReplace={person => openReplacement(person, "recruit")} source="现场" /></section>}{relationshipCandidate && <div className="recruit-box midnight-recruit"><div className="recruit-avatar">{relationshipCandidate.name.slice(0, 1)}</div><div><small>极罕见 · 私人频道邂逅</small><h3>{relationshipCandidate.name}</h3><p>{relationshipCandidate.quality}{relationshipCandidate.role} · “{relationshipCandidate.tagline}”</p></div><button onClick={recruitRelationshipCandidate}>留下同行邀请</button></div>}<button className="primary settle" onClick={settleRun}>分类收进房车仓库 <i>→</i></button></section>{replacementCandidate && <ReplacementModal candidate={replacementCandidate} crew={crew} onReplace={replaceCrewWithCandidate} onClose={() => setReplacementCandidate(null)} />}</main>;
  }

  const tabs: Tab[] = ["房车", "队伍", "仓库", "电脑", "黑市", "招聘", "伴侣", "物资图鉴", "人员图鉴"];
  return <main className="game-shell">
    <header className="topbar base-topbar"><div className="brand"><span className="brand-mark">//</span><div><b>最后十席</b><small>感染区撤离 · 第 {day} 日</small></div></div><nav>{tabs.map(item => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</nav><div className="topbar-survival"><div title="全队饱食度"><span>饱食</span><i><em style={{ width: `${satiety}%` }} /></i><b>{satiety}</b></div><div title="全队健康"><span>健康</span><i><em style={{ width: `${teamHealth}%` }} /></i><b>{teamHealth}</b></div></div><div className="resources"><span>货币 <b>¥{resources.货币}</b></span><span>矿币 <b>{coins}</b></span></div></header>

    {tab === "房车" && <><section className="rv-command-center">
      <header className="command-heading"><div><small>RV READY ROOM · ROUND {String(day).padStart(2, "0")}</small><h1>房车整备舱</h1><p>这里只确认行动人员与现有装备；点击底部出发控制台后，再选择目的地并查看完整风险简报。</p></div><div className="command-heading-status"><span>距离封锁线 <b>{Math.max(120, 780 - day * 24)} KM</b></span><span>房车修复 <b>{repairPercent}%</b></span><button className={resetArmed ? "command-reset armed" : "command-reset"} onClick={resetLocalGame}>{resetArmed ? "确认清除存档" : "重开存档"}</button></div></header>

      <div className="command-main-grid home-ready-grid">
        <article className="command-module command-squad home-squad"><header><div><small>EXPEDITION SQUAD</small><h2>行动小队 <span>{actionCrew.length}/3</span></h2></div><button onClick={() => openCrewModal(0)}>调整行动组</button></header><div className="command-squad-grid">{Array.from({ length: 3 }).map((_, index) => { const person = actionCrew[index]; const labels = ["队长", "战斗位", "支援位"]; return person ? <button className={`command-member fixed-visual-card ${qualityClass[person.quality]} ${person.injury ? "injured" : ""}`} onClick={() => openCrewModal(index)} key={person.id}><header><span>{labels[index]}</span><em>{person.quality}</em></header><div className={`command-member-avatar fixed-squad-art squad-art-${index}`} aria-hidden="true" /><div className="command-member-identity"><h3>{person.name}</h3><p>{person.role} / {person.subRole}</p><small>{person.injury ? `${person.injury.severity} · 无法出战` : person.trait}</small></div><div className="command-member-stats"><span>战斗 <b>{person.attack}</b></span><span>防御 <b>{person.defense}</b></span><span>体力 <b>{person.stamina}</b></span></div></button> : <button className="command-member empty" onClick={() => openCrewModal(index)} key={index}><span>+</span><b>{labels[index]}</b><small>点击配置幸存者</small></button>; })}</div></article>

        <article className="command-module command-loadout"><header><div><small>SHARED LOADOUT</small><h2>行动装备</h2></div><button onClick={() => setLoadoutModalOpen(true)}>更换装备</button></header><div className="command-loadout-list">{(Object.keys(kitLabels) as KitSlot[]).map(slot => { const gear = selectedGear(slot); return <button onClick={() => { setPrepSlot(slot); setLoadoutModalOpen(true); }} key={slot}><i>{kitLabels[slot].slice(0, 1)}</i><div><small>{kitLabels[slot]}</small><b>{kit[slot]}</b><span>{gear.note}</span></div><em>更换</em></button>; })}</div><footer><div><span>共享战斗力</span><b>{actionAttack}</b></div><div><span>共享防御</span><b>{actionDefense}</b></div><p>装备增益由三名行动成员共享；高级装备需从战局中成功撤回。</p></footer></article>
      </div>

      <div className="command-support-grid"><article className="command-module command-tasks"><header><div><small>ROUND TASKS</small><h2>本回合待办</h2></div><span>{injuredCrew.length + (repairPercent < 100 ? 1 : 0)}</span></header><button onClick={() => { setWarehouseTab("冰箱"); setTab("仓库"); }}><i className="medical">+</i><div><b>伤员治疗</b><small>{injuredCrew.length ? `${injuredCrew.length}名成员等待药物治疗` : "当前没有伤员"}</small></div><span>前往</span></button><button onClick={() => setTab("队伍")}><i>⌂</i><div><b>房车岗位</b><small>{seatAssignments.filter(Boolean).length}/10 个岗位已有成员</small></div><span>查看</span></button></article>
        <article className={`command-module command-contract persistent-contract ${activeContract.mystery ? "mystery" : ""}`}><header><div><small>{activeContract.mystery ? "UNKNOWN FREQUENCY · BONUS CONTRACT" : "PERMANENT CONTRACT BOARD · 10 CATEGORIES"}</small><h2>{activeContract.mystery ? "来自神秘信号的委托" : `常驻委托 · ${activeContract.category}`}</h2></div><span>{contractMainIndex}<small>已完成</small></span></header><div className="contract-objective"><i>{activeContract.icon}</i><p><b>{activeContract.title}</b><small>{activeContract.description}</small></p><strong>{Math.min(activeContract.target, contractProgress)}/{activeContract.target}</strong></div><footer><div className="contract-progress"><i><em style={{ width: `${Math.min(100, contractProgress / activeContract.target * 100)}%` }} /></i><span>{contractProgress >= activeContract.target ? "目标已达成，等待你确认领取" : activeContract.mystery ? "奖励任务完成后继续常驻任务链" : `第 ${contractMainIndex + 1} 份常驻委托 · ${contractsUntilSignal}份后收到神秘信号`}</span></div><section><small>完成奖励</small><div>{activeContract.rewards.map((reward, index) => <span key={`${reward.label}-${index}`}>{reward.label}</span>)}</div></section>{activeContract.metric === "submitted" && contractProgress < activeContract.target && <button className={contractSubmitItem ? "ready" : ""} disabled={!contractSubmitItem} onClick={submitActiveContractItem}>{contractSubmitItem ? `提交「${activeContract.submitItemName}」` : `仓库中缺少「${activeContract.submitItemName}」`}</button>}<button className={`contract-claim ${contractProgress >= activeContract.target ? "ready" : ""}`} disabled={contractProgress < activeContract.target} onClick={completeActiveContract}>{contractProgress >= activeContract.target ? "确认完成并领取奖励" : "完成目标后手动确认"}</button></footer>{contractCompletionNote && <button className="contract-complete-note" onClick={() => setContractCompletionNote("")}><span>✓</span><p>{contractCompletionNote}</p><em>关闭</em></button>}</article>
        {!endingUnlocked && <article className="command-module command-repair"><header><div><small>RV MAINLINE</small><h2>房车修复</h2></div><span>{repairPercent}%</span></header><div className="command-rv-image" role="img" aria-label="房车完整车顶俯视图" /><div className="command-repair-list">{Object.entries(repair).map(([name, value]) => { const key = name as keyof typeof repair; const required = value < 10 ? repairMaterialTracks[key][value] : "已完成"; return <button key={name} disabled={value >= 10 || (value < 10 && storedCount(required) === 0)} onClick={() => repairPart(key)}><span>{name}<i><em style={{ width: `${value * 10}%` }} /></i></span><b>{value}/10 · {value >= 10 ? "已完成" : `需要「${required}」 ${storedCount(required)}/1`}</b></button>; })}</div></article>}
        {endingUnlocked && <article className="command-module ending-recall"><small>MAINLINE CLEARED</small><h2>封锁线已经越过</h2><p>房车修复模块已关闭，你仍可继续探索感染区。</p><button onClick={() => setEndingOpen(true)}>{endingLegendaryClaimed && endingCompanionClaimed ? "重看结局" : "查看结局并领取奖励"}</button></article>}
      </div>

      <footer className="command-action-dock"><div className="readiness-steps"><div className="done"><span>1</span><p><b>检查房车</b><small>修复进度 {repairPercent}%</small></p><em>✓</em></div><i>›</i><div className={actionCrewReady ? "done" : "warning"}><span>2</span><p><b>配置小队</b><small>{actionCrewReady ? "3/3 成员就绪" : `${actionCrew.length}/3 · 需要调整`}</small></p><em>{actionCrewReady ? "✓" : "!"}</em></div><i>›</i><div className={preparationTier > 0 ? "done" : "warning"}><span>3</span><p><b>检查装备</b><small>{preparationTier > 0 ? "共享装备可用" : "当前配置较弱"}</small></p><em>{preparationTier > 0 ? "✓" : "!"}</em></div></div><div className="readiness-summary"><span>整备就绪度</span><div><p>战斗力 <b>{actionAttack}</b></p><p>防御 <b>{actionDefense}</b></p><p>状态 <b>{actionCrewReady ? "就绪" : "待配置"}</b></p></div></div><button className="ignition-button" aria-label="配置下一次行动" onClick={startRun}><span>→</span><div><small>{actionCrewReady ? "READY FOR DEPARTURE" : "ACTION SETUP"}</small><b>{actionCrewReady ? "配置行动并出发" : "先配置行动小队"}</b></div></button></footer>
    </section>
      <section className="upgrades-panel panel"><div className="panel-heading"><div><small>RV SYSTEMS</small><h2>房车建设</h2></div><span className="selection-count">搜索物资 → 匹配升级需求 → 强化长期能力</span></div><div className="upgrade-grid">{Object.entries(upgrades).map(([name, level]) => { const key = name as keyof typeof upgrades; const required = level < 3 ? upgradeMaterialTracks[key][level] : "已完成"; return <button disabled={level >= 3 || (level < 3 && storedCount(required) === 0)} onClick={() => upgradeRv(key)} key={name}><span>{name.slice(0, 1)}</span><div><b>{name}</b><small>等级 {level}/3 · {level >= 3 ? "已满级" : `需要「${required}」 ${storedCount(required)}/1`}</small></div><em>+</em></button>; })}</div></section>
      {crewModalOpen && <div className="modal-backdrop crew-modal-backdrop" onClick={() => setCrewModalOpen(false)}><article className="crew-select-modal" onClick={event => event.stopPropagation()}><header><div><small>RV PERSONNEL · EXPEDITION SQUAD</small><h2>调整三人行动组</h2><p>先选择要调整的位置，再从幸存者名单中指派一人；伤员无法出战。</p></div><button aria-label="关闭行动组弹窗" onClick={() => setCrewModalOpen(false)}>×</button></header><div className="crew-slot-selector">{["队长", "战斗位", "支援位"].map((label, index) => { const member = actionCrew[index]; return <button className={crewModalSlot === index ? "active" : ""} onClick={() => setCrewModalSlot(index)} key={label}><span>{index + 1}</span><div><small>{label}</small><b>{member?.name ?? "待配置"}</b></div><em>{crewModalSlot === index ? "正在调整" : "选择"}</em></button>; })}</div><section className="crew-select-list">{crew.map(person => { const assignedIndex = expedition.indexOf(person.id); const assigned = assignedIndex >= 0; return <button disabled={!!person.injury} className={`${qualityClass[person.quality]} ${assigned ? "assigned" : ""} ${assignedIndex === crewModalSlot ? "target" : ""}`} onClick={() => assignExpeditionSlot(person.id)} key={person.id}><div className="crew-select-portrait"><span>{person.name.slice(0, 1)}</span><small>{person.quality}</small></div><div className="crew-select-profile"><small>{person.role} / {person.subRole}</small><h3>{person.name}</h3><p>{person.trait}</p><em>{person.flaw}</em></div><div className="crew-select-metrics"><span><small>能力</small><b>{person.score}</b></span><span><small>战斗</small><b>{person.attack}</b></span><span><small>防御</small><b>{person.defense}</b></span><span><small>潜力</small><b>{person.potential}</b></span></div><strong>{person.injury ? `${person.injury.severity} · 禁止出战` : assigned ? `已在${["队长", "战斗位", "支援位"][assignedIndex]}` : `编入${["队长", "战斗位", "支援位"][crewModalSlot]}`}</strong></button>; })}</section><footer><div><span>行动组战斗力</span><b>{actionAttack}</b></div><div><span>行动组防御</span><b>{actionDefense}</b></div><p>{actionCrewReady ? "三名成员均可出战" : "行动组尚未完成配置"}</p><button onClick={() => setCrewModalOpen(false)}>完成调整</button></footer></article></div>}
      {loadoutModalOpen && <div className="modal-backdrop loadout-modal-backdrop" onClick={() => setLoadoutModalOpen(false)}><article className="loadout-modal" onClick={event => event.stopPropagation()}><header><div><small>RV ARMORY · SHARED LOADOUT</small><h2>更换行动装备</h2><p>只显示当前已经拥有的装备；选择后立即应用于三人行动组。</p></div><button aria-label="关闭装备弹窗" onClick={() => setLoadoutModalOpen(false)}>×</button></header><div className="loadout-modal-body"><nav className="loadout-modal-tabs">{(Object.keys(kitLabels) as KitSlot[]).map(slot => <button className={prepSlot === slot ? "active" : ""} onClick={() => setPrepSlot(slot)} key={slot}><span>{kitLabels[slot]}</span><b>{kit[slot]}</b></button>)}</nav><section><div className="loadout-modal-heading"><div><small>AVAILABLE {kitLabels[prepSlot].toUpperCase()}</small><h3>{kitLabels[prepSlot]}库存</h3></div><span>{availableGearOptions(prepSlot).length} 件可用</span></div><div className="loadout-modal-options">{availableGearOptions(prepSlot).map(option => <button onClick={() => setKit(prev => ({ ...prev, [prepSlot]: option.name }))} className={`${kit[prepSlot] === option.name ? "selected" : ""} item-grade-${option.grade}`} key={option.name}><i>{kitLabels[prepSlot].slice(0, 1)}</i><div><span>{gradeNames[option.grade]}</span><b>{option.name}</b><small>{option.note}</small></div><em>{kit[prepSlot] === option.name ? "已装备" : "装备"}</em></button>)}</div></section></div><footer><div><span>共享战斗力</span><b>{actionAttack}</b></div><div><span>共享防御</span><b>{actionDefense}</b></div><button onClick={() => setLoadoutModalOpen(false)}>完成配置</button></footer></article></div>}
    </>}

    {tab === "队伍" && <section className="roster-page"><div className="roster-head"><div><small>CREW · GLOBAL SKILLS</small><h1>十个固定岗位</h1><p>岗位可以空缺，角色可拖动换位；伤员仍可留在房车岗位，但完成治疗前无法加入行动组。</p></div><span>{crew.length}<i>/10 人</i></span></div><div className="rv-roster-layout"><div className="rv-floorplan"><div className="rv-front-mark"><b>车头</b><span>固定岗位 · 可空缺</span></div><div className="rv-seat-grid">{rvStations.map((station, index) => { const personId = seatAssignments[index]; const person = crew.find(member => member.id === personId); const familiarity = person ? person.role === station.role ? "注册位置" : person.subRole === station.role ? "熟练" : "陌生" : ""; return <div key={station.role} className={`rv-seat ${draggedOverSeat === index ? "drag-over" : ""} ${person ? "occupied" : "empty"} ${familiarity === "陌生" ? "mismatch" : ""}`} onDragOver={event => { event.preventDefault(); setDraggedOverSeat(index); }} onDragLeave={() => setDraggedOverSeat(null)} onDrop={event => { event.preventDefault(); if (draggedCrew !== null) moveCrewToSeat(draggedCrew, index); }}>{person ? <div draggable onDragStart={() => setDraggedCrew(person.id)} onDragEnd={() => { setDraggedCrew(null); setDraggedOverSeat(null); }} onClick={() => setSelectedCrew(person.id)} className={`rv-person ${qualityClass[person.quality]} ${selectedCrew === person.id ? "selected" : ""} ${person.injury ? "injured" : ""}`}><div className="rv-person-top"><span>{person.score}</span><em>{person.injury ? "伤病停赛" : station.role}</em></div><div className="rv-person-avatar">{person.name.slice(0, 1)}</div><b>{person.name}</b><small>{person.injury ? `${person.injury.severity} · 治疗${person.injury.treatment}/${person.injury.required}` : `${familiarity} · 本职${person.role}`}</small><i /></div> : <div className="vacant-seat"><span>+</span><b>{station.label}</b><small>空缺 · {station.role}</small></div>}<label>{station.skill}</label></div>; })}</div></div>
        {selected && <PersonDetail person={selected} joined panel exclusiveEquipped={exclusiveLoadout[selected.id]} exclusiveAvailable={equipmentStash.find(item => item.type === "专属" && item.exclusiveFor === selected.name)} onEquipExclusive={() => equipExclusive(selected)} onUnequipExclusive={() => unequipExclusive(selected)} onDismiss={() => dismissCrew(selected)} dismissDisabled={crew.filter(member => member.id !== selected.id && !member.injury).length < 3} />}
      </div><section className={`relationship-seats-panel ${companionUnlocked ? "" : "locked"}`}><header><div><small>MIDNIGHT CABIN · 2 EXTRA ROLES</small><h2>生活舱特殊岗位</h2><p>独立于十名幸存者编制；拖动已同行角色到伴侣席或拉拉队席。</p></div><span>{companionUnlocked ? `${assignedRelationships.length}/2 已入席` : "需要绯红邀约终端"}</span></header><div className="relationship-seat-row">{relationshipStations.map((station, index) => { const person = relationshipRoster.find(entry => entry.id === relationshipAssignments[index]); const familiarity = person ? person.role === station.role ? "注册位置" : "熟练" : ""; return <div className="relationship-seat" key={station.role} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (draggedRelationship !== null) moveRelationshipToSeat(draggedRelationship, index); }}>{person ? <button draggable onDragStart={() => setDraggedRelationship(person.id)} onDragEnd={() => setDraggedRelationship(null)} onClick={() => setSelectedRelationship(person)} className={`relationship-seat-person ${qualityClass[person.quality]}`}><span>{person.score}</span><div>{person.name.slice(0, 1)}</div><b>{person.name}</b><small>{familiarity} · {station.role}</small></button> : <div className="relationship-seat-empty"><span>{companionUnlocked ? "+" : "◇"}</span><b>{station.label}</b><small>{companionUnlocked ? `空缺 · ${station.role}` : "系统尚未解锁"}</small></div>}<label>{station.skill}</label></div>; })}</div>{companionUnlocked && <div className="relationship-bench"><span>待安排同行者</span>{relationshipRoster.filter(person => !relationshipAssignments.includes(person.id)).map(person => <button draggable onDragStart={() => setDraggedRelationship(person.id)} onDragEnd={() => setDraggedRelationship(null)} onClick={() => setSelectedRelationship(person)} key={person.id}><i>{person.name.slice(0, 1)}</i><b>{person.name}</b><small>{person.quality} · {person.role}</small></button>)}{relationshipRoster.length === 0 && <p>尚未邂逅同行者。可在核心区极低概率遇见，或前往“伴侣”板块提交本期指定物资。</p>}</div>}</section>{selectedRelationship && <RelationshipDetail person={selectedRelationship} joined={relationshipRoster.some(entry => entry.name === selectedRelationship.name)} assigned={relationshipAssignments.includes(selectedRelationship.id)} onClose={() => setSelectedRelationship(null)} />}</section>}

    {tab === "仓库" && <section className="warehouse-page"><div className="roster-head"><div><small>THREE STORAGE ZONES · EACH 10×24</small><h1>分类仓库</h1><p>装备柜、冰箱和存储柜独立占格。点击物资先查看详情，再决定使用、安装、出售或留给房车需求。</p></div><span>{currentStorage.reduce((n, item) => n + item.w * item.h, 0)}<i>/240 格</i></span></div><div className="warehouse-tabs">{(["装备柜", "冰箱", "存储柜"] as StoreKind[]).map(item => <button className={warehouseTab === item ? "active" : ""} onClick={() => { setWarehouseTab(item); setSelectedStorageItem(null); }} key={item}>{item}<b>{item === "装备柜" ? equipmentStash.length : item === "冰箱" ? survivalStash.length : objectStash.length}</b></button>)}</div><div className="stash-layout"><WarehouseGrid items={currentStorage} action={setSelectedStorageItem} /><aside><small>{warehouseTab}</small><h3>{warehouseTab === "装备柜" ? "决定你能否把大货带回来" : warehouseTab === "冰箱" ? "维持全队共享生存值" : "主线、财富与长期生产"}</h3><p>{warehouseTab === "装备柜" ? "武器、护甲、背包与弹药。高级装备不会凭空出现，必须成功撤离。" : warehouseTab === "冰箱" ? "食物补饱食度，药品补健康；可在房车使用，部分可在局内双击应急。" : "物资会被房车修复、建设、委托与邀约直接点名需求；也可出售、安装或开启特殊系统。"}</p><div><span>已存物品</span><b>{currentStorage.length}</b></div><div><span>总估值</span><b>¥{currentStorage.reduce((n, item) => n + item.value, 0)}</b></div></aside></div>
      {selectedStorageItem && <div className="item-detail-backdrop" onClick={() => setSelectedStorageItem(null)}><article className={`item-detail-card item-grade-${selectedStorageItem.grade} ${selectedStorageItem.type === "专属" ? "exclusive" : ""}`} onClick={event => event.stopPropagation()}><button className="item-detail-close" onClick={() => setSelectedStorageItem(null)}>×</button><header><span>{gradeNames[selectedStorageItem.grade]} · {selectedStorageItem.type}</span><strong>¥{selectedStorageItem.value.toLocaleString()}</strong></header><div className="item-detail-art"><i>{selectedStorageItem.name.slice(0, 1)}</i><small>{selectedStorageItem.w} × {selectedStorageItem.h}</small></div><h2>{selectedStorageItem.name}</h2><p>{purpose(selectedStorageItem)}</p><section className="item-detail-story"><small>OBJECT HISTORY · 一句话档案</small><p>{lootStory(selectedStorageItem)}</p></section>{selectedStorageItem.exclusiveFor && <div className="warehouse-relic-bind"><span>身份绑定</span><b>{selectedStorageItem.exclusiveFor}</b><small>{selectedStorageItem.bonus}</small></div>}<div className="item-detail-stats"><div><span>占用空间</span><b>{selectedStorageItem.w * selectedStorageItem.h} 格</b></div><div><span>现场搜索</span><b>{selectedStorageItem.searchSeconds.toFixed(1)} 秒</b></div><div><span>存放位置</span><b>{storeKind(selectedStorageItem)}</b></div>{selectedStorageItem.type === "电脑" && <div><span>挖矿效率</span><b>+{miningYield(selectedStorageItem).toFixed(3)}/回合</b></div>}{selectedStorageItem.type === "药品" && <div><span>治疗进度</span><b>+{medicineTreatment(selectedStorageItem)}</b></div>}</div>{selectedStorageItem.type === "药品" && injuredCrew.length > 0 && <section className="injury-treatment-list"><header><div><small>INJURY TREATMENT</small><b>选择一名伤员使用药物</b></div><span>本次 +{medicineTreatment(selectedStorageItem)}</span></header>{injuredCrew.map(person => <button onClick={() => treatCrewInjury(selectedStorageItem, person.id)} key={person.id}><div><b>{person.name}</b><small>{person.injury?.severity} · 剩余 {(person.injury?.required ?? 0) - (person.injury?.treatment ?? 0)}点</small></div><i><em style={{ width: `${(person.injury?.treatment ?? 0) / (person.injury?.required ?? 100) * 100}%` }} /></i><span>治疗</span></button>)}</section>}<div className="item-detail-actions">{(selectedStorageItem.type === "食物" || selectedStorageItem.type === "药品") && <button className="primary-action" onClick={() => useStoredItem(selectedStorageItem)}>{selectedStorageItem.type === "食物" ? "使用并恢复饱食度" : injuredCrew.length ? "仅用于恢复小队健康" : "使用并恢复健康"}</button>}{selectedStorageItem.type === "电脑" && <button className="primary-action" disabled={selectedHardwareFull} onClick={() => { installHardware(selectedStorageItem); setSelectedStorageItem(null); setTab("电脑"); }}>{selectedHardwareFull ? `${selectedHardwareKind}插槽已满` : "安装到房车电脑"}</button>}{selectedStorageItem.name === "绯红邀约终端" && !companionUnlocked && <button className="primary-action crimson-action" onClick={unlockCompanionSystem}>启用终端 · 解锁伴侣板块</button>}{selectedStorageItem.type === "专属" && (() => { const owner = crew.find(person => person.name === selectedStorageItem.exclusiveFor); return <button className="primary-action" disabled={!owner || !!(owner && exclusiveLoadout[owner.id])} onClick={() => { if (owner) { equipExclusive(owner); setSelectedStorageItem(null); setSelectedCrew(owner.id); setTab("队伍"); } }}>{!owner ? `尚未获得${selectedStorageItem.exclusiveFor}` : exclusiveLoadout[owner.id] ? "该人物插槽已占用" : `装备给${owner.name}`}</button>; })()}<button className="sell-action" onClick={() => sellStoredItem(selectedStorageItem)}>出售 · ¥{selectedStorageItem.value.toLocaleString()}</button><button className="keep-action" onClick={() => setSelectedStorageItem(null)}>保留物品</button></div></article></div>}
    </section>}

    {tab === "电脑" && <section className="system-page"><div className="roster-head"><div><small>PASSIVE MINING RIG</small><h1>房车电脑</h1><p>CPU最多2个、GPU最多8个、内存最多5个。三类齐全才会在每回合结算时推进挖矿。</p></div><span>{miningRate.toFixed(3)}<i>币/回合</i></span></div><div className="mining-hero"><div><small>{miningOnline ? "ONLINE" : "OFFLINE · 缺少完整组件"}</small><h2>矿币进度 {(miningProgress * 100).toFixed(1)}%</h2><i><em style={{ width: `${miningProgress * 100}%` }} /></i><p>每满1.0进度获得1枚矿币。RTX6090单卡每回合 +0.1，GTX960单卡 +0.01。</p></div><button disabled={coins === 0} onClick={() => { setResources(prev => ({ ...prev, 货币: prev.货币 + coins * 1000 })); setCoins(0); }}>出售全部矿币<br /><b>¥{coins * 1000}</b></button></div><div className="computer-slots">{(["CPU", "GPU", "内存"] as HardwareKind[]).map(kind => <section key={kind}><header><div><small>{kind} SLOTS</small><h3>{kind}</h3></div><b>{installed[kind].length}/{({ CPU: 2, GPU: 8, 内存: 5 }[kind])}</b></header><div>{installed[kind].map(item => <button className={`hardware-chip grade-${item.grade}`} onClick={() => uninstallHardware(kind, item)} key={item.id}><b>{item.name}</b><small>+{miningYield(item).toFixed(3)}/回合 · 点击拆下</small></button>)}{Array.from({ length: ({ CPU: 2, GPU: 8, 内存: 5 }[kind]) - installed[kind].length }).map((_, i) => <span className="empty-hardware" key={i}>空插槽</span>)}</div></section>)}</div><div className="hardware-inventory"><div className="panel-heading"><div><small>AVAILABLE HARDWARE</small><h2>存储柜中的电脑设备</h2></div></div><div>{objectStash.filter(item => item.type === "电脑").map(item => <button onClick={() => installHardware(item)} className={`grade-${item.grade}`} key={item.id}><span>{gradeNames[item.grade]}</span><b>{item.name}</b><small>+{miningYield(item).toFixed(3)}币/回合</small></button>)}{!objectStash.some(item => item.type === "电脑") && <p>尚未带回电脑设备。诊疗中心与核心区域更容易找到。</p>}</div></div></section>}

    {tab === "黑市" && <section className="system-page"><div className="roster-head"><div><small>REFRESH EVERY TWO ROUNDS</small><h1>地下黑市</h1><p>每两回合刷新10件物品。点击物资先查看档案、故事和用途，再决定是否购买。</p></div><span>{day % 2 === 0 ? 2 : 1}<i>回合后刷新</i></span></div>{!hasMarketLiaison ? <div className="locked-system"><span>LOCKED</span><h2>需要黑市联络员</h2><p>在现场救援或使用搜救仪招募该职业后，暗网终端会自动开放。</p></div> : <div className="market-grid loot-market-grid">{marketOffers.map(item => <LootCard item={item} collected={collectedItems.includes(item.name)} onClick={() => setSelectedMarketItem(item)} key={item.id} />)}</div>}{selectedMarketItem && <LootArchiveDetail item={selectedMarketItem} collected={collectedItems.includes(selectedMarketItem.name)} onClose={() => setSelectedMarketItem(null)} actionLabel={resources.货币 < selectedMarketItem.value ? `货币不足 · 需要 ¥${selectedMarketItem.value.toLocaleString()}` : `购买 · ¥${selectedMarketItem.value.toLocaleString()}`} actionDisabled={resources.货币 < selectedMarketItem.value} onAction={() => { buyOffer(selectedMarketItem); setSelectedMarketItem(null); }} />}</section>}

    {tab === "招聘" && <section className="system-page"><div className="roster-head"><div><small>DIRECTED RESCUE</small><h1>幸存者搜救</h1><p>可以消耗搜救仪或支付 ¥10,000 发起搜救。每次随机发现1–3名候选人，最终只能带走一人。</p></div><span>{searchDevices}<i>个搜救仪 · ¥{resources.货币}</i></span></div>{!hasSearchCaptain ? <div className="locked-system"><span>LOCKED</span><h2>需要搜救队长</h2><p>普通高风险探索仍可能偶遇幸存者；招到搜救队长后才可进行定向搜救。</p></div> : <div className="recruit-system multi-candidate-recruit"><div><small>RESCUE SCANNER</small><h2>{survivorCandidates.length ? `无线电锁定 ${survivorCandidates.length} 名幸存者` : "选择一种搜救资源"}</h2><p>品质概率为普通56%、熟练27%、精英11%、名家5%、传奇1%。队伍满员时，可选择新成员并在弹窗中替换旧成员。</p><div className="rescue-payment-actions"><button className="primary" disabled={searchDevices === 0 || survivorCandidates.length > 0} onClick={() => scanSurvivor("device")}>{survivorCandidates.length ? "请先处理候选人" : `搜救仪 · 当前${searchDevices}个`}</button><button disabled={resources.货币 < CASH_RESCUE_PRICE || survivorCandidates.length > 0} onClick={() => scanSurvivor("cash")}>{survivorCandidates.length ? "请先处理候选人" : resources.货币 < CASH_RESCUE_PRICE ? "货币不足" : "支付 ¥10,000 搜救"}</button></div></div>{survivorCandidates.length > 0 && <div className="candidate-selection-panel"><header><span>本次发现 {survivorCandidates.length} 人</span><b>加入或替换 · 限选 1 人</b></header><SurvivorCandidateChoices candidates={survivorCandidates} canRecruit={crew.length < 10} onRecruit={recruitCandidate} onReplace={person => openReplacement(person, "recruit")} source="搜救" /></div>}</div>}{replacementCandidate && <ReplacementModal candidate={replacementCandidate} crew={crew} onReplace={replaceCrewWithCandidate} onClose={() => setReplacementCandidate(null)} />}</section>}

    {tab === "伴侣" && <section className={`system-page companion-page ${companionUnlocked ? "unlocked" : "locked"}`}>
      <div className="companion-page-heading"><h1>暮色同行</h1></div>
      {!companionUnlocked ? <div className={`companion-lock ${crimsonTerminal ? "ready" : ""}`}><div className="companion-lock-mark">♥</div><small>PRIVATE CHANNEL LOCKED</small><h2>暮色会客舱尚未启用</h2><p>使用红色品质「绯红邀约终端」永久开放私人频道。</p><div><span>初始赠送</span><span>红色品质</span><span>使用后解锁</span></div>{crimsonTerminal ? <button className="primary crimson-action" onClick={unlockCompanionSystem}>使用绯红邀约终端 <i>→</i></button> : <button disabled>尚未获得解锁道具</button>}</div> : <>
        <section className="companion-exchange-hero">
          <aside className="companion-exchange-card">{relationshipCandidate ? <><small>PRIVATE RESPONSE</small><h3>频道有了回应</h3><button className="companion-response" onClick={() => setSelectedRelationship(relationshipCandidate)}><img src={relationshipArt(relationshipCandidate, "regular")} alt="" /><div><b>{relationshipCandidate.name}</b><small>{relationshipCandidate.quality} · {relationshipCandidate.role}</small></div><em>查看档案</em></button><p>提交的物资已经交付。邀请后，本期交换即告完成。</p><button className="companion-submit ready" onClick={recruitRelationshipCandidate}>邀请加入同行名册</button></> : <><small>EXCHANGE REQUEST · PLAYER CONTROLLED</small><h3>本期指定物资</h3><div className="companion-request-list">{companionTradeRequirements.map(request => <div className={storedCount(request.name) >= request.quantity ? "complete" : ""} key={request.name}><i>{request.name.slice(0, 1)}</i><p><b>{request.name}</b><small>{gradeNames[request.grade]}品质</small></p><strong>{storedCount(request.name)}/{request.quantity}</strong></div>)}</div><footer><span>合计需求 {companionTradeRequirements.reduce((sum, request) => sum + request.quantity, 0)} 件</span><em>{companionTradeRefreshReady ? "主动刷新已就绪" : `${companionTradeRefreshRounds}回合后可刷新`}</em></footer><div className="companion-exchange-actions"><button className={`companion-submit ${companionTradeReady ? "ready" : ""}`} disabled={!companionTradeReady} onClick={submitCompanionTrade}>{companionTradeReady ? "提交全部物资 · 获取回应" : "物资尚未集齐"}</button><button className={`companion-refresh ${companionTradeRefreshReady ? "ready" : ""}`} disabled={!companionTradeRefreshReady} onClick={refreshCompanionTrade}>{companionTradeRefreshReady ? "更换本期需求" : `再完成 ${companionTradeRefreshRounds} 回合`}</button></div><p className="companion-refresh-note">刷新完全由你决定；不操作就不会替换当前清单。</p></>}</aside>
        </section>
        <div className="companion-roster-content"><div className="relationship-roster-head"><div><small>ON-ROAD RELATIONSHIPS</small><h2>已同行角色</h2></div><span>悬停卡片查看第二形态；岗位增益在队伍页入席后生效</span></div><div className="relationship-grid">{relationshipRoster.map(person => <RelationshipCard person={person} joined assigned={relationshipAssignments.includes(person.id)} onClick={() => setSelectedRelationship(person)} key={person.id} />)}{relationshipRoster.length === 0 && <div className="relationship-empty"><span>♡</span><h3>名单还是空的</h3><p>完成一期物资交换，或在核心区触发0.5%的自然邂逅。</p></div>}</div></div>
      </>}
      {selectedRelationship && <RelationshipDetail person={selectedRelationship} joined={relationshipRoster.some(entry => entry.name === selectedRelationship.name)} assigned={relationshipAssignments.includes(relationshipRoster.find(entry => entry.name === selectedRelationship.name)?.id ?? -1)} onClose={() => setSelectedRelationship(null)} />}
    </section>}

    {tab === "物资图鉴" && <section className="system-page loot-atlas-page"><div className="roster-head"><div><small>OBJECT COMPENDIUM · LOW TO HIGH</small><h1>感染区物资图鉴</h1><p>每件物资都有自己的用途与一句话档案；点击卡片查看完整详情。红色专属道具只能与对应传奇人物绑定。</p></div><span>{collectedItems.length}<i>/{fieldLootTemplates.length} 已收集</i></span></div><div className="atlas-tabs">{(["全部", "装备柜", "冰箱", "存储柜"] as const).map(item => <button className={atlasFilter === item ? "active" : ""} onClick={() => setAtlasFilter(item)} key={item}>{item}</button>)}</div><div className="atlas-grid loot-atlas-grid">{fieldLootTemplates.filter((item, index, all) => all.findIndex(entry => entry.name === item.name) === index).filter(item => atlasFilter === "全部" || storeKind({ ...item, id: 0 }) === atlasFilter).sort((a, b) => a.grade - b.grade || a.type.localeCompare(b.type, "zh-CN") || a.name.localeCompare(b.name, "zh-CN")).map(item => <LootCard item={item} collected={collectedItems.includes(item.name)} onClick={() => setSelectedAtlasItem(item)} key={item.name} />)}</div>{selectedAtlasItem && <LootArchiveDetail item={selectedAtlasItem} collected={collectedItems.includes(selectedAtlasItem.name)} onClose={() => setSelectedAtlasItem(null)} />}</section>}

    {tab === "人员图鉴" && <section className="system-page"><div className="roster-head"><div><small>PERSONNEL COMPENDIUM · LOW TO HIGH</small><h1>{peopleAtlasTab === "幸存者档案" ? "幸存者人员图鉴" : "魅力型角色"}</h1><p>{peopleAtlasTab === "幸存者档案" ? `${allPersonnelCatalog.length}份幸存者档案全部公开；点击卡片查看职业能力、装备与完整故事。` : `${allRelationshipCatalog.length}名成年魅力型角色独立收录；常规卡面悬停后切换夜间形象，已同行角色可保存偏好的卡面。`}</p></div><span>{peopleAtlasTab === "幸存者档案" ? crew.length : relationshipRoster.length}<i>/{peopleAtlasTab === "幸存者档案" ? allPersonnelCatalog.length : allRelationshipCatalog.length} 已同行</i></span></div><div className="atlas-tabs people-atlas-tabs">{(["幸存者档案", "魅力型角色"] as const).map(item => <button className={peopleAtlasTab === item ? "active" : ""} onClick={() => { setPeopleAtlasTab(item); setSelectedAtlasPerson(null); setSelectedRelationship(null); }} key={item}>{item}<small>{item === "幸存者档案" ? "十职业生存编制" : "伴侣 / 拉拉队员"}</small></button>)}</div>{peopleAtlasTab === "幸存者档案" ? <div className="people-atlas-grid">{[...allPersonnelCatalog].sort((a, b) => catalogQualities.indexOf(a.quality) - catalogQualities.indexOf(b.quality) || a.role.localeCompare(b.role, "zh-CN") || a.score - b.score).map(person => { const joined = crew.some(member => member.name === person.name); return <CrewCard person={person} joined={joined} onClick={() => setSelectedAtlasPerson(person)} key={`${person.role}-${person.name}`} />; })}</div> : <div className="relationship-grid atlas-relationship-grid">{[...allRelationshipCatalog].sort((a, b) => catalogQualities.indexOf(a.quality) - catalogQualities.indexOf(b.quality) || a.score - b.score).map(person => { const joined = relationshipRoster.some(entry => entry.name === person.name); return <RelationshipCard person={person} joined={joined} assigned={relationshipAssignments.includes(relationshipRoster.find(entry => entry.name === person.name)?.id ?? -1)} artMode={relationshipArtModes[person.name] ?? "regular"} hoverAllure onToggleArt={joined ? () => toggleRelationshipArt(person) : undefined} onClick={() => setSelectedRelationship(person)} key={person.id} />; })}</div>}{selectedAtlasPerson && (() => { const joinedPerson = crew.find(member => member.name === selectedAtlasPerson.name); const detailPerson = joinedPerson ?? selectedAtlasPerson; return <PersonDetail person={detailPerson} joined={!!joinedPerson} exclusiveEquipped={joinedPerson ? exclusiveLoadout[joinedPerson.id] : undefined} exclusiveAvailable={joinedPerson ? equipmentStash.find(item => item.type === "专属" && item.exclusiveFor === joinedPerson.name) : undefined} onEquipExclusive={joinedPerson ? () => equipExclusive(joinedPerson) : undefined} onUnequipExclusive={joinedPerson ? () => unequipExclusive(joinedPerson) : undefined} onDismiss={joinedPerson ? () => dismissCrew(joinedPerson) : undefined} dismissDisabled={joinedPerson ? crew.filter(member => member.id !== joinedPerson.id && !member.injury).length < 3 : true} onClose={() => setSelectedAtlasPerson(null)} />; })()}{selectedRelationship && <RelationshipDetail person={selectedRelationship} joined={relationshipRoster.some(entry => entry.name === selectedRelationship.name)} assigned={relationshipAssignments.includes(relationshipRoster.find(entry => entry.name === selectedRelationship.name)?.id ?? -1)} artMode={relationshipArtModes[selectedRelationship.name] ?? "regular"} onToggleArt={relationshipRoster.some(entry => entry.name === selectedRelationship.name) ? () => toggleRelationshipArt(selectedRelationship) : undefined} onClose={() => setSelectedRelationship(null)} />}</section>}
    {replacementCandidate && <ReplacementModal candidate={replacementCandidate} crew={crew} onReplace={replaceCrewWithCandidate} onClose={() => setReplacementCandidate(null)} />}
    {endingOpen && <div className="ending-backdrop"><section className="ending-scene"><button className="ending-close" onClick={() => setEndingOpen(false)}>×</button><div className="ending-copy"><small>MAINLINE COMPLETE · BEYOND THE QUARANTINE</small><h1>发动机重新响了起来。</h1><p>房车驶出感染区，晨光第一次落在完整的车顶上。故事已经通关，但这条公路仍可继续。</p><div><span>房车修复 100%</span><span>自由探索已保留</span></div></div><div className="ending-rewards"><section><header><span>奖励 01</span><div><b>传奇幸存者三选一</b><small>{endingLegendaryClaimed ? "已领取" : crew.length >= 10 ? "队伍已满，选择后替换一人" : "选择一人加入队伍"}</small></div></header><div>{endingLegendaryCandidates.map(person => <button disabled={endingLegendaryClaimed} className={qualityClass[person.quality]} onClick={() => chooseEndingLegendary(person)} key={person.name}><span>{person.name.slice(0, 1)}</span><p><b>{person.name}</b><small>{person.role} · 战{person.attack} / 防{person.defense}</small></p><em>{endingLegendaryClaimed ? "已完成" : "选择"}</em></button>)}</div></section><section><header><span>奖励 02</span><div><b>同行者三选一</b><small>{endingCompanionClaimed ? "已领取" : "不占幸存者名额"}</small></div></header><div>{endingCompanionCandidates.map(person => <button disabled={endingCompanionClaimed} className={qualityClass[person.quality]} onClick={() => chooseEndingCompanion(person)} key={person.name}><span>{person.name.slice(0, 1)}</span><p><b>{person.name}</b><small>{person.quality} · {person.role}</small></p><em>{endingCompanionClaimed ? "已完成" : "选择"}</em></button>)}</div></section><button className="ending-continue" disabled={!endingLegendaryClaimed || !endingCompanionClaimed} onClick={() => setEndingOpen(false)}>{endingLegendaryClaimed && endingCompanionClaimed ? "继续驶向未知世界" : "领取两份奖励后继续"}</button></div></section></div>}
  </main>;
}
