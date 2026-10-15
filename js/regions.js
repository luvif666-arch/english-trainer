// 地区包：口音、语音参数、商务风格、专属话术差异
// 说明：真正影响成交的是"寒暄长度 / 议价风格 / 称呼方式"三项，口音只影响沟通流畅度。

const REGIONS = [
  {
    id: 'us',
    name: '美国 / 通用美式（默认·最主流通用）',
    short: '美式 GA',
    voice: 'en-US',
    flag: '★',
    common: true,
    desc: '国际商务的默认通用语。阿里国际站、展会资料、跨国会议、绝大多数外贸邮件模板都是美式。买家覆盖最广。',
    speech: { rate: 1.05, note: '语速偏快，句尾常上扬，显得有底气' },
    style: {
      greeting: '直接切入，最多 1–2 句寒暄就进正题',
      name: '直接用名字（Hi John），Mr. 只在正式邮件里用',
      bargain: '喜欢开门见山砍价，理性、不绕弯，会直接说"beat your price"',
      decision: '关注 ROI 和数字，喜欢被给选项而不是被说服',
      trap: '过度寒暄会被认为拖沓；只讲产品不讲数字会被认为没底气'
    },
    words: [
      { en: 'Let\'s get straight to it.', cn: '我们直接进入正题。' },
      { en: 'Here\'s the bottom line.', cn: '核心结论是这��。' },
      { en: 'What are you looking for?', cn: '你想找什么？' },
      { en: 'If we can get it under X, would you be interested?', cn: '如果能做到 X 以下，你有兴趣吗？' }
    ]
  },
  {
    id: 'uk',
    name: '英国 / 澳新（英式英语）',
    short: '英式 RP',
    voice: 'en-GB',
    desc: '正式、克制、重条款。英国客户尤其在意措辞的礼貌程度和逻辑严密性。澳新更随意一些。',
    speech: { rate: 0.95, note: '语速慢，元音长，句尾下沉' },
    style: {
      greeting: '需要完整寒暄，"How are you?"是真问句，要答',
      name: '用Mr./Ms. + 姓氏，直到对方主动提议用名字',
      bargain: '不直接砍价，用"我理解…"绕圈提，最终给的是"最优惠方案"',
      decision: '看重资质、认证、责任条款，决策慢但一旦定下不返工',
      trap: '直接说"太贵"会显得粗鲁；用"quite"和"might"这类缓冲词'
    },
    words: [
      { en: 'I was wondering if you might be able to...', cn: '不知您能否……（委婉请求）' },
      { en: 'That might be rather difficult, but let me explain.', cn: '那可能比较难，但我说明一下。' },
      { en: 'Shall I send you a revised quotation?', cn: '我给您发一份修改后的报价好吗？' },
      { en: 'Apologies for the delay — it was entirely our oversight.', cn: '很抱歉延误，这完全是我们疏忽。' }
    ]
  },
  {
    id: 'me',
    name: '中东 / 非洲（阿语、印地语区）',
    short: '中东印地',
    voice: 'en-US',
    desc: '先建立关系，再谈生意。寒暄可能长达十几分钟。英语常带本土口音，但沟通热情度高、重长期关系。',
    speech: { rate: 0.9, note: '语速慢，音节拉长，v/w 常混用' },
    style: {
      greeting: '寒暄极长，先问健康、家庭、宗教、旅途，再谈业务',
      name: '用Mr. + 姓氏，先问"May I call you...?"',
      bargain: '极少直接砍价，靠拉关系、给面子来拿更好的条件',
      decision: '信任建立后极爽快，信任不到寸步难行',
      trap: '一上来就报价会被认为不礼貌；催单会被认为不近人情'
    },
    words: [
      { en: 'Before we discuss business, how is your family?', cn: '谈生意之前，先问家人好吗？' },
      { en: 'We have worked together for three years now.', cn: '我们已经合作三年了。' },
      { en: 'Inshallah we can arrange it by next month.', cn: '如果真主愿意，我们下个月可以安排。' },
      { en: 'Please give us the honour of your reference.', cn: '请给我们做您的推荐。' }
    ]
  },
  {
    id: 'latam',
    name: '拉美 / 西语区（墨西哥、巴西、智利）',
    short: '拉美',
    voice: 'en-US',
    desc: '热情、语速快、情绪外露。关系好会砍得很凶，但一旦认你是长期伙伴，忠诚度极高。',
    speech: { rate: 1.1, note: '语速快，语调起伏大' },
    style: {
      greeting: '热情拥抱式寒暄，问天气/行程后才进正题',
      name: '直接用名字，立刻变熟人（Carlos,你好吗！）',
      bargain: '砍价凶、试探多，常从"价格不对"开始反复拉扯',
      decision: '看长期成本账，但会因为关系好而选择你',
      trap: '西语区的"maybe"往往是"可以"，"考虑一下"多半是要'
    },
    words: [
      { en: 'How was your trip? Did you manage to rest?', cn: '旅途怎么样？休息好了吗？' },
      { en: 'Let me be honest with you — the first price is not our best.', cn: '跟你说实话，首价不是我们的最优价。' },
      { en: 'We can do better if you take the full container.', cn: '整柜的话价格能更好。' },
      { en: 'I\'ll treat you to lunch this week.', cn: '这周我请你吃个饭。' }
    ]
  },
  {
    id: 'sea',
    name: '东南亚 / 印度洋（印尼、越南、泰国、菲律宾、马来）',
    short: '东南亚',
    voice: 'en-US',
    desc: '语速慢、句式简单、敬语多。对价格极其敏感，但决定慢，需要反复确认。',
    speech: { rate: 0.85, note: '语速慢，尾音拖长，句子短' },
    style: {
      greeting: '礼貌寒暄，用敬语，时间观念较弱',
      name: '用Mr./Ms. + 姓氏，加 "Sir/Madam" 称呼',
      bargain: '反复压价是常态，甚至会绕几轮再回来',
      decision: '看关系+价格，双重门槛，缺一不可',
      trap: '"Yes"可能只是"我听到了"，不是"我同意"'
    },
    words: [
      { en: 'Good morning, sir. May I know your final quantity?', cn: '早上好，先生。请问最终数量是多少？' },
      { en: 'Please kindly send us the updated price.', cn: '烦请提供最新价格。' },
      { en: 'We are still checking with our factory.', cn: '我们还在跟工厂确认。' },
      { en: 'Thank you for your patience. I will update you tomorrow.', cn: '感谢耐心，我明天给您更新。' }
    ]
  },
  {
    id: 'in',
    name: '印度 / 南亚',
    short: '印度',
    voice: 'en-US',
    desc: '英语水平高但口音独特，v/w 混淆常见、t 浊化。沟通礼貌、逻辑强，擅长邮件谈判。',
    speech: { rate: 0.95, note: '音节多音节化，thirty 听成 dirty' },
    style: {
      greeting: '正式寒暄，习惯先确认议程',
      name: '用Mr./Ms. + 姓氏，商务场合偏好完整称呼',
      bargain: '压价有理有据，会引用市场数据，谈判技术高',
      decision: '文件要求严格，合同条款必读',
      trap: '听不清不是听不懂，是口音；把 "dirty/thirty" 听错会出笑话'
    },
    words: [
      { en: 'Thank you for your time today.', cn: '感谢您今天的时间。' },
      { en: 'Could you share the specification sheet?', cn: '可以提供规格书吗？' },
      { en: 'We would be happy to review the terms.', cn: '我们很乐意审阅条款。' },
      { en: 'Let me revert to you by Monday.', cn: '我周一回复您。' }
    ]
  }
];

function getRegion(id) {
  return REGIONS.find(r => r.id === id) || REGIONS[0];
}
