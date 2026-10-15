// 实景对话料包
// 组织逻辑：按真实客户接触的时间线排列（打招呼 → 公司 → 产品 → 需求确认 → 报价议价 → 异议处理 → 成交收尾），
// 角色 you = 你（中国外贸业务员），other = 对方（南非买家）。
// 每句含 en 英文、cn 中文提示、role 角色、tip 可选的语气/逻辑提示。
// 语气按英式英语偏南非口音设计：短句、直接、偶有礼貌性停顿。

const DIALOGUES = [
  {
    id: 'd1',
    name: '剧本一 · 展位前地推搭话（30 秒定生死）',
    scene: '广交会 / 非洲展，陌生买家路过，你要在他走远之前拦住他。',
    levels: { you: 'A2–B1', other: '母语' },
    notes: [
      '地推的第一句**不是自我介绍**，是问句。问句天然能让人停下来，回答 "Sure, go ahead" 的概率远高于听完一整段介绍。',
      '开口 5 秒内必须出���"我能干什么"，别先讲公司历史。客户没耐心听背景。',
      '对方停下脚步后立刻给一个「选择题」："Are you looking for A or B?" —— 比 "What do you need?" 更容易接话。',
      '道别时留钩子："Send me your email, I\'ll send the price list tonight." 展后跟进全靠这一句。'
    ],
    lines: [
      { role: 'other', en: 'Excuse me, can I just look?', cn: '（路人，脚步没停）' },
      { role: 'you', en: 'Of course, take your time. Sorry to stop you — I just want to ask one quick question.', cn: '（先让步，再拦人）' },
      { role: 'you', en: 'Are you looking for furniture for a new project, or replacing existing pieces?', cn: '给选择题，别问"您需要什么"' },
      { role: 'other', en: 'New project. We are renovating a hotel in Cape Town.', cn: '（对方开始说了，机会来了）' },
      { role: 'you', en: 'That sounds like a decent size. What\'s the timeline — do you need it before the tourist season?', cn: '用"season"制造本地感，显示你知道南非节奏' },
      { role: 'other', en: 'Yes, ideally by November.', cn: '' },
      { role: 'you', en: 'That gives us about ten weeks. Let me send you a few options on WhatsApp — what\'s your number?', cn: '当场要联系方式，别问"can I email you"' },
      { role: 'other', en: 'Sure, +27 82 ...', cn: '' },
      { role: 'you', en: 'Perfect. I\'ll message you tonight with three designs. Enjoy the rest of the show.', cn: '结尾轻松，不要过度热情' }
    ]
  },
  {
    id: 'd2',
    name: '剧本二 · 展位内接待客户（完整需求确认）',
    scene: '客户主动走到你展位，坐下来，认真在听。这一段决定你要不要花三个月跟进。',
    levels: { you: 'B1–B2', other: '母语' },
    notes: [
      '**别打断客户讲产品**。他主动介绍自己的公司/项目时，那是最值钱的信息，让他说完，用 "That\'s a good point..." 回应。',
      '需求确认的核心句式是「三段式」：What are you using it for? → How many units do you need? → When do you need it? 顺序不能乱，先用途再数量再时间。',
      '南非客户普遍会先问价格，但如果一上来就报价，你会失去议价权。先用问题把需求框死。',
      '"That\'s quite ambitious" / "That makes sense" 这类短语是英式口语的缓冲垫，背下来能让你的句子像本地人。',
      '结束前必须问一句 "What else do you need from me?" —— 这句话往往能挖出隐藏需求。'
    ],
    lines: [
      { role: 'other', en: 'Hi, we\'re running a hotel group here. Do you supply hospitality furniture?', cn: '（直接问品类，很专业）' },
      { role: 'you', en: 'Yes, we do. We\'ve supplied hospitality projects in about twenty countries, mostly in Africa.', cn: '先给范围，不要吹数字' },
      { role: 'other', en: 'Mm. What do you actually make?', cn: '"actually" 提示他想要具体答案' },
      { role: 'you', en: 'Mostly beds, bedside tables, luggage racks and lounge chairs. We do custom sizing.', cn: '一口气报完，别挤牙膏' },
      { role: 'other', en: 'And you can do our own fabric?', cn: '' },
      { role: 'you', en: 'That\'s quite common for us. We\'d need your fabric code, and we\'ll send a swatch back for approval first.', cn: '"quite common" 是英式夸自己而不显傲慢的说法' },
      { role: 'other', en: 'OK. How many rooms are we talking about?', cn: '' },
      { role: 'you', en: 'Before I price it — roughly how many rooms, and what\'s your target landed cost per room?', cn: '先反问预算，别急着报价' },
      { role: 'other', en: 'About 120 rooms. Budget is around 900 euro per room.', cn: '' },
      { role: 'you', en: 'That\'s a workable number. Let me work out two options for you — one with standard fabric, one with your own.', cn: '给两个方案，别只给一个' },
      { role: 'other', en: 'Good. And lead time?', cn: '' },
      { role: 'you', en: '45 days after sample approval. I\'ll put it in writing, so you can plan around it.', cn: '"in writing" 在商务语境里是加分项' },
      { role: 'other', en: 'Send it over.', cn: '' },
      { role: 'you', en: 'Will do. And is there anything else you need from me — samples, a company profile, references?', cn: '这一句能挖出额外机会' }
    ]
  },
  {
    id: 'd3',
    name: '剧本三 · 报价后的异议处理（最难的一段）',
    scene: '你发了报价单，两天后客户回："Your price is too high." 你要回应。这是整个流程最容易崩的地方。',
    levels: { you: 'B2', other: '母语' },
    notes: [
      '**听到"太贵"的第一句永远是沉默或 "Let me explain"**，绝对不能立刻降价。降价是最后一步，不是第一步。',
      '回应异议的标准三步：Ask（问清贵在哪）→ Anchor（用价值锚定）→ Offer（给有条件的方案）。三步顺序不能乱。',
      '"I can do X, if you can Y" —— 有条件让步是唯一安全的让步方式。',
      '不要辩解成本结构，客户不关心。要谈的是他关心的：交期、质量风险、售后。',
      '英式表达里降级用 "That might be difficult."，比 "No problem!" 更稳，也更符合南非客户的沟通节奏。'
    ],
    lines: [
      { role: 'other', en: 'Thanks for the quote. But honestly, your price is too high.', cn: '（开门见山，最常见的开场）' },
      { role: 'you', en: 'I appreciate you telling me straight. Can I ask — compared to what? Are you looking at a similar spec from another supplier?', cn: '先问清参照系，别急着降价' },
      { role: 'other', en: 'We have one at about 15% less.', cn: '' },
      { role: 'you', en: 'That might be difficult, but it\'s useful to know. Can I ask what their lead time is, and whether they include the custom fabric?', cn: '把话题从价格拉到风险点' },
      { role: 'other', en: 'I don\'t know offhand. I\'ll find out.', cn: '' },
      { role: 'you', en: 'No rush. If their lead time is longer, that cost you carrying cost and risk of missing the season. Ours is 45 days, guaranteed in writing.', cn: '价值锚定：把价格换成风险差' },
      { role: 'other', en: 'That\'s fair. But I still need to close the gap somehow.', cn: '（他开始还价了，说明前面的锚定起作用了）' },
      { role: 'you', en: 'Here\'s what I can do. I can take off 6% if you commit to 120 units, and 3% more at 150. That gets us close without going below our cost line.', cn: '有条件让步，把量绑上去' },
      { role: 'other', en: 'Could you do 12% if I pay 50% upfront?', cn: '（还价，探你的底线）' },
      { role: 'you', en: '50% upfront would let me move you to our priority production line and lock the material price. With that, I can do 11%.', cn: '把条件换成对他的**好处**（排产优先级）' },
      { role: 'other', en: 'Let me check with my partner. Send it in writing.', cn: '（成了。他要书面确认）' },
      { role: 'you', en: 'Sending now. And to be clear — the 11% holds until Friday, because our steel prices are moving.', cn: '给时间压力，但理由要真实' }
    ]
  }
];
