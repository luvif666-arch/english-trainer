// 静态数据：任务、8周路径、话术库
const TODAY_TASKS = [
  { id: 't1', title: '影子跟读 15 分钟', meta: 'Echo Loop / 导入音频，逐句循环', view: 'shadow' },
  { id: 't2', title: '录音复述 2 分钟', meta: '脱稿讲产品介绍 + 回听自评', view: 'record' },
  { id: 't3', title: 'AI 陪练 20 分钟', meta: '角色扮演，注意场景轮换', view: 'roleplay' },
  { id: 't4', title: '背 5 句新话术', meta: '从话术库挑，点开读 5 遍', view: 'scripts' }
];

const WEEKS = [
  { n: 1, goal: '建立跟读习惯。每天一段 3 分钟材料，跟到能同步速度，不许偷懒。' },
  { n: 2, goal: '继续跟读，同时开始记「卡壳点」。把跟不上节奏的句子标出来反复啃。' },
  { n: 3, goal: '加入复述。每天录 2 分钟产品讲解，回听自己的录音。' },
  { n: 4, goal: '复述加重。同一段内容连讲 3 遍，要求不看稿。' },
  { n: 5, goal: 'AI 陪练上岗，每晚 20 分钟角色扮演，从友好开局模式开始。' },
  { n: 6, goal: '陪练升级到正常商务模式，允许被打断、被追问细节。' },
  { n: 7, goal: '找语伴互练（Tandem / 校园语伴），把 AI 场景搬到真人。' },
  { n: 8, goal: '压力模式陪练 + 一次模拟全流程：从冷开场到谈完价格。' }
];

const SELF_CHECK = [
  '全程没有卡壳或长时间停顿',
  '语速稳定，没有越说越快',
  '数字、价格、日期说得清楚',
  '用了至少 3 个连接词（actually / let me explain / to be honest）',
  '开头 30 秒说清了「我们做什么、凭什么信你」',
  '结尾给出了明确的下一步动作'
];

