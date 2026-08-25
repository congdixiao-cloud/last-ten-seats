"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
type ExitId = "原路撤离" | "维修通道" | "封锁线车库";

type Crew = { id: number; name: string; role: string; subRole: string; score: number; quality: Quality; stamina: number; health: string; trait: string; flaw: string; potential: number; story: string; gear: Record<GearSlot, string>; presentation?: "allure" };
type Relationship = RelationshipProfile & { id: number };
type ExclusiveEffect = "combat" | "risk" | "fatal" | "recovery";
type Loot = { id: number; name: string; type: LootType; size: number; grade: number; value: number; story?: string; exclusiveFor?: string; bonus?: string; effect?: ExclusiveEffect; effectValue?: number };
type Place = { id: number; name: string; risk: string; hint: string; accent: string };
type FieldLoot = Loot & { w: number; h: number; x: number; y: number; searchSeconds: number; revealed: boolean; moved: boolean };
type PackedLoot = FieldLoot & { px: number; py: number };
type LootTemplate = Omit<FieldLoot, "id" | "x" | "y" | "revealed" | "moved">;
type Kit = Record<KitSlot, string>;
type GearOption = { name: string; note: string; stat: number; grade: number; cols?: number; rows?: number };
type AiSquad = { zone: number; searched: number; value: number; status: "搜索中" | "撤离中" | "已撤离" | "被击退"; signal: string };
type CombatUnit = { id: number; name: string; role: string; attack: number; defense: number; maxHp: number; hp: number };

type GameSave = {
  version: 1;
  savedAt: number;
  state: {
    tab: Tab; mode: GameMode; day: number; crew: Crew[]; selectedCrew: number; expedition: number[]; seatAssignments: (number | null)[];
    satiety: number; teamHealth: number; resources: { 弹药: number; 零件: number; 货币: number };
    repair: { 发动机: number; 传动系统: number; 密封系统: number; 导航系统: number; 冷却系统: number };
    upgrades: { 床位: number; 仓库: number; 医疗站: number; 工作台: number; 侦察台: number; 武器站: number };
    kit: Kit; ownedEquipment: string[]; activePlace: Place | null; raidSeed: number; zone: number; roomIndex?: number; safeRemaining?: number; overtime?: number; fieldLoot: FieldLoot[]; risk: number;
    logs: string[]; searchedCount: number; searchSeconds: number; packedBag: PackedLoot[]; safeLoot: PackedLoot[]; ai: AiSquad;
    selectedExit: ExitId; roundOutcome: string[]; survivorCandidates: Crew[]; raidParty?: CombatUnit[]; enemyParty?: CombatUnit[]; enemyLoot?: PackedLoot[]; enemyDefeated?: boolean; battleLogs?: string[]; relationshipRoster: Relationship[];
    relationshipCandidate: Relationship | null; relationshipAssignments: (number | null)[]; companionUnlocked: boolean; relationshipContacts: number;
    exclusiveLoadout: Record<number, PackedLoot>; equipmentStash: PackedLoot[]; survivalStash: PackedLoot[]; objectStash: PackedLoot[];
    installed: Record<HardwareKind, PackedLoot[]>; miningProgress: number; coins: number; marketOffers: FieldLoot[]; seenItems: string[]; collectedItems: string[];
  };
};

const LOCAL_SAVE_KEY = "last-ten-seats-local-save-v1";

const initialCrew: Crew[] = [
  { id: 1, name: "林默", role: "侦察员", subRole: "军需官", score: 71, quality: "熟练", stamina: 100, health: "健康", trait: "路径预判：区域推进风险 -4", flaw: "正面交战 -8%", potential: 86, story: personnelProfiles.find(person => person.name === "林默")!.story, gear: { 武器: "旧式弩", 防具: "轻便夹克", 头盔: "无", 背包: "登山包", 特殊: "望远镜" } },
  { id: 2, name: "陈锋", role: "突击手", subRole: "指挥官", score: 68, quality: "普通", stamina: 100, health: "健康", trait: "火力压制：遭遇战成功率提升", flaw: "搜索速度 -10%", potential: 82, story: personnelProfiles.find(person => person.name === "陈锋")!.story, gear: { 武器: "磨损步枪", 防具: "旧防弹衣", 头盔: "工地头盔", 背包: "帆布包", 特殊: "无" } },
  { id: 3, name: "苏桐", role: "医疗员", subRole: "厨师", score: 66, quality: "普通", stamina: 100, health: "健康", trait: "战地处理：每回合恢复小队健康", flaw: "携带空间 -2", potential: 79, story: personnelProfiles.find(person => person.name === "苏桐")!.story, gear: { 武器: "信号枪", 防具: "医用外套", 头盔: "无", 背包: "医疗包", 特殊: "止血钳" } },
];

const reserveCrew: Crew[] = [
  { id: 40, name: "韩拓", role: "机械师", subRole: "黑市联络员", score: 77, quality: "精英", stamina: 82, health: "轻伤", trait: "拆解专家：提交零件收益 +2", flaw: "每日额外消耗饱食度", potential: 84, story: personnelProfiles.find(person => person.name === "韩拓")!.story, gear: { 武器: "钉枪", 防具: "维修服", 头盔: "焊工面罩", 背包: "工具袋", 特殊: "万能扳手" } },
  { id: 50, name: "闻岚", role: "狙击手", subRole: "搜救队长", score: 82, quality: "名家", stamina: 75, health: "健康", trait: "静默警戒：更早发现AI队伍", flaw: "弹药消耗 +1", potential: 88, story: personnelProfiles.find(person => person.name === "闻岚")!.story, gear: { 武器: "猎鹿步枪", 防具: "伪装披风", 头盔: "护目镜", 背包: "轻型背囊", 特殊: "测距仪" } },
];

const rvStations = [
  { label: "指挥台", role: "指挥官", skill: "全队遭遇成功率 +6%" }, { label: "侦察席", role: "侦察员", skill: "推进与搜索风险降低" },
  { label: "突击席", role: "突击手", skill: "强攻成功率 +8%" }, { label: "狙击席", role: "狙击手", skill: "提前显示AI队伍动向" },
  { label: "医疗台", role: "医疗员", skill: "每回合恢复小队健康" }, { label: "维修台", role: "机械师", skill: "主线零件修复收益提升" },
  { label: "厨房", role: "厨师", skill: "每回合额外恢复饱食度" }, { label: "军需席", role: "军需官", skill: "背包纵向增加一格" },
  { label: "暗网终端", role: "黑市联络员", skill: "开启两回合刷新的黑市" }, { label: "搜救电台", role: "搜救队长", skill: "消耗搜救仪定向招聘" },
];

const relationshipStations: Array<{ label: string; role: RelationshipRole; skill: string }> = [
  { label: "双人卡座", role: "伴侣", skill: "提供回合恢复、风险安抚与专属互动" },
  { label: "士气舞台", role: "拉拉队员", skill: "提高行动评分与遭遇成功率" },
];

const locations: Place[] = [
  { id: 1, name: "枫叶商业街", risk: "低", hint: "生存物资多，核心区有上锁珠宝店", accent: "safe" },
  { id: 2, name: "圣心诊疗中心", risk: "中", hint: "药品与电脑设备，内部感染者活跃", accent: "mid" },
  { id: 3, name: "北环维修厂", risk: "中", hint: "房车主线零件与工具，钥匙价值很高", accent: "mid" },
  { id: 4, name: "高速封锁站", risk: "高", hint: "装备与弹药集中，AI队伍出现更快", accent: "high" },
  { id: 5, name: "红区物流枢纽", risk: "极高", hint: "高价值容器与核心部件，撤离路线苛刻", accent: "extreme" },
];

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
  helmet: [{ name: "工地头盔", note: "共享防御 +2，降低死亡风险", stat: 2, grade: 1 }, { name: "防暴头盔", note: "共享防御 +6，降低死亡风险", stat: 6, grade: 3 }, { name: "军用全盔", note: "共享防御 +11，降低死亡风险", stat: 11, grade: 5 }],
  tactical: [{ name: "简易照明棒", note: "搜索速度 +8%", stat: 8, grade: 1 }, { name: "烟雾弹", note: "开启维修通道撤离", stat: 14, grade: 3 }, { name: "战术无人机", note: "显示AI队伍精确进度", stat: 18, grade: 5 }],
};

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
  { name: "幽灵面罩", type: "专属", grade: 6, value: 19600, size: 4, w: 2, h: 2, searchSeconds: 6.8, exclusiveFor: "西蒙·莱利", bonus: "人员死亡风险 -3%", effect: "fatal", effectValue: 3, story: "面罩内侧没有姓名，只有一道被反复划掉的撤离坐标。" },
  { name: "毁灭徽记", type: "专属", grade: 6, value: 22000, size: 1, w: 1, h: 1, searchSeconds: 7, exclusiveFor: "毁灭战士", bonus: "强攻成功率 +6%", effect: "combat", effectValue: 6, story: "金属徽记摸上去始终温热，远处感染者看见它时会本能地停止前进。" },
  { name: "雪原白围巾", type: "专属", grade: 6, value: 18800, size: 3, w: 1, h: 3, searchSeconds: 6.4, exclusiveFor: "西蒙·海耶", bonus: "人员死亡风险 -3%", effect: "fatal", effectValue: 3, story: "它在任何环境下都保持雪白，只有靠近危险时才会短暂结霜。" },
  { name: "平衡护腕", type: "专属", grade: 6, value: 18400, size: 2, w: 1, h: 2, searchSeconds: 6.2, exclusiveFor: "鹰眼", bonus: "远程掩护使遭遇成功率 +4%", effect: "combat", effectValue: 4, story: "护腕上刻着密密麻麻的风速修正值，最后一行写的是：餐叉也能用。" },
  { name: "青囊", type: "专属", grade: 6, value: 20500, size: 4, w: 2, h: 2, searchSeconds: 6.7, exclusiveFor: "华佗", bonus: "回合结算健康恢复 +5", effect: "recovery", effectValue: 5, story: "布囊里没有仙药，只有被认真分类的草叶，以及几张看不懂现代药价的批注。" },
  { name: "脉诊铜铃", type: "专属", grade: 6, value: 17800, size: 1, w: 1, h: 1, searchSeconds: 6, exclusiveFor: "扁鹊", bonus: "人员死亡风险 -3%", effect: "fatal", effectValue: 3, story: "铜铃从不因风而响，只会在附近有人隐瞒伤势时轻轻震动。" },
  { name: "天工墨斗", type: "专属", grade: 6, value: 21000, size: 3, w: 3, h: 1, searchSeconds: 6.8, exclusiveFor: "鲁班", bonus: "搜索风险增长 -3", effect: "risk", effectValue: 3, story: "墨线弹过的机械零件会自行对齐，仿佛材料也不敢违背它定下的规矩。" },
  { name: "星舰控制终端", type: "专属", grade: 6, value: 24000, size: 6, w: 3, h: 2, searchSeconds: 7.2, exclusiveFor: "马斯克", bonus: "全队遭遇成功率 +5%", effect: "combat", effectValue: 5, story: "终端启动页只有一个巨大的X，系统坚持把房车识别为尚未完成首飞的星舰。" },
  { name: "原味银勺", type: "专属", grade: 6, value: 17500, size: 1, w: 1, h: 1, searchSeconds: 6.1, exclusiveFor: "九转大肠主厨", bonus: "回合结算恢复 +4", effect: "recovery", effectValue: 4, story: "银勺被擦得一尘不染，却总能让人回忆起某种无法忽略的原本味道。" },
  { name: "钢铁胃勋章", type: "专属", grade: 6, value: 16800, size: 1, w: 1, h: 1, searchSeconds: 6, exclusiveFor: "老八", bonus: "回合结算恢复 +4", effect: "recovery", effectValue: 4, story: "没有人知道谁颁发了这枚勋章，只知道背面写着：已经没有什么不能吃。" },
  { name: "陶朱算盘", type: "专属", grade: 6, value: 21500, size: 4, w: 2, h: 2, searchSeconds: 6.7, exclusiveFor: "范蠡", bonus: "搜索风险增长 -2", effect: "risk", effectValue: 2, story: "每当市场价格变化，算盘珠会自行移动，唯独“人命”一栏始终无法计价。" },
  { name: "聚财金鞭", type: "专属", grade: 6, value: 25000, size: 6, w: 3, h: 2, searchSeconds: 7.1, exclusiveFor: "财神赵公明", bonus: "全队遭遇成功率 +4%", effect: "combat", effectValue: 4, story: "鞭柄嵌着一枚无法花出的古钱，靠近交易点时总会传来清脆的落币声。" },
  { name: "名单皮箱", type: "专属", grade: 6, value: 23000, size: 6, w: 3, h: 2, searchSeconds: 7, exclusiveFor: "辛德勒", bonus: "人员死亡风险 -4%", effect: "fatal", effectValue: 4, story: "箱中每一页都写着一个曾被保护的名字，末尾还留着足够继续添加的空白。" },
  { name: "金色挑战按钮", type: "专属", grade: 6, value: 26000, size: 4, w: 2, h: 2, searchSeconds: 7.3, exclusiveFor: "MrBeast", bonus: "全队遭遇成功率 +5%", effect: "combat", effectValue: 5, story: "按下按钮会播放掌声并弹出一句提示：最后活着离开的人赢得整座仓库。" },
  { name: "1549号飞行日志", type: "专属", grade: 6, value: 21800, size: 4, w: 2, h: 2, searchSeconds: 6.8, exclusiveFor: "萨伦伯格", bonus: "人员死亡风险 -4%", effect: "fatal", effectValue: 4, story: "日志最后记录的不是高度，而是一条穿过感染区、几乎不可能成功的撤离航线。" },
  { name: "氪星家徽", type: "专属", grade: 6, value: 28000, size: 4, w: 2, h: 2, searchSeconds: 7.5, exclusiveFor: "超人", bonus: "强攻成功率 +6%", effect: "combat", effectValue: 6, story: "红色纹章在黑暗中像心跳一样明灭，提醒它的主人力量并不是唯一答案。" },
];
fieldLootTemplates.push(...legendaryRelics);

