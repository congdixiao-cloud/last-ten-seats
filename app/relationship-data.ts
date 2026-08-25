import type { PersonnelQuality } from "./personnel-data";

export type RelationshipRole = "伴侣" | "拉拉队员";

export type RelationshipProfile = {
  name: string;
  age: number;
  role: RelationshipRole;
  subRole: RelationshipRole;
  quality: PersonnelQuality;
  score: number;
  charm: number;
  bond: number;
  tagline: string;
  story: string;
  skill: string;
  flaw: string;
};

export const relationshipProfiles: RelationshipProfile[] = [
  { name: "桃夭", age: 27, role: "伴侣", subRole: "拉拉队员", quality: "普通", score: 61, charm: 76, bond: 12, tagline: "靠近一点，我只把秘密说给今晚还醒着的人。", story: "灾变前是夜店营销，穿着短款红皮衣从后门逃出生天。她谈条件时总爱把声音压得很低，等对方想起要还价，交易通常已经结束。", skill: "暖夜陪伴：回合结算时全队健康 +2", flaw: "遇到香水和首饰时容易分心" },
  { name: "绯夏", age: 25, role: "拉拉队员", subRole: "伴侣", quality: "普通", score: 62, charm: 78, bond: 8, tagline: "别只看动作，跟上我的节奏。", story: "成年钢管舞教练，柔韧性让她能从建筑缝隙中钻过。她把房车扶梯叫作临时舞台，并坚持贴身训练服只是为了不妨碍行动。", skill: "节奏鼓舞：行动组三人综合评分 +2", flaw: "不喜欢过于沉闷的长期驻扎" },
  { name: "蜜糖", age: 29, role: "伴侣", subRole: "拉拉队员", quality: "普通", score: 60, charm: 79, bond: 16, tagline: "看杯子，别盯着调酒师。", story: "酒吧调酒师，围裙里面仍是灾变当晚的亮片礼服。她能把营养液调成约会饮料，也能用一句轻笑让最紧绷的队员放下戒备。", skill: "甜味安抚：每回合额外恢复饱食度 +2", flaw: "会私藏最后一颗糖" },

  { name: "露娜", age: 26, role: "拉拉队员", subRole: "伴侣", quality: "熟练", score: 70, charm: 84, bond: 18, tagline: "尾巴是风向标，角只是为了让你记住我。", story: "成年角色扮演者，穿着魅魔装参加漫展时跌入感染区。角、尾巴和过膝袜都奇迹般保留，她索性把服装改成兼具诱敌与侦察功能的舞台战衣。", skill: "魅影助威：行动组三人综合评分 +3", flaw: "容易把严肃简报变成摄影时间" },
  { name: "夜莺", age: 30, role: "伴侣", subRole: "拉拉队员", quality: "熟练", score: 71, charm: 83, bond: 24, tagline: "乖一点，针头就可以小一点。", story: "地下俱乐部的驻场护士，黑色长袜与束腰医疗包是她的个人制服。她处理伤口时温柔得过分，直到有人为了被照顾而故意装病。", skill: "贴身照料：回合结算时全队健康 +3", flaw: "对装病者会使用最大号针头" },
  { name: "维拉", age: 32, role: "拉拉队员", subRole: "伴侣", quality: "熟练", score: 72, charm: 82, bond: 15, tagline: "拉链停在那里，是为了散热。你有意见？", story: "动作替身演员，皮质战斗服总保持着危险又利落的剪裁。她单手翻过围墙后，通常没人还记得自己刚才准备反驳什么。", skill: "危险示范：遭遇成功率 +3%", flaw: "习惯用高风险动作解决小问题" },

  { name: "赤练", age: 29, role: "伴侣", subRole: "拉拉队员", quality: "精英", score: 80, charm: 88, bond: 22, tagline: "再盯着看，就进车底陪我递一整晚扳手。", story: "重机车改装师，短背心、低腰工具带和沾着机油的长腿是维修区最醒目的警示标志。她对机器与人的坏脾气都很有办法。", skill: "贴身检修：装备遗失概率 -4%", flaw: "不允许任何人碰她的私人扳手" },
  { name: "塞琳", age: 31, role: "拉拉队员", subRole: "伴侣", quality: "精英", score: 82, charm: 90, bond: 19, tagline: "你可以下注，但最好押我会赢。", story: "赌场安保主管，灾变后仍穿着开衩礼服和大腿枪套。她能在灯灭前命中目标，也能让试图搭讪的人输掉最后一盒子弹。", skill: "胜负挑逗：行动组三人综合评分 +5", flaw: "凡事都想赌一个彩头" },
  { name: "伊芙", age: 34, role: "伴侣", subRole: "拉拉队员", quality: "精英", score: 81, charm: 92, bond: 26, tagline: "我没有承诺什么，是你自己听懂了。", story: "私人会所老板，丝质吊带礼服外只披一件战术风衣。她擅长用香气、眼神和半句承诺完成谈判，但没人能证明她真的答应过什么。", skill: "私密交涉：黑市购买价格降低 6%", flaw: "她的每个答案都可能只有一半" },

  { name: "九尾", age: 33, role: "拉拉队员", subRole: "伴侣", quality: "名家", score: 89, charm: 95, bond: 25, tagline: "我不需要命令，你会自己走到正确的位置。", story: "心理战专家，红色贴身长裙与九尾狐面具是她的固定装束。她从不提高音量，只需坐到对面，敌人通常会交代钥匙、路线和感情经历。", skill: "狐火士气：遭遇成功率 +6%", flaw: "队员很难判断她哪句话是真心" },
  { name: "莫妮卡", age: 30, role: "伴侣", subRole: "拉拉队员", quality: "名家", score: 88, charm: 94, bond: 31, tagline: "先呼吸。至于醒来第一眼看见谁，随缘。", story: "自由潜水教练兼成年运动模特，贴身潜水服和过分镇定的笑容让她在水下救援中格外醒目。她清楚被救者醒来后常会忘记先道谢。", skill: "深呼吸：死亡概率 -3%，回合健康 +3", flaw: "对自己的闭气纪录过于执着" },
  { name: "黑蔷薇", age: 35, role: "拉拉队员", subRole: "伴侣", quality: "名家", score: 90, charm: 96, bond: 23, tagline: "真正的谢幕，要有爆炸、掌声，还有你的目光。", story: "成人电影歌舞秀台柱，灾变当晚穿着黑色亮片紧身衣杀出剧院。双枪藏在吊袜带枪套里，危险和舞台感从来不冲突。", skill: "终幕喝彩：行动组三人综合评分 +7", flaw: "安静撤离对她来说毫无美感" },

  { name: "魅魔莉莉丝", age: 999, role: "伴侣", subRole: "拉拉队员", quality: "传奇", score: 97, charm: 100, bond: 28, tagline: "别紧张，我今晚只收一点点欲望和很多黄金。", story: "失败的避难所召唤仪式带来了一名明确成年的魅魔。漆黑双角、薄翼和近乎犯规的曲线接管了谈判桌；账本却显示她真正偏爱的是黄金、香水与诚实的心跳。", skill: "绯红契约：全队健康 +5，遭遇成功率 +5%", flaw: "会对说谎者收取额外的‘利息’" },
  { name: "克利奥帕特拉", age: 39, role: "拉拉队员", subRole: "伴侣", quality: "传奇", score: 98, charm: 100, bond: 30, tagline: "跪下不是命令，只是多数人的自然反应。", story: "成年女王从王宫宴会跌入感染区，金饰、轻纱与统治者的从容一样不少。感染者不懂魅力，但幸存者首领往往在她抬眼前就同意交出补给。", skill: "女王凝视：行动组三人综合评分 +10", flaw: "拒绝睡上铺，也拒绝排队" },
  { name: "貂蝉", age: 24, role: "伴侣", subRole: "拉拉队员", quality: "传奇", score: 96, charm: 100, bond: 34, tagline: "两句话足够让敌人彼此解决，第三句留给你。", story: "成年的她从连环计宴席误入时空裂缝，薄纱舞衣与袖中短刃都在。她不必击败两支队伍，只需分别留下一句暧昧的暗示。", skill: "闭月连环：AI接近风险 -8，回合健康 +4", flaw: "几乎没人能拒绝她提出的请求" },
];