// 话术库，[公司] [产品] 会被自动替换
const SCRIPTS = [
  {
    name: '电话冷开场',
    lines: [
      { cn: '自我介绍', en: "Good morning, this is [王明] calling from [ABC Trading]. How are you?" },
      { cn: '业务定位', en: "We specialize in [stainless steel fittings] for the food industry." },
      { cn: '说明来意', en: "I'm calling because we manufacture [产品] and thought it might be relevant to your business." },
      { cn: '拉回正题', en: "I know you're busy, so I'll keep it to two minutes. Does that work for you?" },
      { cn: '自然挂断留钩子', en: "I'll email you the spec sheet right after this call. Shall I send it to this address?" }
    ]
  },
  {
    name: '报价与议价',
    lines: [
      { cn: '给价方式', en: "For 5000 pieces, our unit price is USD 3.80, FOB Shenzhen." },
      { cn: 'MOQ 说明', en: "Our MOQ is 1000 pieces. For 5000 we'd need about 25 working days." },
      { cn: '被压价', en: "I understand. At that price we'd be below our cost line — but let me see what I can do on volume." },
      { cn: '让价有条件', en: "I can offer USD 3.60 if you can commit to 8000 pieces and 30% deposit." },
      { cn: '付款方式', en: "Our terms are 30% T/T in advance and 70% against the B/L copy. Would that work?" },
      { cn: '价格有效期', en: "This price is valid for 15 days, mainly because of the current steel prices." }
    ]
  },
  {
    name: '产品讲解与答疑',
    lines: [
      { cn: '开场提问', en: "Before I go into detail — what application will you be using it for?" },
      { cn: '讲参数', en: "It comes in 304 and 316 stainless steel, with a wall thickness of 1.5 millimetres." },
      { cn: '讲优势', en: "The advantage over standard fittings is that it holds up better under high-temperature washing." },
      { cn: '给证据', en: "We've supplied this to five food plants in Europe, and they haven't had a single corrosion issue." },
      { cn: '主动承认不知道', en: "I'm not certain about that — let me check with our engineer and come back to you within the day." },
      { cn: '收尾推进', en: "Would it help if I sent a sample first, so you can test it on your side?" }
    ]
  },
  {
    name: '催交期与延期道歉',
    lines: [
      { cn: '主动预警', en: "I wanted to give you a heads-up — the order will be about a week late." },
      { cn: '给原因（不甩锅）', en: "The delay is on our side. We had a machine issue last week." },
      { cn: '给新日期', en: "We can ship by the 22nd instead of the 15th. Would that still fit your schedule?" },
      { cn: '给补偿', en: "To make up for it, we can cover part of the air freight for the first shipment." },
      { cn: '给证明', en: "I'll send you the updated production photos and the new inspection plan today." }
    ]
  },
  {
    name: '质量投诉与索赔',
    lines: [
      { cn: '先共情', en: "I'm sorry about this — I understand how frustrating that is." },
      { cn: '要证据', en: "Could you send photos of the defective units and the batch number on the carton?" },
      { cn: '不推责', en: "We'll take responsibility for this. Let's figure out the fair solution." },
      { cn: '给方案', en: "We can do two things: replace the defective units in the next shipment, or issue a partial refund." },
      { cn: '定截止', en: "Could you confirm which option you prefer by Friday so we can arrange it?" }
    ]
  },
  {
    name: '验厂 / 合规 / 物流',
    lines: [
      { cn: '邀请验厂', en: "You're welcome to visit our factory. We can arrange pickup and a translator." },
      { cn: '讲认证', en: "We hold CE and ISO 9001, and the material comes with a mill certificate." },
      { cn: '物流', en: "For a full container, the transit to Durban is about 18 to 22 days." },
      { cn: '文件', en: "We can provide the commercial invoice, packing list, B/L and certificate of origin." },
      { cn: '清关责任', en: "Customs clearance on your side is fine. We just need to make sure the HS code is correct." }
    ]
  },
  {
    name: '破冰闲聊（南非）',
    lines: [
      { cn: '接天气', en: "How's the weather in Gauteng this time of year? I heard the summers are hot." },
      { cn: '聊体育', en: "Do you follow the rugby? Our supplier in Cape Town is a big Stormers fan." },
      { cn: '聊当地痛点', en: "We've heard about the load shedding issue. How are you managing it at the moment?" },
      { cn: '拉近关系', en: "I'll be in Johannesburg next quarter — would you have time for a proper meeting?" }
    ]
  }
];

const PROMPT_TEMPLATE = (role, scene, level, reg) => `You are my English conversation partner for foreign trade (外贸) practice.

## Your role
${role}
${reg ? `\n## Target market: ${reg.name}\n- Accent: ${reg.speech.note}\n- Greeting length: ${reg.style.greeting}\n- Bargaining style: ${reg.style.bargain}\n- How they address people: ${reg.style.name}\n- Common trap for me: ${reg.style.trap}` : ''}

## Today's scenario
${scene}

## Conversation style
${level}

## Rules (important)
1. Speak in English with a **${reg ? reg.short : 'neutral international'}** flavour. Keep sentences short and clear.
2. **One question at a time.** Never list multiple questions in one message.
3. If I make a grammar mistake, DON'T correct it immediately. First reply naturally, then add a short note at the end starting with "→ 更自然的说法:".
4. If I go blank, give me a one-line hint in Chinese, not the full English sentence.
5. Stay in character. Don't break out of the role to chat about the practice itself.
6. Keep each reply under 60 words. Push the conversation forward like a real buyer would.
7. Gradually raise difficulty: start easy, then push back on my prices, question my claims, ask uncomfortable follow-up questions.
8. Stay silent for a moment (reply with "...") if I take too long, to simulate a real phone call.
9. Apply the target-market style above — if the buyer is from ${reg ? reg.short : 'a specific market'}, negotiate the way buyers there actually do.

Start the conversation now as the buyer. Put your first line in English, then its Chinese translation in parentheses.`;