const catalogQualities: Quality[] = ["普通", "熟练", "精英", "名家", "传奇"];
const knownCrew = [...initialCrew, ...reserveCrew];
const allPersonnelCatalog: Crew[] = personnelProfiles.map((profile, index) => {
  const existing = knownCrew.find(person => person.name === profile.name);
  if (existing) return existing;
  const roleIndex = rvStations.findIndex(station => station.role === profile.role);
  const qualityIndex = catalogQualities.indexOf(profile.quality);
  return {
    id: 1000 + index,
    name: profile.name,
    role: profile.role,
    subRole: rvStations[(roleIndex + qualityIndex + 3) % rvStations.length].role,
    score: 58 + qualityIndex * 8 + (roleIndex % 3),
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

const allRelationshipCatalog: Relationship[] = relationshipProfiles.map((profile, index) => ({ ...profile, id: 5000 + index }));

const miningRates: Record<string, number> = { "CPU·老式双核": .002, "CPU·i5处理器": .008, "CPU·服务器旗舰": .025, "GPU·GTX960": .01, "GPU·RTX4070": .035, "GPU·RTX5090": .065, "GPU·RTX6090": .1, "内存·8GB": .003, "内存·32GB高频": .012, "内存·实验型模块": .03 };
function miningYield(item: Loot) { return miningRates[item.name] ?? (item.type === "电脑" ? [0, .001, .004, .01, .022, .05, .1][item.grade] : 0); }

function seeded(seed: number) { const value = Math.sin(seed * 999.91) * 43758.5453; return value - Math.floor(value); }
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
function generateSurvivorCandidates(ownedNames: string[]) {
  const count = 1 + Math.floor(Math.random() * 3);
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
function pickGrade(seed: number, zone: number, place: number, market = false) {
  const weights = market ? [58, 26, 10, 4, 1.7, .3] : zone === 2 || place === 5 ? [39, 30, 19, 8, 3.3, .7] : zone === 1 ? [48, 29, 15, 6, 1.7, .3] : [57, 27, 11, 3.8, 1.1, .1];
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
function generateEnemyParty(place: Place, day: number): CombatUnit[] {
  const names = ["灰犬", "镜蛇", "渡鸦", "铁锈", "白噪", "猎隼"];
  const riskPower = { 低: 0, 中: 5, 高: 11, 极高: 17 }[place.risk] ?? 5;
  return Array.from({ length: 3 }, (_, index) => {
    const base = 57 + riskPower + index * 3 + Math.min(8, day);
    return { id: -(place.id * 10 + index + 1), name: names[(place.id + day + index) % names.length], role: index === 0 ? "突击手" : index === 1 ? "护卫" : "侦察兵", attack: base, defense: Math.round(base * .48), maxHp: 100, hp: 100 };
  });
}
function generateEnemyLoot(place: Place, day: number): PackedLoot[] {
  const equipment = fieldLootTemplates.filter(item => item.type === "装备" && item.grade <= Math.min(5, 2 + Math.ceil(place.id / 2)));
  const general = fieldLootTemplates.filter(item => item.type !== "专属" && item.grade <= Math.min(5, 2 + Math.ceil(place.id / 2)));
  const picked: PackedLoot[] = [];
  for (let index = 0; index < 5; index++) {
    const pool = index < 3 ? equipment : general;
    const template = pool[Math.floor(seeded(day * 73 + place.id * 41 + index * 29) * pool.length)] ?? fieldLootTemplates[0];
    const fit = firstFit(picked, template.w, template.h, 8, 10);
    if (fit) picked.push({ ...template, id: 950000 + day * 100 + place.id * 10 + index, x: 0, y: 0, revealed: true, moved: true, ...fit });
  }
  return picked;
}
function firstFit(items: PackedLoot[], w: number, h: number, cols: number, rows: number) {
  const used = Array.from({ length: rows }, () => Array(cols).fill(false)); items.forEach(item => { for (let y = item.py; y < item.py + item.h; y++) for (let x = item.px; x < item.px + item.w; x++) if (used[y]) used[y][x] = true; });
  for (let y = 0; y <= rows - h; y++) for (let x = 0; x <= cols - w; x++) { let free = true; for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (used[yy][xx]) free = false; if (free) return { px: x, py: y }; }
  return null;
}
function repack(items: PackedLoot[], cols = 10, rows = 24) { const packed: PackedLoot[] = []; items.forEach(item => { const fit = firstFit(packed, item.w, item.h, cols, rows); if (fit) packed.push({ ...item, ...fit }); }); return packed; }
function storeKind(item: Loot): StoreKind { return item.type === "食物" || item.type === "药品" ? "冰箱" : item.type === "装备" || item.type === "弹药" || item.type === "专属" ? "装备柜" : "存储柜"; }
function hardwareKind(name: string): HardwareKind | null { return name.startsWith("CPU") ? "CPU" : name.startsWith("GPU") ? "GPU" : name.startsWith("内存") ? "内存" : null; }
function purpose(item: Loot) { if (item.name === "绯红邀约终端") return "成功撤离后启用，永久解锁房车「伴侣」板块"; if (item.type === "食物") return "局内应急 / 房车补充饱食度"; if (item.type === "药品") return "局内救治 / 房车恢复健康"; if (item.type === "装备") return "配置出战装备，为三人行动组提供共享增益"; if (item.type === "专属") return `仅限${item.exclusiveFor}装备 · ${item.bonus}`; if (item.type === "弹药") return "军用贸易物资；战斗不再消耗弹药"; if (item.type === "零件") return "提交房车主线修复"; if (item.type === "奢侈品") return "高价出售换取货币"; if (item.type === "电脑") return "安装至电脑，持续产出矿币"; if (item.type === "钥匙") return "开启核心区密室或特殊撤离"; return "消耗后触发特殊系统"; }
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
  return <button onClick={onClick} className={`crew-card ${qualityClass[person.quality]} ${person.presentation === "allure" ? "allure-card" : ""} ${selected ? "selected" : ""}`}>
    <i className="card-foil" />
    <div className="dossier-spine"><span>PERSONNEL</span><i /></div>
    <div className="card-top"><span>档案 {dossierCode(person)}</span><em>{person.quality}</em></div>
    <div className="card-art"><div className="portrait"><span>{person.name.slice(0, 1)}</span><i /></div><small>身份影像 · VERIFIED</small><b>{roleCodes[person.role] ?? "OPS"}</b>{person.presentation === "allure" && <em className="allure-mark">AFTER DARK · 成年</em>}</div>
    <div className="card-record">
      <div className="card-summary"><div className="card-identity"><small>{person.role} / {person.subRole}</small><strong>{person.name}</strong></div><div className="card-score"><small>能力</small>{person.score}</div></div>
      <div className="card-metrics"><span><small>潜力</small><b>{person.potential}</b></span><span><small>体力</small><b>{person.stamina}</b></span><span><small>健康</small><b>{person.health}</b></span></div>
      {joined !== undefined && <span className={`card-status ${joined ? "joined" : ""}`}><i />{joined ? "ACTIVE · 在队" : "UNLOCATED · 待搜救"}</span>}
      <div className="stamina"><i style={{ width: `${person.stamina}%` }} /></div>
    </div>
  </button>;
}

function PersonDetail({ person, joined, onClose, panel = false, exclusiveEquipped, exclusiveAvailable, onEquipExclusive, onUnequipExclusive }: { person: Crew; joined: boolean; onClose?: () => void; panel?: boolean; exclusiveEquipped?: PackedLoot; exclusiveAvailable?: PackedLoot; onEquipExclusive?: () => void; onUnequipExclusive?: () => void }) {
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
      <div><span>作业能力</span><b>{person.score}</b><i style={{ width: `${person.score}%` }} /></div><div><span>成长潜力</span><b>{person.potential}</b><i style={{ width: `${person.potential}%` }} /></div>
      <div><span>体能储备</span><b>{person.stamina}%</b><i style={{ width: `${person.stamina}%` }} /></div><div><span>档案等级</span><b>{person.quality}</b><i style={{ width: `${(catalogQualities.indexOf(person.quality) + 1) * 20}%` }} /></div>
    </div>
    <section className="person-story"><div><small>ORIGIN REPORT</small><b>来源与遭遇记录</b><em>已核验</em></div><p>{person.story}</p><footer><span>记录员 // RV-AI</span><span>最后更新 // 第 1 日</span></footer></section>
    <div className="dossier-assessment"><small>FIELD ASSESSMENT · 现场评估</small><div className="traits"><div><span>01</span><p><small>职业能力</small><b>{person.trait}</b></p></div><div><span>02</span><p><small>风险备注</small><b>{person.flaw}</b></p></div></div></div>
    {joined && person.quality === "传奇" && <section className={`exclusive-slot ${exclusiveEquipped ? "equipped" : ""}`}><header><div><small>BOUND RELIC SLOT</small><b>传奇专属道具</b></div><span>{exclusiveEquipped ? "已激活" : "空插槽"}</span></header>{exclusiveEquipped ? <div className="exclusive-slot-item"><i>{exclusiveEquipped.name.slice(0, 1)}</i><div><small>{exclusiveEquipped.exclusiveFor}专属</small><b>{exclusiveEquipped.name}</b><p>{exclusiveEquipped.bonus}</p></div><button onClick={onUnequipExclusive}>卸下</button></div> : exclusiveAvailable ? <div className="exclusive-slot-item available"><i>{exclusiveAvailable.name.slice(0, 1)}</i><div><small>装备柜中已发现</small><b>{exclusiveAvailable.name}</b><p>{exclusiveAvailable.bonus}</p></div><button onClick={onEquipExclusive}>装入</button></div> : <div className="exclusive-slot-empty"><span>＋</span><div><b>尚未获得对应专属物资</b><p>只有「{person.name}」对应的红色专属道具可以放入这里。</p></div></div>}</section>}
    <div className="gear-heading"><div><small>ISSUED EQUIPMENT</small><h3>随身装备清单</h3></div><span>{slots.length} ITEMS</span></div>
    <div className="gear-list">{slots.map((slot, index) => <div key={slot}><em>{String(index + 1).padStart(2, "0")}</em><span>{slot}</span><b>{person.gear[slot]}</b><i>已登记</i></div>)}</div>
    <footer className="dossier-footer"><span>{dossierCode(person)}</span><i /><b>CONFIDENTIAL // RV USE ONLY</b></footer>
  </article>;
  return panel ? content : <div className="person-detail-backdrop" onClick={onClose}>{content}</div>;
}

function RelationshipCard({ person, joined, assigned, onClick }: { person: Relationship; joined: boolean; assigned?: boolean; onClick: () => void }) {
  return <button className={`relationship-card ${qualityClass[person.quality]} ${joined ? "joined" : ""}`} onClick={onClick}>
    <i className="relationship-glow" />
    <header><span>MIDNIGHT PASS · {String(person.id).slice(-3)}</span><em>{person.quality}</em></header>
    <div className="relationship-portrait"><span>{person.name.slice(0, 1)}</span><i /><b>{person.role === "伴侣" ? "♥" : "✦"}</b></div>
    <section><small>{person.role} · 兼任{person.subRole} · 成年 {person.age}</small><h3>{person.name}</h3><p>“{person.tagline}”</p></section>
    <div className="relationship-metrics"><span><small>默契</small><b>{person.bond}</b></span><span><small>魅力</small><b>{person.charm}</b></span><strong>{person.score}</strong></div>
    <footer><span>{assigned ? "ON BOARD · 已入席" : joined ? "AVAILABLE · 已同行" : "UNMET · 未邂逅"}</span><i /></footer>
  </button>;
}

function RelationshipDetail({ person, joined, assigned, onClose }: { person: Relationship; joined: boolean; assigned: boolean; onClose: () => void }) {
  return <div className="relationship-detail-backdrop" onClick={onClose}><article className={`relationship-detail ${qualityClass[person.quality]}`} onClick={event => event.stopPropagation()}>
    <button className="relationship-detail-close" onClick={onClose} aria-label="关闭暮色档案">×</button>
    <header className="relationship-detail-head"><div><small>PRIVATE RV ACCESS</small><b>暮色同行者私密档案</b></div><span>21+ · CONSENSUAL</span></header>
    <div className="relationship-clearance"><span>{person.quality}通行证</span><b>{person.role}</b><em>{assigned ? "ON BOARD / 已入席" : joined ? "AVAILABLE / 已同行" : "UNMET / 未邂逅"}</em></div>
    <div className="relationship-detail-hero"><div className="relationship-photo"><span>{person.name.slice(0, 1)}</span><i /><small>{person.role === "伴侣" ? "HEART" : "HYPE"}</small></div><div><small>REGISTERED ADULT / 成年角色</small><h2>{person.name}</h2><p>{person.age}岁 · 主职{person.role} · 兼任{person.subRole}</p><blockquote>“{person.tagline}”</blockquote></div><strong>{person.score}<small>/100</small></strong></div>
    <div className="relationship-stat-grid"><div><span>综合能力</span><b>{person.score}</b></div><div><span>魅力评级</span><b>{person.charm}</b></div><div><span>当前默契</span><b>{person.bond}</b></div><div><span>档案品质</span><b>{person.quality}</b></div></div>
    <section className="relationship-story"><header><span>AFTER HOURS LOG</span><b>邂逅记录</b></header><p>{person.story}</p></section>
    <div className="relationship-assessment"><div><small>房车增益</small><b>{person.skill}</b></div><div><small>相处提醒</small><b>{person.flaw}</b></div></div>
    <footer><span>所有关系角色均为成年人</span><i /><b>亲密只是一种末日资源，也需要尊重与选择</b></footer>
  </article></div>;
}

function SurvivorCandidateChoices({ candidates, canRecruit, onRecruit, source }: { candidates: Crew[]; canRecruit: boolean; onRecruit: (person: Crew) => void; source: "现场" | "搜救" }) {
  return <div className="candidate-choice-grid">{candidates.map(person => <article className={`candidate-choice ${qualityClass[person.quality]}`} key={person.id}><header><span>{source}候选</span><em>{person.quality}</em></header><div className="candidate-choice-avatar">{person.name.slice(0, 1)}</div><strong>{person.score}</strong><h3>{person.name}</h3><p>{person.role} · 兼任{person.subRole}</p><small>潜力 {person.potential} · {person.trait}</small><button disabled={!canRecruit} onClick={() => onRecruit(person)}>{canRecruit ? "选择此人加入" : "队伍已满"}</button></article>)}</div>;
}
function WarehouseGrid({ items, action }: { items: PackedLoot[]; action: (item: PackedLoot) => void }) { return <div className="stash-grid expanded-grid">{Array.from({ length: 240 }).map((_, i) => <i key={i} />)}{items.map(item => <button onClick={() => action(item)} className={`packed-object grade-${item.grade} ${item.w * item.h <= 2 ? "compact-object" : ""}`} style={{ gridColumn: `${item.px + 1} / span ${item.w}`, gridRow: `${item.py + 1} / span ${item.h}` }} key={item.id}><span>{gradeNames[item.grade]} · {item.type}</span><b>{item.name}</b><small>{item.w}×{item.h} · ¥{item.value}</small><em>查看详情</em></button>)}</div>; }

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
  const [activePlace, setActivePlace] = useState<Place | null>(null);
  const [raidSeed, setRaidSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000));
  const [zone, setZone] = useState(0);
  const [roomIndex, setRoomIndex] = useState(0);
  const [safeRemaining, setSafeRemaining] = useState(0);
  const [overtime, setOvertime] = useState(0);
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
  const [escapeCooldown, setEscapeCooldown] = useState(0);
  const [battleLogs, setBattleLogs] = useState<string[]>([]);
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
  const [selectedRelationship, setSelectedRelationship] = useState<Relationship | null>(null);
  const [peopleAtlasTab, setPeopleAtlasTab] = useState<"幸存者档案" | "魅力型角色">("幸存者档案");
  const [warehouseTab, setWarehouseTab] = useState<StoreKind>("装备柜");
  const [selectedStorageItem, setSelectedStorageItem] = useState<PackedLoot | null>(null);
  const [selectedAtlasItem, setSelectedAtlasItem] = useState<LootTemplate | null>(null);
  const [selectedMarketItem, setSelectedMarketItem] = useState<FieldLoot | null>(null);
  const [selectedRaidItem, setSelectedRaidItem] = useState<{ item: FieldLoot; source: "field" | "bag" | "safe" } | null>(null);
  const lootDragRef = useRef(false);
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
  const [atlasFilter, setAtlasFilter] = useState<"全部" | StoreKind>("全部");
  const [saveReady, setSaveReady] = useState(false);
  const [resetArmed, setResetArmed] = useState(false);

  const activeRole = (role: string) => crew.some(member => member.role === role || member.subRole === role);
  const assignedRelationships = relationshipAssignments.map(id => relationshipRoster.find(person => person.id === id)).filter(Boolean) as Relationship[];
  const relationshipAtRole = (role: RelationshipRole) => { const index = relationshipStations.findIndex(station => station.role === role); return relationshipRoster.find(person => person.id === relationshipAssignments[index]); };
  const activeRelationshipRole = (role: RelationshipRole) => companionUnlocked && !!relationshipAtRole(role);
  const relationshipQualityPower = (role: RelationshipRole) => { const person = relationshipAtRole(role); return companionUnlocked && person ? catalogQualities.indexOf(person.quality) + 1 : 0; };
  const selected = crew.find(c => c.id === selectedCrew) ?? crew[0];
  const selectedGear = (slot: KitSlot): GearOption => kitOptions[slot].find(option => option.name === kit[slot] && ownedEquipment.includes(option.name)) ?? { name: "无装备", note: "该位置没有可用装备", stat: 0, grade: 1, cols: slot === "backpack" ? 4 : undefined, rows: slot === "backpack" ? 4 : undefined };
  const bagGear = selectedGear("backpack");
  const bagCols = bagGear.cols ?? 6;
  const bagRows = (bagGear.rows ?? 6) + (activeRole("军需官") ? 1 : 0);
  const teamRating = expedition.length ? Math.round(expedition.reduce((sum, id) => sum + (crew.find(c => c.id === id)?.score ?? 0), 0) / expedition.length) : 0;
  const preparationScore = Math.round(teamRating + (selectedGear("weapon").stat + selectedGear("armor").stat + selectedGear("helmet").stat + selectedGear("tactical").stat) / 4 + (activeRole("侦察员") ? 3 : 0) + (activeRole("指挥官") ? 2 : 0));
  const preparationTier = preparationScore >= 92 ? 2 : preparationScore >= 76 ? 1 : 0;
  const roomSafeTime = (targetZone: number) => {
    const table = [[15, 22, 30], [12, 18, 25], [10, 15, 20]];
    return table[targetZone][preparationTier] + (activeRole("侦察员") ? 3 : 0);
  };
  const equippedRelics = Object.values(exclusiveLoadout);
  const exclusiveEffect = (effect: ExclusiveEffect) => equippedRelics.filter(item => item.effect === effect).reduce((sum, item) => sum + (item.effectValue ?? 0), 0);
  const combatChance = Math.min(96, Math.max(22, teamRating - 18 + selectedGear("weapon").stat + (activeRole("指挥官") ? 6 : 0) + (activeRole("突击手") ? 8 : 0) + relationshipQualityPower("拉拉队员") * 2 + exclusiveEffect("combat") - Math.round(risk * .22)));
  const fatalChance = Math.max(1, Math.round((risk + searchedCount * 4) * .1 - selectedGear("helmet").stat * .35 - selectedGear("armor").stat * .14 - (activeRole("医疗员") ? 2 : 0) - exclusiveEffect("fatal")));
  const lossChance = Math.max(3, Math.round((risk + searchedCount * 5) * .22 - (kit.tactical === "烟雾弹" ? 14 : 0)));
  const encounterChance = Math.min(80, 20 + overtime);
  const allyHpRatio = raidParty.length ? raidParty.reduce((sum, unit) => sum + unit.hp, 0) / raidParty.reduce((sum, unit) => sum + unit.maxHp, 0) : 1;
  const enemyHpRatio = enemyParty.length ? enemyParty.reduce((sum, unit) => sum + unit.hp, 0) / enemyParty.reduce((sum, unit) => sum + unit.maxHp, 0) : 1;
  const allyPower = raidParty.reduce((sum, unit) => sum + (unit.hp > 0 ? unit.attack + unit.defense : 0), 0);
  const enemyPower = enemyParty.reduce((sum, unit) => sum + (unit.hp > 0 ? unit.attack + unit.defense : 0), 0);
  const disengageChance = Math.max(15, Math.min(85, Math.round(35 + (allyPower - enemyPower) * .08 + (1 - enemyHpRatio) * 22 - (1 - allyHpRatio) * 18 - zone * 7 + (activeRole("侦察员") ? 12 : 0) + (kit.tactical === "烟雾弹" ? 18 : 0))));
  const repairTotal = Object.values(repair).reduce((a, b) => a + b, 0);
  const repairPercent = Math.min(100, Math.round(repairTotal / 38 * 100));
  const miningRate = (Object.values(installed).flat() as PackedLoot[]).reduce((sum, item) => sum + miningYield(item), 0);
  const miningOnline = installed.CPU.length > 0 && installed.GPU.length > 0 && installed.内存.length > 0;
  const hasSearchCaptain = activeRole("搜救队长");
  const hasMarketLiaison = activeRole("黑市联络员");
  const searchDevices = objectStash.filter(item => item.name === "搜救仪").length;
  const crimsonTerminal = objectStash.find(item => item.name === "绯红邀约终端");
  const currentStorage = warehouseTab === "装备柜" ? equipmentStash : warehouseTab === "冰箱" ? survivalStash : objectStash;
  const selectedHardwareKind = selectedStorageItem ? hardwareKind(selectedStorageItem.name) : null;
  const selectedHardwareFull = selectedHardwareKind ? installed[selectedHardwareKind].length >= ({ CPU: 2, GPU: 8, 内存: 5 }[selectedHardwareKind]) : false;
  const riskBreakdown = [
    { name: "区域深度", value: zone * 12 }, { name: "搜索动作", value: searchedCount * 5 },
    { name: "停留时间", value: Math.round(searchSeconds * 1.4) }, { name: "AI接近", value: ai.status === "搜索中" && ai.zone === zone ? 12 : 0 },
    { name: "职业减免", value: -(activeRole("侦察员") ? 5 : 0) - (activeRole("狙击手") ? 3 : 0) },
  ];

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_SAVE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as GameSave;
      if (saved.version !== 1 || !saved.state || !Array.isArray(saved.state.crew) || !Number.isFinite(saved.state.day)) return;
      const state = saved.state;
      setTab(state.tab); setMode(state.mode); setDay(state.day); setCrew(state.crew); setSelectedCrew(state.selectedCrew);
      setExpedition(state.expedition); setSeatAssignments(state.seatAssignments); setSatiety(state.satiety); setTeamHealth(state.teamHealth);
      setResources(state.resources); setRepair(state.repair); setUpgrades(state.upgrades); setKit(state.kit); setOwnedEquipment(state.ownedEquipment);
      setActivePlace(state.activePlace); setRaidSeed(state.raidSeed); setZone(state.zone); setRoomIndex(state.roomIndex ?? 0); setSafeRemaining(state.safeRemaining ?? 0); setOvertime(state.overtime ?? 0); setFieldLoot(state.fieldLoot); setRisk(state.risk);
      setLogs(state.logs); setSearchedCount(state.searchedCount); setSearchSeconds(state.searchSeconds); setPackedBag(state.packedBag); setSafeLoot(state.safeLoot);
      setAi(state.ai); setSelectedExit(state.selectedExit); setRoundOutcome(state.roundOutcome); setSurvivorCandidates(state.survivorCandidates); setRaidParty(state.raidParty ?? []); setEnemyParty(state.enemyParty ?? []); setEnemyLoot(state.enemyLoot ?? []); setEnemyDefeated(state.enemyDefeated ?? false); setBattleLogs(state.battleLogs ?? []);
      setRelationshipRoster(state.relationshipRoster); setRelationshipCandidate(state.relationshipCandidate); setRelationshipAssignments(state.relationshipAssignments);
      setCompanionUnlocked(state.companionUnlocked); setRelationshipContacts(state.relationshipContacts); setExclusiveLoadout(state.exclusiveLoadout);
      setEquipmentStash(state.equipmentStash); setSurvivalStash(state.survivalStash); setObjectStash(state.objectStash); setInstalled(state.installed);
      setMiningProgress(state.miningProgress); setCoins(state.coins); setMarketOffers(state.marketOffers); setSeenItems(state.seenItems); setCollectedItems(state.collectedItems);
      setSearchingId(null); setSearchProgress(0); setDraggedLoot(null); setBattle(false); setExtracting(0); setSelectedRaidItem(null);
    } catch {
      // 损坏或旧格式的存档不会阻止游戏启动；下一次有效状态变化会覆盖它。
    } finally {
      setSaveReady(true);
    }
  }, []);

  useEffect(() => {
    if (!saveReady) return;
    const save: GameSave = {
      version: 1,
      savedAt: Date.now(),
      state: {
        tab, mode, day, crew, selectedCrew, expedition, seatAssignments, satiety, teamHealth, resources, repair, upgrades, kit, ownedEquipment,
        activePlace, raidSeed, zone, roomIndex, safeRemaining, overtime, fieldLoot, risk, logs, searchedCount, searchSeconds, packedBag, safeLoot, ai, selectedExit, roundOutcome,
        survivorCandidates, raidParty, enemyParty, enemyLoot, enemyDefeated, battleLogs, relationshipRoster, relationshipCandidate, relationshipAssignments, companionUnlocked, relationshipContacts,
        exclusiveLoadout, equipmentStash, survivalStash, objectStash, installed, miningProgress, coins, marketOffers, seenItems, collectedItems,
      },
    };
    try { window.localStorage.setItem(LOCAL_SAVE_KEY, JSON.stringify(save)); } catch { /* 浏览器禁用或空间不足时保持当前内存进度。 */ }
  }, [saveReady, tab, mode, day, crew, selectedCrew, expedition, seatAssignments, satiety, teamHealth, resources, repair, upgrades, kit, ownedEquipment, activePlace, raidSeed, zone, roomIndex, safeRemaining, overtime, fieldLoot, risk, logs, searchedCount, searchSeconds, packedBag, safeLoot, ai, selectedExit, roundOutcome, survivorCandidates, raidParty, enemyParty, enemyLoot, enemyDefeated, battleLogs, relationshipRoster, relationshipCandidate, relationshipAssignments, companionUnlocked, relationshipContacts, exclusiveLoadout, equipmentStash, survivalStash, objectStash, installed, miningProgress, coins, marketOffers, seenItems, collectedItems]);

  useEffect(() => {
    if (!saveReady || mode !== "explore" || !activePlace) return;
    if (raidParty.length === 0) setRaidParty(buildRaidParty());
    if (!enemyDefeated && enemyParty.length === 0) setEnemyParty(generateEnemyParty(activePlace, day));
    if (!enemyDefeated && enemyLoot.length === 0) setEnemyLoot(generateEnemyLoot(activePlace, day));
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
    }, 80);
    return () => window.clearInterval(timer);
  }, [searchingId]);

  useEffect(() => {
    if (extracting <= 0) return;
    const timer = window.setTimeout(() => extracting === 1 ? resolveExtraction() : setExtracting(value => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [extracting]);

  useEffect(() => {
    if (mode !== "explore" || !activePlace || battle || enemyDefeated) return;
    const timer = window.setTimeout(() => {
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
  }, [mode, activePlace, battle, enemyDefeated, safeRemaining, overtime]);

  useEffect(() => {
    if (!battle) return;
    if (!raidParty.some(unit => unit.hp > 0)) { resolvePartyWipe(); return; }
    if (!enemyParty.some(unit => unit.hp > 0)) { resolveBattleVictory(); return; }
    const timer = window.setTimeout(() => {
      const nextEnemies = enemyParty.map(unit => ({ ...unit }));
      const nextAllies = raidParty.map(unit => ({ ...unit }));
      const events: string[] = [];
      raidParty.filter(unit => unit.hp > 0).forEach((attacker, index) => {
        const targets = nextEnemies.filter(unit => unit.hp > 0); const target = targets[index % targets.length]; if (!target) return;
        const damage = Math.max(2, Math.round(attacker.attack * .11 - target.defense * .05 + Math.random() * 2));
        target.hp = Math.max(0, target.hp - damage); events.push(`${attacker.name}命中${target.name}，造成${damage}伤害${target.hp === 0 ? "并将其击倒" : ""}`);
      });
      nextEnemies.filter(unit => unit.hp > 0).forEach((attacker, index) => {
        const targets = nextAllies.filter(unit => unit.hp > 0); const target = targets[index % targets.length]; if (!target) return;
        const damage = Math.max(2, Math.round(attacker.attack * .11 - target.defense * .05 + Math.random() * 2));
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

  function startRun() { if (expedition.length === 3) setMode("prep"); }
  function resetLocalGame() {
    if (!resetArmed) { setResetArmed(true); return; }
    window.localStorage.removeItem(LOCAL_SAVE_KEY); window.location.reload();
  }
  function buildRaidParty(): CombatUnit[] {
    const weaponBuff = selectedGear("weapon").stat;
    const defenseBuff = selectedGear("armor").stat + selectedGear("helmet").stat;
    return expedition.map(id => crew.find(person => person.id === id)).filter(Boolean).map(person => {
      const member = person as Crew; const quality = catalogQualities.indexOf(member.quality);
      const maxHp = 100 + quality * 4;
      return { id: member.id, name: member.name, role: member.role, attack: Math.round(member.score * .68 + weaponBuff * .7 + (member.role === "突击手" || member.role === "狙击手" ? 6 : 0)), defense: Math.round(member.score * .3 + defenseBuff * .7), maxHp, hp: maxHp };
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

  function beginCombat() {
    if (battle || enemyDefeated || !enemyParty.some(unit => unit.hp > 0)) return;
    setExtracting(0); setSearchingId(null); setSearchProgress(0); setSelectedRaidItem(null); setBattle(true); setEscapeCooldown(5);
    setBattleLogs([`暴露检定触发：拾荒者小队在${roomNames[roomIndex]}发现了你们。`]);
    setLogs(prev => [`遭遇敌方三人小队，战斗开始；双方生命会保留到下一次接触。`, ...prev].slice(0, 6));
  }

  function resolveBattleVictory() {
    setBattle(false); setEnemyDefeated(true); setEscapeCooldown(0);
    setAi(prev => ({ ...prev, status: "被击退", signal: "敌方全员倒地，战局中不再有其他搜索者" }));
    setLogs(prev => [`敌方全员倒地：已控制对方背包，此后房间不再进行遇敌检定。`, ...prev].slice(0, 6));
    setRoundOutcome(prev => [`击败拾荒者小队，可检索其全部装备与背包`, ...prev]);
  }

  function resolvePartyWipe() {
    if (!activePlace) return;
    const enemyHealth = enemyParty.reduce((sum, unit) => sum + unit.hp, 0) / Math.max(1, enemyParty.reduce((sum, unit) => sum + unit.maxHp, 0));
    const powerGap = Math.max(0, enemyPower - allyPower);
    const deathChance = Math.max(3, Math.min(45, Math.round([5, 12, 20][zone] + enemyHealth * 18 + powerGap * .035 - selectedGear("armor").stat * .25 - selectedGear("helmet").stat * .5 - (activeRole("医疗员") ? 4 : 0) - exclusiveEffect("fatal"))));
    const rolledDeaths = expedition.filter(() => Math.random() * 100 < deathChance);
    const deaths = rolledDeaths.slice(0, Math.max(0, crew.length - 3));
    const lostEquipment = Object.values(kit).filter(name => name !== "无装备");
    setCrew(prev => prev.filter(person => !deaths.includes(person.id)).map(person => expedition.includes(person.id) ? { ...person, stamina: Math.min(person.stamina, 25), health: deaths.includes(person.id) ? person.health : "重伤" } : person));
    setExpedition(prev => prev.filter(id => !deaths.includes(id))); setSeatAssignments(prev => prev.map(id => id !== null && deaths.includes(id) ? null : id));
    setOwnedEquipment(prev => prev.filter(name => !lostEquipment.includes(name)));
    setKit({ weapon: "无装备", backpack: "无装备", armor: "无装备", helmet: "无装备", tactical: "无装备" });
    setPackedBag([]); setBattle(false); setAi(prev => ({ ...prev, status: "已撤离", signal: "敌方带走了行动组的装备和背包" }));
    setRoundOutcome([`三人行动组全部倒地，撤离失败`, `背包与出战装备全部遗失；保险箱保留`, deaths.length ? `死亡判定 ${deathChance}%：${deaths.map(id => crew.find(person => person.id === id)?.name).join("、")}未能返回` : `死亡判定 ${deathChance}%：三人均被救回，但进入重伤状态`]);
    setMode("result");
  }

  function attemptDisengage() {
    if (!battle || escapeCooldown > 0) return;
    if (Math.random() * 100 >= disengageChance) { setEscapeCooldown(5); setBattleLogs(prev => [`脱离失败（${disengageChance}%），交火继续。`, ...prev].slice(0, 12)); return; }
    setBattle(false); setEscapeCooldown(0);
    if (roomIndex >= roomZones.length - 1) {
      setBattleLogs(prev => [`脱离成功（${disengageChance}%），行动组冲向核心区紧急出口。`, ...prev]);
      setSelectedExit("原路撤离"); setExtracting(3); return;
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
    if (expedition.length !== 3) return;
    setMode("explore"); setRaidSeed(Math.floor(Math.random() * 1_000_000_000)); setActivePlace(null); setZone(0); setRoomIndex(0); setSafeRemaining(0); setOvertime(0); setRisk(6); setPackedBag([]); setSafeLoot([]); setFieldLoot([]); setSearchedCount(0); setSearchSeconds(0); setSearchingId(null); setSelectedRaidItem(null); setBattle(false); setRaidParty(buildRaidParty()); setEnemyParty([]); setEnemyLoot([]); setEnemyDefeated(false); setBattleLogs([]); setSurvivorCandidates([]); setRoundOutcome([]); setExtracting(0);
    setAi({ zone: 0, searched: 0, value: 0, status: "搜索中", signal: "无线电捕捉到另一支队伍的短讯" });
    setLogs(["装备检查完毕，三人行动组离开房车；其余成员在后方提供职业支援。"]);
  }
  function toggleExpedition(id: number) { setExpedition(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 3 ? [...prev, id] : prev); }
  function enterPlace(place: Place) { const firstSafe = roomSafeTime(0); setActivePlace(place); setRoomIndex(0); setZone(0); setSafeRemaining(firstSafe); setOvertime(0); setFieldLoot(generateField(place.id, day, 0, raidSeed, 0)); setRaidParty(current => current.length ? current : buildRaidParty()); setEnemyParty(generateEnemyParty(place, day)); setEnemyLoot(generateEnemyLoot(place, day)); setEnemyDefeated(false); setRisk(6 + ({ 低: 2, 中: 6, 高: 11, 极高: 16 }[place.risk] ?? 5)); setLogs([`进入${place.name}·${roomNames[0]}。安全搜索时间 ${firstSafe} 秒，超时后每3秒检定一次遇敌。`]); }
  function advanceRoom() { if (!activePlace || roomIndex >= roomZones.length - 1 || searchingId !== null || battle) return; enterRoom(roomIndex + 1); }
  function beginSearch(id: number) { const item = fieldLoot.find(entry => entry.id === id); if (!item || item.revealed || item.moved || searchingId !== null || battle || extracting > 0) return; setSearchingId(id); setLogs(prev => [`正在辨认一个 ${item.w}×${item.h} 的未知物品……`, ...prev].slice(0, 6)); }

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
    setPackedBag(prev => repack(prev.filter(entry => entry.id !== item.id), bagCols, bagRows));
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
    lootDragRef.current = true;
    setDraggedLoot({ id, source });
  }

  function finishLootDrag() {
    window.setTimeout(() => { lootDragRef.current = false; }, 0);
  }

  function openRaidItem(item: FieldLoot, source: "field" | "bag" | "safe") {
    if (!lootDragRef.current) setSelectedRaidItem({ item, source });
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
    setSelectedExit(exit); setExtracting(exit === "原路撤离" ? 7 : exit === "维修通道" ? 5 : 3); if (exit === "维修通道") setRisk(value => Math.min(100, value + 4));
  }

  function loseEquipment(chance: number) {
    if (Math.random() * 100 >= chance) return;
    const equipped = (Object.keys(kit) as KitSlot[]).map(slot => ({ slot, name: kit[slot] })).filter(entry => entry.name !== "无装备");
    const victim = equipped[(day + searchedCount) % equipped.length]; if (!victim) return;
    setOwnedEquipment(prev => prev.filter(name => name !== victim.name)); setKit(current => ({ ...current, [victim.slot]: "无装备" })); setRoundOutcome(prev => [`遗失装备：${victim.name}`, ...prev]);
  }

  function casualty(chance: number) {
    if (Math.random() * 100 >= chance) { setTeamHealth(value => Math.max(10, value - 9)); setRoundOutcome(prev => ["交火造成轻伤，小队共享健康下降", ...prev]); return; }
    if (crew.length <= 3) { setTeamHealth(8); setRoundOutcome(prev => ["队员濒死但被医疗员救回", ...prev]); return; }
    const victim = expedition[(day + searchedCount) % expedition.length];
    const relic = exclusiveLoadout[victim];
    if (relic) { setEquipmentStash(prev => repack([...prev, relic])); setExclusiveLoadout(prev => { const next = { ...prev }; delete next[victim]; return next; }); }
    setCrew(prev => prev.filter(member => member.id !== victim)); setExpedition(prev => prev.filter(id => id !== victim)); setSeatAssignments(prev => prev.map(id => id === victim ? null : id)); setRoundOutcome(prev => ["一名队员没能返回房车", ...prev]);
  }

  function resolveExtraction() {
    setExtracting(0);
    const fullness = packedBag.reduce((sum, item) => sum + item.w * item.h, 0) / (bagCols * bagRows);
    const routeBonus = selectedExit === "封锁线车库" ? 18 : selectedExit === "维修通道" ? 8 : 0;
    const successChance = Math.max(18, Math.min(97, Math.round(94 - risk * .45 - fullness * 10 + routeBonus)));
    if (selectedExit === "封锁线车库") { const card = [...packedBag, ...safeLoot].find(item => item.name === "红区安全卡"); if (card) { setPackedBag(prev => repack(prev.filter(item => item.id !== card.id), bagCols, bagRows)); setSafeLoot(prev => repack(prev.filter(item => item.id !== card.id), 2, 2)); } }
    if (Math.random() * 100 < successChance) setRoundOutcome(prev => [`通过${selectedExit}成功撤离（${successChance}%）`, ...prev]);
    else { setPackedBag([]); loseEquipment(Math.min(78, lossChance + 18)); casualty(Math.min(14, fatalChance + 2)); setRoundOutcome(prev => [`${selectedExit}撤离失败：背包清空，保险箱物资保留`, ...prev]); }
    setMode("result"); setBattle(false);
  }

  function storeReturned(items: PackedLoot[]) {
    setEquipmentStash(prev => repack([...prev, ...items.filter(item => storeKind(item) === "装备柜")]));
    setSurvivalStash(prev => repack([...prev, ...items.filter(item => storeKind(item) === "冰箱")]));
    setObjectStash(prev => repack([...prev, ...items.filter(item => storeKind(item) === "存储柜")]));
  }

  function settleRun() {
    const returned = [...packedBag, ...safeLoot]; storeReturned(returned); setCollectedItems(prev => Array.from(new Set([...prev, ...returned.map(item => item.name)])));
    const foundGear = returned.filter(item => item.type === "装备" && Object.values(kitOptions).flat().some(option => option.name === item.name)).map(item => item.name); setOwnedEquipment(prev => Array.from(new Set([...prev, ...foundGear])));
    const relicRecovery = exclusiveEffect("recovery");
    const companionPower = relationshipQualityPower("伴侣");
    const nextSatiety = Math.max(0, satiety - 10 + (activeRole("厨师") ? 4 : 0) + companionPower + relicRecovery); setSatiety(nextSatiety); setTeamHealth(value => Math.min(100, Math.max(0, value + (activeRole("医疗员") ? 3 : 0) + companionPower * 2 + relicRecovery - (nextSatiety < 25 ? 8 : 0))));
    if (miningOnline) { const total = miningProgress + miningRate; const mined = Math.floor(total); setMiningProgress(total - mined); if (mined) setCoins(value => value + mined); }
    setCrew(prev => prev.map(member => ({ ...member, stamina: Math.min(100, member.stamina + (expedition.includes(member.id) ? 18 : 30)), score: expedition.includes(member.id) && member.score < member.potential ? member.score + 1 : member.score })));
    const nextDay = day + 1; setDay(nextDay); if (nextDay % 2 === 0) setMarketOffers(generateMarket(nextDay)); if (zone === 2 && searchedCount >= 2) setResources(prev => ({ ...prev, 货币: prev.货币 + 600 }));
    setMode("base"); setTab("房车"); setPackedBag([]); setSafeLoot([]);
  }

  function moveCrewToSeat(crewId: number, target: number) { setSeatAssignments(prev => { const next = [...prev]; const source = next.findIndex(id => id === crewId); if (source < 0 || source === target) return prev; const occupant = next[target]; next[target] = crewId; next[source] = occupant; return next; }); setDraggedCrew(null); setDraggedOverSeat(null); setSelectedCrew(crewId); }
  function repairPart(name: keyof typeof repair) { const cost = activeRole("机械师") ? 3 : 4; const caps = { 发动机: 10, 传动系统: 8, 密封系统: 6, 导航系统: 7, 冷却系统: 7 }; if (resources.零件 < cost || repair[name] >= caps[name]) return; setResources(prev => ({ ...prev, 零件: prev.零件 - cost })); setRepair(prev => ({ ...prev, [name]: prev[name] + 1 })); }
  function upgradeRv(name: keyof typeof upgrades) { const cost = 6 + upgrades[name] * 4; if (resources.零件 < cost || upgrades[name] >= 3) return; setResources(prev => ({ ...prev, 零件: prev.零件 - cost })); setUpgrades(prev => ({ ...prev, [name]: prev[name] + 1 })); }

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
    removeStoredItem(item); setSelectedStorageItem(null);
  }

  function submitStoredPart(item: PackedLoot) {
    if (item.type !== "零件") return;
    setResources(prev => ({ ...prev, 零件: prev.零件 + item.grade * 2 + (activeRole("机械师") ? 2 : 0) }));
    removeStoredItem(item); setSelectedStorageItem(null);
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

  function scanSurvivor() {
    if (!hasSearchCaptain || searchDevices === 0 || survivorCandidates.length > 0) return;
    const device = objectStash.find(item => item.name === "搜救仪")!; setObjectStash(prev => repack(prev.filter(item => item.id !== device.id)));
    setSurvivorCandidates(generateSurvivorCandidates(crew.map(person => person.name)));
  }
  function recruitCandidate(candidate: Crew) { if (crew.length >= 10 || !survivorCandidates.some(person => person.id === candidate.id)) return; setCrew(prev => [...prev, candidate]); setSeatAssignments(prev => { const next = [...prev]; const exact = next.findIndex((id, index) => id === null && rvStations[index].role === candidate.role); const empty = exact >= 0 ? exact : next.findIndex(id => id === null); if (empty >= 0) next[empty] = candidate.id; return next; }); setSurvivorCandidates([]); }

  function unlockCompanionSystem() {
    if (!crimsonTerminal || companionUnlocked) return;
    setObjectStash(prev => repack(prev.filter(item => item.id !== crimsonTerminal.id)));
    setCompanionUnlocked(true); setSelectedStorageItem(null); setTab("伴侣");
  }

  function contactRelationship() {
    const price = 3200;
    if (!companionUnlocked || relationshipCandidate || resources.货币 < price) return;
    const picked = pickRelationship(day * 977 + relationshipContacts * 193 + relationshipRoster.length * 71, relationshipRoster.map(person => person.name));
    if (!picked) return;
    setResources(prev => ({ ...prev, 货币: prev.货币 - price })); setRelationshipContacts(value => value + 1); setRelationshipCandidate(picked);
  }

  function recruitRelationshipCandidate() {
    if (!relationshipCandidate || relationshipRoster.some(person => person.name === relationshipCandidate.name)) return;
    const joining = relationshipCandidate;
    setRelationshipRoster(prev => [...prev, joining]);
    if (companionUnlocked) setRelationshipAssignments(prev => { const next = [...prev]; const exact = relationshipStations.findIndex((station, index) => next[index] === null && station.role === joining.role); const empty = exact >= 0 ? exact : next.findIndex(id => id === null); if (empty >= 0) next[empty] = joining.id; return next; });
    setRelationshipCandidate(null);
  }

  function moveRelationshipToSeat(id: number, target: number) {
    if (!companionUnlocked) return;
    setRelationshipAssignments(prev => { const next = [...prev]; const source = next.findIndex(personId => personId === id); if (source === target) return prev; const occupant = next[target]; next[target] = id; if (source >= 0) next[source] = occupant; return next; });
    setDraggedRelationship(null);
  }

  if (mode === "prep") return <main className="game-shell prep-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">//</span><div><b>行动配置</b><small>人员与装备只从现有库存中选择</small></div></div><button className="ghost" onClick={() => setMode("base")}>返回房车</button></header>
    <section className="prep-layout"><div className="prep-main"><div className="prep-heading"><div><small>STEP 01 · TEAM</small><h1>选择三人行动组</h1><p>只有三人进入现场，但房车中所有成员的职业技能都会提供支援。</p></div><strong>{expedition.length}<i>/3</i></strong></div>
      <div className="prep-crew-grid">{crew.map(person => <CrewCard key={person.id} person={person} selected={expedition.includes(person.id)} onClick={() => toggleExpedition(person.id)} />)}</div>
      <div className="kit-config"><div className="prep-heading"><div><small>STEP 02 · LOADOUT</small><h2>使用已有装备</h2><p>初期没有高级装备；搜刮并成功撤离后才会进入可选列表。</p></div></div>
        <div className="kit-tabs">{(Object.keys(kitLabels) as KitSlot[]).map(slot => <button onClick={() => setPrepSlot(slot)} className={prepSlot === slot ? "active" : ""} key={slot}><span>{kitLabels[slot]}</span><b>{kit[slot]}</b></button>)}</div>
        <div className="gear-options">{kitOptions[prepSlot].filter(option => ownedEquipment.includes(option.name)).map(option => <button onClick={() => setKit(prev => ({ ...prev, [prepSlot]: option.name }))} className={`${kit[prepSlot] === option.name ? "selected" : ""} item-grade-${option.grade}`} key={option.name}><span>{gradeNames[option.grade]}</span><b>{option.name}</b><small>{option.note}</small><em>{kit[prepSlot] === option.name ? "已装备" : "选择"}</em></button>)}</div>
      </div></div>
      <aside className="mission-summary"><small>ACTION READINESS</small><h2>行动准备度 {preparationScore}</h2><div className="prep-readiness"><span>{preparationTier === 2 ? "强力配置" : preparationTier === 1 ? "良好配置" : "普通配置"}</span><b>外围 {roomSafeTime(0)}秒 · 内部 {roomSafeTime(1)}秒 · 核心 {roomSafeTime(2)}秒</b><p>武器、护甲和头盔的数值会同时加成三名行动队员。</p></div><small>GLOBAL SUPPORT</small><h2>全员职业支援</h2><div className="support-list">{rvStations.map(station => <div className={activeRole(station.role) ? "on" : ""} key={station.role}><span>{activeRole(station.role) ? "已生效" : "空缺"}</span><b>{station.role}</b><small>{station.skill}</small></div>)}{relationshipStations.map(station => <div className={activeRelationshipRole(station.role) ? "on relationship-support" : "relationship-support"} key={station.role}><span>{activeRelationshipRole(station.role) ? "暮色支援" : "未入席"}</span><b>{station.role}</b><small>{station.skill}</small></div>)}</div><button className="primary prep-go" disabled={expedition.length !== 3} onClick={confirmPreparation}>进入战局 <i>→</i></button></aside>
    </section>
  </main>;

  if (mode === "explore") return <main className="game-shell explore-shell grid-loot-shell">
    <header className="topbar explore-top"><div className="brand"><span className="brand-mark">//</span><div><b>现场搜刮</b><small>{activePlace?.name ?? "选择地点"} · 第 {day} 日</small></div></div>{activePlace && <div className="room-progress">{roomNames.map((name, index) => <span className={index < roomIndex ? "done" : index === roomIndex ? "active" : ""} key={name}><i>{index + 1}</i><b>{index === roomIndex ? name : zoneNames[roomZones[index]]}</b></span>)}</div>}<div className={`raid-clock ${overtime > 0 ? "exposed" : ""} ${enemyDefeated ? "cleared" : ""}`}>{!activePlace ? <><span>行动准备度</span><strong>{preparationScore}</strong><small>{preparationTier === 2 ? "强力" : preparationTier === 1 ? "良好" : "普通"}</small></> : enemyDefeated ? <><span>区域已经清场</span><strong>SAFE</strong><small>不会再出现其他搜索者</small></> : safeRemaining > 0 ? <><span>安全搜索时间</span><strong>00:{String(safeRemaining).padStart(2, "0")}</strong><small>{preparationTier === 2 ? "强力配置" : preparationTier === 1 ? "良好配置" : "普通配置"} · 准备度 {preparationScore}</small></> : <><span>已暴露 {overtime}秒</span><strong>{encounterChance}%</strong><small>遇敌率 · {3 - overtime % 3}秒后检定</small></>}</div></header>
    {!activePlace ? <section className="location-select"><div className="section-title"><small>CHOOSE A RAID</small><h1>五个房间，一支持续追踪你的敌队</h1><p>每间房都有现实倒计时。安全时间结束后，每3秒按不断增长的概率检定遇敌；越贪，战利品与风险越高。</p></div><div className="location-grid">{locations.map((place, i) => <button className={`location-card ${place.accent}`} onClick={() => enterPlace(place)} key={place.id}><span>0{i + 1}</span><em>{place.risk}风险</em><h3>{place.name}</h3><p>{place.hint}</p><b>进入第一个房间 →</b></button>)}</div></section> :
      <section className="tarkov-layout">
        <aside className="raid-sidebar"><small>RIVAL SQUAD</small><div className={`ai-card ${ai.status === "搜索中" ? "active" : ""}`}><div><b>拾荒者小队</b><span>{enemyDefeated ? "已清除" : ai.status}</span></div><strong>{roomNames[roomIndex]}</strong><p>{activeRole("狙击手") || kit.tactical === "战术无人机" ? `${ai.searched}次搜索 · 背包估值¥${enemyLoot.reduce((sum, item) => sum + item.value, 0)}` : ai.signal}</p><i><em style={{ width: `${enemyDefeated ? 100 : Math.min(100, ai.searched / 7 * 100)}%` }} /></i></div>
          <div className="live-odds"><small>本房间暴露规则</small><div><span>安全时间</span><b>{roomSafeTime(zone)}秒</b></div><div><span>超时基础遇敌</span><b>20%</b></div><div><span>概率增长</span><b className="amber">+1%/秒</b></div><div><span>检定间隔</span><b>3秒</b></div><div><span>敌队状态</span><b>{enemyDefeated ? "已清场" : `${enemyParty.filter(unit => unit.hp > 0).length}/3人可战`}</b></div></div>
          <div className="raid-kit"><small>全局技能均已生效</small>{rvStations.filter(station => activeRole(station.role)).map(station => <div key={station.role}><span>{station.role}</span><b>{station.skill}</b></div>)}{relationshipStations.filter(station => activeRelationshipRole(station.role)).map(station => <div className="relationship-support" key={station.role}><span>{station.role}</span><b>{station.skill}</b></div>)}</div>
        </aside>
        <section className="loot-field-panel"><div className="field-heading"><div><small>ROOM {roomIndex + 1}/5 · 10 × 10 · {zoneNames[zone]}</small><h2>{roomNames[roomIndex]}</h2></div><div><span>已搜 {searchedCount} 件 · 物资搜索 {Math.round(searchSeconds)} 秒</span><b>{safeRemaining > 0 ? `还可安全停留 ${safeRemaining} 秒` : enemyDefeated ? "敌队已清除，可自由搜索" : `已暴露 ${overtime} 秒 · 遇敌率 ${encounterChance}%`}</b></div></div>
          <div className="field-grid-10">{Array.from({ length: 100 }).map((_, i) => <i key={i} />)}{fieldLoot.filter(item => !item.moved).map(item => <button draggable={item.revealed} onDragStart={() => item.revealed && startLootDrag(item.id, "field")} onDragEnd={finishLootDrag} onClick={() => item.revealed ? openRaidItem(item, "field") : beginSearch(item.id)} key={item.id} className={`field-object ${item.w * item.h <= 2 ? "compact-object" : ""} ${item.revealed ? `revealed grade-${item.grade}` : "masked"} ${searchingId === item.id ? "searching" : ""}`} style={{ gridColumn: `${item.x + 1} / span ${item.w}`, gridRow: `${item.y + 1} / span ${item.h}` }}>{item.revealed ? <><span>{gradeNames[item.grade]} · {item.type}</span><b>{item.name}</b><small>{purpose(item)}</small></> : <><b>?</b><span>{item.w}×{item.h} 未知物品</span>{searchingId === item.id && <em style={{ width: `${searchProgress}%` }} />}</>}</button>)}</div>
          <div className="zone-actions">{roomIndex < roomZones.length - 1 ? <button onClick={advanceRoom}><span>放弃剩余物资，推进下一房间</span><b>{roomNames[roomIndex + 1]} · 新安全时间 {roomSafeTime(roomZones[roomIndex + 1])} 秒</b></button> : <button onClick={unlockCache}><span>开启核心密室</span><b>{[...packedBag, ...safeLoot].some(item => item.type === "钥匙") ? "消耗钥匙并触发警报" : "需要任意地点钥匙"}</b></button>}</div>
          <div className="field-log compact-log">{logs.slice(0, 4).map((log, i) => <p key={i} className={i === 0 ? "latest" : ""}><span>现场</span>{log}</p>)}</div>
        </section>
        <aside className="carry-panel"><div className="carry-section"><div className="bag-title"><div><small>SECURE CASE</small><h2>保险箱</h2></div><b>2×2</b></div><div className="secure-grid" onDragOver={event => event.preventDefault()} onDrop={() => moveLoot("safe")}>{safeLoot.map(item => <button draggable onDragStart={() => startLootDrag(item.id, "safe")} onDragEnd={finishLootDrag} onClick={() => openRaidItem(item, "safe")} aria-label={`查看${item.name}详情`} className={`packed-object grade-${item.grade} ${item.w * item.h <= 2 ? "compact-object" : ""}`} style={{ gridColumn: `${item.px + 1} / span ${item.w}`, gridRow: `${item.py + 1} / span ${item.h}` }} key={item.id}><b>{item.name}</b><small>点击详情 · 必定带回</small></button>)}</div></div>
          <div className="carry-section"><div className="bag-title"><div><small>BACKPACK</small><h2>{kit.backpack}</h2></div><b>{packedBag.reduce((n, i) => n + i.w * i.h, 0)} / {bagCols * bagRows}</b></div><div className="strict-bag-grid" onDragOver={event => event.preventDefault()} onDrop={() => moveLoot("bag")} style={{ gridTemplateColumns: `repeat(${bagCols},1fr)`, gridTemplateRows: `repeat(${bagRows},1fr)`, aspectRatio: `${bagCols}/${bagRows}` }}>{packedBag.map(item => <button draggable onDragStart={() => startLootDrag(item.id, "bag")} onDragEnd={finishLootDrag} onClick={() => openRaidItem(item, "bag")} aria-label={`查看${item.name}详情`} className={`packed-object grade-${item.grade} ${item.w * item.h <= 2 ? "compact-object" : ""}`} style={{ gridColumn: `${item.px + 1} / span ${item.w}`, gridRow: `${item.py + 1} / span ${item.h}` }} key={item.id}><b>{item.name}</b><small>{item.type === "食物" || item.type === "药品" ? "点击详情 · 可局内使用" : "点击详情 · 拖动整理"}</small></button>)}</div></div>
          {enemyDefeated && <div className="enemy-spoils"><div className="bag-title"><div><small>CAPTURED LOADOUT</small><h2>敌方背包</h2></div><b>{enemyLoot.length}件</b></div><p>敌队装备和搜刮物已经全部展开。点击物品尝试装入自己的背包。</p><div>{enemyLoot.map(item => <button className={`grade-${item.grade}`} onClick={() => takeEnemyLoot(item)} key={item.id}><span>{gradeNames[item.grade]} · {item.type}</span><b>{item.name}</b><small>{item.w}×{item.h} · ¥{item.value.toLocaleString()}</small></button>)}{enemyLoot.length === 0 && <span>敌方背包已检索完毕</span>}</div></div>}
          <div className="exit-routes"><small>EXTRACTION ROUTES</small><button onClick={() => startExtraction("原路撤离")}><b>原路撤离 · 7秒</b><span>始终可用 · 距离长但条件稳定</span></button><button disabled={zone < 1 || !(kit.tactical === "烟雾弹" || activeRole("侦察员"))} onClick={() => startExtraction("维修通道")}><b>维修通道 · 5秒</b><span>内部起可用 · 需烟雾弹或侦察员</span></button><button disabled={zone < 2 || ![...packedBag, ...safeLoot].some(item => item.name === "红区安全卡")} onClick={() => startExtraction("封锁线车库")}><b>封锁线车库 · 3秒</b><span>核心限定 · 消耗红区安全卡</span></button></div>
        </aside>
      </section>}
    {selectedRaidItem && <LootArchiveDetail item={selectedRaidItem.item} collected onClose={() => setSelectedRaidItem(null)} actionLabel={selectedRaidItem.source === "bag" && (selectedRaidItem.item.type === "食物" || selectedRaidItem.item.type === "药品") ? "立即在局内使用" : selectedRaidItem.source === "field" ? undefined : `丢弃物品 · 腾出 ${selectedRaidItem.item.w * selectedRaidItem.item.h} 格`} onAction={selectedRaidItem.source === "bag" && (selectedRaidItem.item.type === "食物" || selectedRaidItem.item.type === "药品") ? useSelectedRaidItem : selectedRaidItem.source === "field" ? undefined : discardRaidItem} actionTone={selectedRaidItem.source !== "field" && !(selectedRaidItem.source === "bag" && (selectedRaidItem.item.type === "食物" || selectedRaidItem.item.type === "药品")) ? "danger" : "default"} secondaryActionLabel={selectedRaidItem.source === "bag" && (selectedRaidItem.item.type === "食物" || selectedRaidItem.item.type === "药品") ? "丢弃此物品" : undefined} onSecondaryAction={discardRaidItem} secondaryActionTone="danger" />}
    {battle && <div className="modal-backdrop battle-layer"><section className="raid-battle-scene"><header><div><small>LIVE CONTACT · ROOM {roomIndex + 1}</small><h2>{roomNames[roomIndex]}交火</h2><p>每秒自动结算一轮攻击；弹药无限，行动前装备加成由三名队员共享。</p></div><div><span>脱离成功率</span><strong>{disengageChance}%</strong><button disabled={escapeCooldown > 0} onClick={attemptDisengage}>{escapeCooldown > 0 ? `${escapeCooldown}秒后可脱离` : "尝试脱离战斗"}</button></div></header><div className="combat-board"><section><div className="combat-side-title"><span>RV ACTION TEAM</span><b>{raidParty.filter(unit => unit.hp > 0).length}/3 可战</b></div>{raidParty.map(unit => <article className={unit.hp === 0 ? "downed" : ""} key={unit.id}><div><span>{unit.role}</span><b>{unit.name}</b></div><strong>{unit.hp}<small>/{unit.maxHp}</small></strong><i><em style={{ width: `${unit.hp / unit.maxHp * 100}%` }} /></i><footer><span>战斗 {unit.attack}</span><span>防御 {unit.defense}</span></footer></article>)}</section><div className="combat-center"><b>VS</b><span>自动交火</span><i /><small>敌我血量跨房间保留</small></div><section className="enemy-side"><div className="combat-side-title"><span>SCAVENGER SQUAD</span><b>{enemyParty.filter(unit => unit.hp > 0).length}/3 可战</b></div>{enemyParty.map(unit => <article className={unit.hp === 0 ? "downed" : ""} key={unit.id}><div><span>{unit.role}</span><b>{unit.name}</b></div><strong>{unit.hp}<small>/{unit.maxHp}</small></strong><i><em style={{ width: `${unit.hp / unit.maxHp * 100}%` }} /></i><footer><span>战斗 {unit.attack}</span><span>防御 {unit.defense}</span></footer></article>)}</section></div><div className="combat-log"><header><span>COMBAT FEED</span><b>失败脱离不会重置血量</b></header>{battleLogs.slice(0, 6).map((line, index) => <p className={index === 0 ? "latest" : ""} key={`${line}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span>{line}</p>)}</div></section></div>}
    {extracting > 0 && <div className="modal-backdrop extracting-layer"><div className="extract-countdown"><small>{selectedExit}</small><strong>{extracting}</strong><h2>不要让背包留在感染区</h2><p>{safeRemaining > 0 || enemyDefeated ? "撤离正在安全窗口内执行。" : `当前已暴露 ${overtime} 秒，撤离完成前仍可能遭遇敌队。`}</p><div><span>行动组生命 {Math.round(allyHpRatio * 100)}%</span><span>保险箱必定保留</span></div></div></div>}
  </main>;

  if (mode === "result") {
    const returned = [...packedBag, ...safeLoot];
    return <main className="result-shell"><section className="result-card"><small>RAID REPORT</small><h1>{returned.length ? "这次冒险带回了能改变房车的东西" : "撤离失败，至少人还在"}</h1><p>搜索 {searchedCount} 件物品，深入至{zoneNames[zone]}，停留 {Math.round(searchSeconds)} 秒，AI队伍状态：{ai.status}。</p><div className="outcome-list">{roundOutcome.map((line, i) => <div key={i}><span>{i ? "代价" : "结果"}</span><b>{line}</b></div>)}</div><div className="result-loot">{returned.map(item => <div key={item.id} className={`grade-${item.grade}`}><span>{safeLoot.some(entry => entry.id === item.id) ? "保险箱" : "背包"} · {gradeNames[item.grade]}</span><b>{item.name}</b><small>{purpose(item)}</small></div>)}</div>{survivorCandidates.length > 0 && <section className="result-candidates"><header><div><small>SURVIVOR SIGNALS</small><h2>发现 {survivorCandidates.length} 名幸存者</h2></div><span>只能选择其中一人加入</span></header><SurvivorCandidateChoices candidates={survivorCandidates} canRecruit={crew.length < 10} onRecruit={recruitCandidate} source="现场" /></section>}{relationshipCandidate && <div className="recruit-box midnight-recruit"><div className="recruit-avatar">{relationshipCandidate.name.slice(0, 1)}</div><div><small>极罕见 · 私人频道邂逅</small><h3>{relationshipCandidate.name}</h3><p>{relationshipCandidate.quality}{relationshipCandidate.role} · “{relationshipCandidate.tagline}”</p></div><button onClick={recruitRelationshipCandidate}>留下同行邀请</button></div>}<button className="primary settle" onClick={settleRun}>分类收进房车仓库 <i>→</i></button></section></main>;
  }

  const tabs: Tab[] = ["房车", "队伍", "仓库", "电脑", "黑市", "招聘", "伴侣", "物资图鉴", "人员图鉴"];
  return <main className="game-shell">
    <header className="topbar"><div className="brand"><span className="brand-mark">//</span><div><b>最后十席</b><small>感染区撤离 · 第 {day} 日</small></div></div><nav>{tabs.map(item => <button className={tab === item ? "active" : ""} onClick={() => setTab(item)} key={item}>{item}</button>)}</nav><div className="resources"><span>零件 <b>{resources.零件}</b></span><span>货币 <b>¥{resources.货币}</b></span><span>矿币 <b>{coins}</b></span></div></header>
    <section className="survival-strip"><div><span>全队饱食度</span><i><em style={{ width: `${satiety}%` }} /></i><b>{satiety}</b></div><div><span>全队健康</span><i><em style={{ width: `${teamHealth}%` }} /></i><b>{teamHealth}</b></div><p>生存值由10人共享 · 厨师与医疗员在战局外持续生效</p></section>

    {tab === "房车" && <><section className="hero-panel"><div className="route-kicker">ROUTE {String(day).padStart(2, "0")} · 距离封锁线 {Math.max(120, 780 - day * 24)} KM</div><h1>每一次深入，<br />都在赌下一次还能回来。</h1><p>房车关键部件仍然受损。选择三人进入地点，依靠全体成员的职业支援，在AI队伍撤离前带回真正有用途的物资。</p><div className="route-line"><span className="done" /><span className="current" /><span /><span /><span /></div><div className="hero-actions"><button className="primary" onClick={startRun}>配置下一次行动 <i>→</i></button><button className={resetArmed ? "reset-save armed" : "reset-save"} onClick={resetLocalGame}>{resetArmed ? "再次点击，确认清除存档" : "重新开始"}</button></div></section>
      <section className="dashboard-grid"><article className="panel crew-panel"><div className="panel-heading"><div><small>DAILY CONTRACT</small><h2>今日委托 · 深处传来的信号</h2></div><span className="selection-count">轻量目标</span></div><p className="commission-copy">深入任意地点核心并搜索至少2件物品。完成奖励 ¥600；不要求击败AI队伍。</p><div className="crew-row">{crew.slice(0, 6).map(person => <CrewCard key={person.id} person={person} selected={expedition.includes(person.id)} onClick={() => toggleExpedition(person.id)} />)}</div></article>
        <article className="panel rv-panel"><div className="panel-heading"><div><small>RV MAINLINE</small><h2>房车修复</h2></div><strong className="percent">{repairPercent}%</strong></div><div className="rv-visual"><div className="rv-body"><span className="window" /><span className="door" /><i /><i /></div></div><div className="repair-list">{Object.entries(repair).map(([name, value]) => <button key={name} onClick={() => repairPart(name as keyof typeof repair)}><span>{name}<i style={{ width: `${value * 10}%` }} /></span><b>{value} · {activeRole("机械师") ? 3 : 4}零件</b></button>)}</div></article>
      </section>
      <section className="upgrades-panel panel"><div className="panel-heading"><div><small>RV SYSTEMS</small><h2>房车建设</h2></div><span className="selection-count">搜索物资 → 提交零件 → 强化长期能力</span></div><div className="upgrade-grid">{Object.entries(upgrades).map(([name, level]) => <button onClick={() => upgradeRv(name as keyof typeof upgrades)} key={name}><span>{name.slice(0, 1)}</span><div><b>{name}</b><small>等级 {level}/3 · {6 + level * 4}零件</small></div><em>+</em></button>)}</div></section>
    </>}

    {tab === "队伍" && <section className="roster-page"><div className="roster-head"><div><small>CREW · GLOBAL SKILLS</small><h1>十个固定岗位</h1><p>岗位可以空缺，角色可拖动换位；所有已加入角色的主职业和兼任职业都会在战局内外生效。</p></div><span>{crew.length}<i>/10 人</i></span></div><div className="rv-roster-layout"><div className="rv-floorplan"><div className="rv-front-mark"><b>车头</b><span>固定岗位 · 可空缺</span></div><div className="rv-seat-grid">{rvStations.map((station, index) => { const personId = seatAssignments[index]; const person = crew.find(member => member.id === personId); const familiarity = person ? person.role === station.role ? "注册位置" : person.subRole === station.role ? "熟练" : "陌生" : ""; return <div key={station.role} className={`rv-seat ${draggedOverSeat === index ? "drag-over" : ""} ${person ? "occupied" : "empty"} ${familiarity === "陌生" ? "mismatch" : ""}`} onDragOver={event => { event.preventDefault(); setDraggedOverSeat(index); }} onDragLeave={() => setDraggedOverSeat(null)} onDrop={event => { event.preventDefault(); if (draggedCrew !== null) moveCrewToSeat(draggedCrew, index); }}>{person ? <div draggable onDragStart={() => setDraggedCrew(person.id)} onDragEnd={() => { setDraggedCrew(null); setDraggedOverSeat(null); }} onClick={() => setSelectedCrew(person.id)} className={`rv-person ${qualityClass[person.quality]} ${selectedCrew === person.id ? "selected" : ""}`}><div className="rv-person-top"><span>{person.score}</span><em>{station.role}</em></div><div className="rv-person-avatar">{person.name.slice(0, 1)}</div><b>{person.name}</b><small>{familiarity} · 本职{person.role}</small><i /></div> : <div className="vacant-seat"><span>+</span><b>{station.label}</b><small>空缺 · {station.role}</small></div>}<label>{station.skill}</label></div>; })}</div></div>
        {selected && <PersonDetail person={selected} joined panel exclusiveEquipped={exclusiveLoadout[selected.id]} exclusiveAvailable={equipmentStash.find(item => item.type === "专属" && item.exclusiveFor === selected.name)} onEquipExclusive={() => equipExclusive(selected)} onUnequipExclusive={() => unequipExclusive(selected)} />}
      </div><section className={`relationship-seats-panel ${companionUnlocked ? "" : "locked"}`}><header><div><small>MIDNIGHT CABIN · 2 EXTRA ROLES</small><h2>生活舱特殊岗位</h2><p>独立于十名幸存者编制；拖动已同行角色到伴侣席或拉拉队席。</p></div><span>{companionUnlocked ? `${assignedRelationships.length}/2 已入席` : "需要绯红邀约终端"}</span></header><div className="relationship-seat-row">{relationshipStations.map((station, index) => { const person = relationshipRoster.find(entry => entry.id === relationshipAssignments[index]); const familiarity = person ? person.role === station.role ? "注册位置" : "熟练" : ""; return <div className="relationship-seat" key={station.role} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); if (draggedRelationship !== null) moveRelationshipToSeat(draggedRelationship, index); }}>{person ? <button draggable onDragStart={() => setDraggedRelationship(person.id)} onDragEnd={() => setDraggedRelationship(null)} onClick={() => setSelectedRelationship(person)} className={`relationship-seat-person ${qualityClass[person.quality]}`}><span>{person.score}</span><div>{person.name.slice(0, 1)}</div><b>{person.name}</b><small>{familiarity} · {station.role}</small></button> : <div className="relationship-seat-empty"><span>{companionUnlocked ? "+" : "◇"}</span><b>{station.label}</b><small>{companionUnlocked ? `空缺 · ${station.role}` : "系统尚未解锁"}</small></div>}<label>{station.skill}</label></div>; })}</div>{companionUnlocked && <div className="relationship-bench"><span>待安排同行者</span>{relationshipRoster.filter(person => !relationshipAssignments.includes(person.id)).map(person => <button draggable onDragStart={() => setDraggedRelationship(person.id)} onDragEnd={() => setDraggedRelationship(null)} onClick={() => setSelectedRelationship(person)} key={person.id}><i>{person.name.slice(0, 1)}</i><b>{person.name}</b><small>{person.quality} · {person.role}</small></button>)}{relationshipRoster.length === 0 && <p>尚未邂逅同行者。可在核心区极低概率遇见，或前往“伴侣”板块发出高价邀请。</p>}</div>}</section>{selectedRelationship && <RelationshipDetail person={selectedRelationship} joined={relationshipRoster.some(entry => entry.name === selectedRelationship.name)} assigned={relationshipAssignments.includes(selectedRelationship.id)} onClose={() => setSelectedRelationship(null)} />}</section>}

    {tab === "仓库" && <section className="warehouse-page"><div className="roster-head"><div><small>THREE STORAGE ZONES · EACH 10×24</small><h1>分类仓库</h1><p>装备柜、冰箱和存储柜独立占格。点击物资先查看详情，再决定使用、提交、安装或出售。</p></div><span>{currentStorage.reduce((n, item) => n + item.w * item.h, 0)}<i>/240 格</i></span></div><div className="warehouse-tabs">{(["装备柜", "冰箱", "存储柜"] as StoreKind[]).map(item => <button className={warehouseTab === item ? "active" : ""} onClick={() => { setWarehouseTab(item); setSelectedStorageItem(null); }} key={item}>{item}<b>{item === "装备柜" ? equipmentStash.length : item === "冰箱" ? survivalStash.length : objectStash.length}</b></button>)}</div><div className="stash-layout"><WarehouseGrid items={currentStorage} action={setSelectedStorageItem} /><aside><small>{warehouseTab}</small><h3>{warehouseTab === "装备柜" ? "决定你能否把大货带回来" : warehouseTab === "冰箱" ? "维持全队共享生存值" : "主线、财富与长期生产"}</h3><p>{warehouseTab === "装备柜" ? "武器、护甲、背包与弹药。高级装备不会凭空出现，必须成功撤离。" : warehouseTab === "冰箱" ? "食物补饱食度，药品补健康；可在房车使用，部分可在局内双击应急。" : "零件提交房车，奢侈品出售，电脑设备安装，钥匙与搜救仪开启特殊系统。"}</p><div><span>已存物品</span><b>{currentStorage.length}</b></div><div><span>总估值</span><b>¥{currentStorage.reduce((n, item) => n + item.value, 0)}</b></div></aside></div>
      {selectedStorageItem && <div className="item-detail-backdrop" onClick={() => setSelectedStorageItem(null)}><article className={`item-detail-card item-grade-${selectedStorageItem.grade} ${selectedStorageItem.type === "专属" ? "exclusive" : ""}`} onClick={event => event.stopPropagation()}><button className="item-detail-close" onClick={() => setSelectedStorageItem(null)}>×</button><header><span>{gradeNames[selectedStorageItem.grade]} · {selectedStorageItem.type}</span><strong>¥{selectedStorageItem.value.toLocaleString()}</strong></header><div className="item-detail-art"><i>{selectedStorageItem.name.slice(0, 1)}</i><small>{selectedStorageItem.w} × {selectedStorageItem.h}</small></div><h2>{selectedStorageItem.name}</h2><p>{purpose(selectedStorageItem)}</p><section className="item-detail-story"><small>OBJECT HISTORY · 一句话档案</small><p>{lootStory(selectedStorageItem)}</p></section>{selectedStorageItem.exclusiveFor && <div className="warehouse-relic-bind"><span>身份绑定</span><b>{selectedStorageItem.exclusiveFor}</b><small>{selectedStorageItem.bonus}</small></div>}<div className="item-detail-stats"><div><span>占用空间</span><b>{selectedStorageItem.w * selectedStorageItem.h} 格</b></div><div><span>现场搜索</span><b>{selectedStorageItem.searchSeconds.toFixed(1)} 秒</b></div><div><span>存放位置</span><b>{storeKind(selectedStorageItem)}</b></div>{selectedStorageItem.type === "电脑" && <div><span>挖矿效率</span><b>+{miningYield(selectedStorageItem).toFixed(3)}/回合</b></div>}</div><div className="item-detail-actions">{(selectedStorageItem.type === "食物" || selectedStorageItem.type === "药品") && <button className="primary-action" onClick={() => useStoredItem(selectedStorageItem)}>{selectedStorageItem.type === "食物" ? "使用并恢复饱食度" : "使用并恢复健康"}</button>}{selectedStorageItem.type === "零件" && <button className="primary-action" onClick={() => submitStoredPart(selectedStorageItem)}>提交房车修复</button>}{selectedStorageItem.type === "电脑" && <button className="primary-action" disabled={selectedHardwareFull} onClick={() => { installHardware(selectedStorageItem); setSelectedStorageItem(null); setTab("电脑"); }}>{selectedHardwareFull ? `${selectedHardwareKind}插槽已满` : "安装到房车电脑"}</button>}{selectedStorageItem.name === "绯红邀约终端" && !companionUnlocked && <button className="primary-action crimson-action" onClick={unlockCompanionSystem}>启用终端 · 解锁伴侣板块</button>}{selectedStorageItem.type === "专属" && (() => { const owner = crew.find(person => person.name === selectedStorageItem.exclusiveFor); return <button className="primary-action" disabled={!owner || !!(owner && exclusiveLoadout[owner.id])} onClick={() => { if (owner) { equipExclusive(owner); setSelectedStorageItem(null); setSelectedCrew(owner.id); setTab("队伍"); } }}>{!owner ? `尚未获得${selectedStorageItem.exclusiveFor}` : exclusiveLoadout[owner.id] ? "该人物插槽已占用" : `装备给${owner.name}`}</button>; })()}<button className="sell-action" onClick={() => sellStoredItem(selectedStorageItem)}>出售 · ¥{selectedStorageItem.value.toLocaleString()}</button><button className="keep-action" onClick={() => setSelectedStorageItem(null)}>保留物品</button></div></article></div>}
    </section>}

    {tab === "电脑" && <section className="system-page"><div className="roster-head"><div><small>PASSIVE MINING RIG</small><h1>房车电脑</h1><p>CPU最多2个、GPU最多8个、内存最多5个。三类齐全才会在每回合结算时推进挖矿。</p></div><span>{miningRate.toFixed(3)}<i>币/回合</i></span></div><div className="mining-hero"><div><small>{miningOnline ? "ONLINE" : "OFFLINE · 缺少完整组件"}</small><h2>矿币进度 {(miningProgress * 100).toFixed(1)}%</h2><i><em style={{ width: `${miningProgress * 100}%` }} /></i><p>每满1.0进度获得1枚矿币。RTX6090单卡每回合 +0.1，GTX960单卡 +0.01。</p></div><button disabled={coins === 0} onClick={() => { setResources(prev => ({ ...prev, 货币: prev.货币 + coins * 1000 })); setCoins(0); }}>出售全部矿币<br /><b>¥{coins * 1000}</b></button></div><div className="computer-slots">{(["CPU", "GPU", "内存"] as HardwareKind[]).map(kind => <section key={kind}><header><div><small>{kind} SLOTS</small><h3>{kind}</h3></div><b>{installed[kind].length}/{({ CPU: 2, GPU: 8, 内存: 5 }[kind])}</b></header><div>{installed[kind].map(item => <button className={`hardware-chip grade-${item.grade}`} onClick={() => uninstallHardware(kind, item)} key={item.id}><b>{item.name}</b><small>+{miningYield(item).toFixed(3)}/回合 · 点击拆下</small></button>)}{Array.from({ length: ({ CPU: 2, GPU: 8, 内存: 5 }[kind]) - installed[kind].length }).map((_, i) => <span className="empty-hardware" key={i}>空插槽</span>)}</div></section>)}</div><div className="hardware-inventory"><div className="panel-heading"><div><small>AVAILABLE HARDWARE</small><h2>存储柜中的电脑设备</h2></div></div><div>{objectStash.filter(item => item.type === "电脑").map(item => <button onClick={() => installHardware(item)} className={`grade-${item.grade}`} key={item.id}><span>{gradeNames[item.grade]}</span><b>{item.name}</b><small>+{miningYield(item).toFixed(3)}币/回合</small></button>)}{!objectStash.some(item => item.type === "电脑") && <p>尚未带回电脑设备。诊疗中心与核心区域更容易找到。</p>}</div></div></section>}

    {tab === "黑市" && <section className="system-page"><div className="roster-head"><div><small>REFRESH EVERY TWO ROUNDS</small><h1>地下黑市</h1><p>每两回合刷新10件物品。点击物资先查看档案、故事和用途，再决定是否购买。</p></div><span>{day % 2 === 0 ? 2 : 1}<i>回合后刷新</i></span></div>{!hasMarketLiaison ? <div className="locked-system"><span>LOCKED</span><h2>需要黑市联络员</h2><p>在现场救援或使用搜救仪招募该职业后，暗网终端会自动开放。</p></div> : <div className="market-grid loot-market-grid">{marketOffers.map(item => <LootCard item={item} collected={collectedItems.includes(item.name)} onClick={() => setSelectedMarketItem(item)} key={item.id} />)}</div>}{selectedMarketItem && <LootArchiveDetail item={selectedMarketItem} collected={collectedItems.includes(selectedMarketItem.name)} onClose={() => setSelectedMarketItem(null)} actionLabel={resources.货币 < selectedMarketItem.value ? `货币不足 · 需要 ¥${selectedMarketItem.value.toLocaleString()}` : `购买 · ¥${selectedMarketItem.value.toLocaleString()}`} actionDisabled={resources.货币 < selectedMarketItem.value} onAction={() => { buyOffer(selectedMarketItem); setSelectedMarketItem(null); }} />}</section>}

    {tab === "招聘" && <section className="system-page"><div className="roster-head"><div><small>DIRECTED RESCUE</small><h1>幸存者搜救</h1><p>每次消耗搜救仪随机发现1–3名候选人，品质和职业分别随机，但只能选择其中一人加入。</p></div><span>{searchDevices}<i>个搜救仪</i></span></div>{!hasSearchCaptain ? <div className="locked-system"><span>LOCKED</span><h2>需要搜救队长</h2><p>普通高风险探索仍可能偶遇幸存者；招到搜救队长后才可进行定向搜救。</p></div> : <div className="recruit-system multi-candidate-recruit"><div><small>RESCUE SCANNER</small><h2>{survivorCandidates.length ? `无线电锁定 ${survivorCandidates.length} 名幸存者` : "发出一次随机搜救脉冲"}</h2><p>每次搜索都会重新随机，不再固定出现某个职业。品质概率为普通56%、熟练27%、精英11%、名家5%、传奇1%。</p><button className="primary" disabled={searchDevices === 0 || survivorCandidates.length > 0} onClick={scanSurvivor}>{survivorCandidates.length ? "请先选择一名候选人" : "消耗1个搜救仪"}</button></div>{survivorCandidates.length > 0 && <div className="candidate-selection-panel"><header><span>本次发现 {survivorCandidates.length} 人</span><b>限选 1 人</b></header><SurvivorCandidateChoices candidates={survivorCandidates} canRecruit={crew.length < 10} onRecruit={recruitCandidate} source="搜救" /></div>}</div>}</section>}

    {tab === "伴侣" && <section className="system-page companion-page"><div className="roster-head"><div><small>MIDNIGHT CABIN · PRIVATE CHANNEL</small><h1>伴侣</h1><p>魅力型角色独立于幸存者名额，只有伴侣席与拉拉队席中的两人会提供全局增益。</p></div><span>{relationshipRoster.length}<i>名同行者</i></span></div>{!companionUnlocked ? <div className={`companion-lock ${crimsonTerminal ? "ready" : ""}`}><div className="companion-lock-mark">♥</div><small>PRIVATE CHANNEL LOCKED</small><h2>暮色会客舱尚未启用</h2><p>在感染区找到红色品质「绯红邀约终端」，放入背包或保险箱并成功撤离。终端进入存储柜后即可使用并永久解锁。</p><div><span>核心区掉落</span><span>红色品质</span><span>撤离后生效</span></div>{crimsonTerminal ? <button className="primary crimson-action" onClick={unlockCompanionSystem}>使用绯红邀约终端 <i>→</i></button> : <button disabled>尚未获得解锁道具</button>}</div> : <><section className="midnight-contact"><div><small>PREMIUM CONTACT</small><h2>{relationshipCandidate ? "私人频道已有一份回应" : "向感染区发出一份高价邀约"}</h2><p>每次联络花费 ¥3,200。品质概率：普通 65%、熟练 24%、精英 8%、名家 2.7%、传奇 0.3%；核心区自然邂逅概率为0.5%。</p><div className="contact-price"><span>本次联络</span><b>¥3,200</b><em>已联络 {relationshipContacts} 次</em></div><button className="primary" disabled={!!relationshipCandidate || resources.货币 < 3200} onClick={contactRelationship}>{relationshipCandidate ? "先处理当前回应" : resources.货币 < 3200 ? "货币不足" : "发送绯红邀约"}</button></div>{relationshipCandidate ? <div className="midnight-candidate"><RelationshipCard person={relationshipCandidate} joined={false} onClick={() => setSelectedRelationship(relationshipCandidate)} /><button onClick={recruitRelationshipCandidate}>邀请加入同行名册</button></div> : <aside><span>0.5%</span><b>核心区自然邂逅</b><p>无需消耗邀约费用，但必须深入核心并持续搜索。</p></aside>}</section><div className="relationship-roster-head"><div><small>ON-ROAD RELATIONSHIPS</small><h2>已同行角色</h2></div><span>拖入队伍页的两个特殊岗位后才会生效</span></div><div className="relationship-grid">{relationshipRoster.map(person => <RelationshipCard person={person} joined assigned={relationshipAssignments.includes(person.id)} onClick={() => setSelectedRelationship(person)} key={person.id} />)}{relationshipRoster.length === 0 && <div className="relationship-empty"><span>♡</span><h3>名单还是空的</h3><p>发送一次邀约，或在核心区以0.5%概率完成自然邂逅。</p></div>}</div></>}{selectedRelationship && <RelationshipDetail person={selectedRelationship} joined={relationshipRoster.some(entry => entry.name === selectedRelationship.name)} assigned={relationshipAssignments.includes(selectedRelationship.id)} onClose={() => setSelectedRelationship(null)} />}</section>}

    {tab === "物资图鉴" && <section className="system-page loot-atlas-page"><div className="roster-head"><div><small>OBJECT COMPENDIUM · LOW TO HIGH</small><h1>感染区物资图鉴</h1><p>每件物资都有自己的用途与一句话档案；点击卡片查看完整详情。红色专属道具只能与对应传奇人物绑定。</p></div><span>{collectedItems.length}<i>/{fieldLootTemplates.length} 已收集</i></span></div><div className="atlas-tabs">{(["全部", "装备柜", "冰箱", "存储柜"] as const).map(item => <button className={atlasFilter === item ? "active" : ""} onClick={() => setAtlasFilter(item)} key={item}>{item}</button>)}</div><div className="atlas-grid loot-atlas-grid">{fieldLootTemplates.filter((item, index, all) => all.findIndex(entry => entry.name === item.name) === index).filter(item => atlasFilter === "全部" || storeKind({ ...item, id: 0 }) === atlasFilter).sort((a, b) => a.grade - b.grade || a.type.localeCompare(b.type, "zh-CN") || a.name.localeCompare(b.name, "zh-CN")).map(item => <LootCard item={item} collected={collectedItems.includes(item.name)} onClick={() => setSelectedAtlasItem(item)} key={item.name} />)}</div>{selectedAtlasItem && <LootArchiveDetail item={selectedAtlasItem} collected={collectedItems.includes(selectedAtlasItem.name)} onClose={() => setSelectedAtlasItem(null)} />}</section>}

    {tab === "人员图鉴" && <section className="system-page"><div className="roster-head"><div><small>PERSONNEL COMPENDIUM · LOW TO HIGH</small><h1>{peopleAtlasTab === "幸存者档案" ? "幸存者人员图鉴" : "魅力型角色"}</h1><p>{peopleAtlasTab === "幸存者档案" ? `${allPersonnelCatalog.length}份幸存者档案全部公开；点击卡片查看职业能力、装备与完整故事。` : `${allRelationshipCatalog.length}名成年魅力型角色独立收录；她们不占幸存者名额，并拥有专属卡面与暮色档案。`}</p></div><span>{peopleAtlasTab === "幸存者档案" ? crew.length : relationshipRoster.length}<i>/{peopleAtlasTab === "幸存者档案" ? allPersonnelCatalog.length : allRelationshipCatalog.length} 已同行</i></span></div><div className="atlas-tabs people-atlas-tabs">{(["幸存者档案", "魅力型角色"] as const).map(item => <button className={peopleAtlasTab === item ? "active" : ""} onClick={() => { setPeopleAtlasTab(item); setSelectedAtlasPerson(null); setSelectedRelationship(null); }} key={item}>{item}<small>{item === "幸存者档案" ? "十职业生存编制" : "伴侣 / 拉拉队员"}</small></button>)}</div>{peopleAtlasTab === "幸存者档案" ? <div className="people-atlas-grid">{[...allPersonnelCatalog].sort((a, b) => catalogQualities.indexOf(a.quality) - catalogQualities.indexOf(b.quality) || a.role.localeCompare(b.role, "zh-CN") || a.score - b.score).map(person => { const joined = crew.some(member => member.name === person.name); return <CrewCard person={person} joined={joined} onClick={() => setSelectedAtlasPerson(person)} key={`${person.role}-${person.name}`} />; })}</div> : <div className="relationship-grid atlas-relationship-grid">{[...allRelationshipCatalog].sort((a, b) => catalogQualities.indexOf(a.quality) - catalogQualities.indexOf(b.quality) || a.score - b.score).map(person => <RelationshipCard person={person} joined={relationshipRoster.some(entry => entry.name === person.name)} assigned={relationshipAssignments.includes(relationshipRoster.find(entry => entry.name === person.name)?.id ?? -1)} onClick={() => setSelectedRelationship(person)} key={person.id} />)}</div>}{selectedAtlasPerson && (() => { const joinedPerson = crew.find(member => member.name === selectedAtlasPerson.name); const detailPerson = joinedPerson ?? selectedAtlasPerson; return <PersonDetail person={detailPerson} joined={!!joinedPerson} exclusiveEquipped={joinedPerson ? exclusiveLoadout[joinedPerson.id] : undefined} exclusiveAvailable={joinedPerson ? equipmentStash.find(item => item.type === "专属" && item.exclusiveFor === joinedPerson.name) : undefined} onEquipExclusive={joinedPerson ? () => equipExclusive(joinedPerson) : undefined} onUnequipExclusive={joinedPerson ? () => unequipExclusive(joinedPerson) : undefined} onClose={() => setSelectedAtlasPerson(null)} />; })()}{selectedRelationship && <RelationshipDetail person={selectedRelationship} joined={relationshipRoster.some(entry => entry.name === selectedRelationship.name)} assigned={relationshipAssignments.includes(relationshipRoster.find(entry => entry.name === selectedRelationship.name)?.id ?? -1)} onClose={() => setSelectedRelationship(null)} />}</section>}
  </main>;
}
