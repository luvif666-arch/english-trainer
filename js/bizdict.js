// 离线外贸常用词词典 —— 即时响应，不依赖网络。
// 只收外贸谈判里真正高频、且中国学生容易搞错的词。
const BIZ_DICT = {
  // 报价与价格
  quotation: { ipa: '/kwəʊˈteɪʃn/', pos: 'n.', zh: '报价单', def: 'a formal statement of the price of something a seller offers to sell', ex: 'I\'ll send you the quotation by tomorrow.' },
  quote: { ipa: '/kwəʊt/', pos: 'v./n.', zh: '报价；引用', def: 'to state the price of something; a formal offer', ex: 'We quoted USD 3.80 FOB Shenzhen.' },
  moq: { ipa: '/em əʊ ˈkjuː/', pos: 'abbr.', zh: '最小起订量', def: 'Minimum Order Quantity — the smallest number a supplier will produce', ex: 'Our MOQ is 1000 pieces.' },
  fob: { ipa: '/ˌef əʊ ˈbiː/', pos: 'abbr.', zh: '离岸价（装运港船上交货）', def: 'Free On Board — buyer pays shipping from the named port', ex: 'Price is USD 3.80 FOB Shenzhen.' },
  cif: { ipa: '/ˌsiː aɪ ˈef/', pos: 'abbr.', zh: '到岸价（含成本、保险、运费）', def: 'Cost, Insurance and Freight — seller pays shipping to destination', ex: 'We can quote CIF Durban instead.' },
  exw: { ipa: '/ˌeks ˌdʌblju ˈdʌbljuː/', pos: 'abbr.', zh: '工厂交货价', def: 'Ex Works — buyer takes over at the seller\'s premises', ex: 'Quoted price is EXW.' },
  discount: { ipa: '/ˈdɪskaʊnt/', pos: 'n./v.', zh: '折扣；打折', def: 'a reduction in the usual price', ex: 'Can you give me a 5% discount?' },
  margin: { ipa: '/ˈmɑːdʒɪn/', pos: 'n.', zh: '利润率', def: 'the amount added to cost to determine the selling price', ex: 'The margin on this line is too thin.' },
  deposit: { ipa: '/dɪˈpɒzɪt/', pos: 'n.', zh: '定金；押金', def: 'a sum of money paid in advance as a guarantee', ex: '30% T/T deposit, 70% against B/L copy.' },
  instalment: { ipa: '/ɪnˈstɔːlmənt/', pos: 'n.', zh: '分期付款', def: 'one of a series of payments made over time', ex: 'We can accept two instalments.' },
  validity: { ipa: '/vəˈlɪdəti/', pos: 'n.', zh: '有效期', def: 'the period during which an offer remains open', ex: 'This price is valid for 15 days.' },
  // 订单与交付
  lead: { ipa: '/liːd/', pos: 'n.', zh: '交货周期', def: 'the time between placing an order and receiving the goods', ex: 'What\'s your lead time?' },
  delivery: { ipa: '/dɪˈlɪvəri/', pos: 'n.', zh: '交货；配送', def: 'the action or process of delivering goods', ex: 'Delivery is 45 days after sample approval.' },
  shipment: { ipa: '/ˈʃɪpmənt/', pos: 'n.', zh: '发货；装运', def: 'the sending of goods to a destination', ex: 'The shipment left Shenzhen last week.' },
  consignment: { ipa: '/kənˈsaɪnmənt/', pos: 'n.', zh: '寄售；托运货物', def: 'goods sent to a buyer who pays only when sold', ex: 'We can arrange a consignment.' },
  invoice: { ipa: '/ˈɪnvɔɪs/', pos: 'n.', zh: '发票', def: 'a list of goods sent with prices, used for payment', ex: 'I\'ll email the proforma invoice.' },
  // 物流
  freight: { ipa: '/freɪt/', pos: 'n.', zh: '运费', def: 'the cost of transporting goods', ex: 'Who pays the air freight?' },
  customs: { ipa: '/ˈkʌstəmz/', pos: 'n.', zh: '海关', def: 'the government office controlling goods entering a country', ex: 'Customs clearance is on your side.' },
  clearance: { ipa: '/ˈklɪərəns/', pos: 'n.', zh: '清关', def: 'official permission for goods to enter a country', ex: 'Clearance usually takes three days.' },
  shipment_terms: { ipa: '', pos: '', zh: '', def: '', ex: '' },
  logistics: { ipa: '/ləˈdʒɪstɪks/', pos: 'n.', zh: '物流', def: 'the organization of moving goods and people', ex: 'Our logistics partner handles customs.' },
  // 质量与问题
  defect: { ipa: '/ˈdiːfekt/', pos: 'n.', zh: '缺陷；瑕疵', def: 'a fault that prevents a product working properly', ex: 'Some units have a manufacturing defect.' },
  claim: { ipa: '/kleɪm/', pos: 'n./v.', zh: '索赔；主张', def: 'a formal request for money back on faulty goods', ex: 'We\'ll make a partial claim to cover this.' },
  complaint: { ipa: '/kəmˈpleɪnt/', pos: 'n.', zh: '投诉', def: 'an expression of dissatisfaction', ex: 'We received a complaint about the finish.' },
  replacement: { ipa: '/rɪˈpleɪsmənt/', pos: 'n.', zh: '替换品；补发', ex: 'We\'ll send replacements in the next shipment.' },
  refund: { ipa: '/ˈriːfʌnd/', pos: 'n.', zh: '退款', def: 'money returned to the buyer', ex: 'Would you prefer a refund or replacements?' },
  warranty: { ipa: '/ˈwɒrənti/', pos: 'n.', zh: '保修；质保', def: 'a guarantee that a product will be repaired or replaced', ex: 'We offer a 12-month warranty.' },
  // 谈判
  negotiate: { ipa: '/nɪˈɡəʊʃieɪt/', pos: 'v.', zh: '谈判；协商', def: 'to try to reach agreement by discussion', ex: 'We negotiated a lower price.' },
  negotiation: { ipa: '/nɪˌɡəʊʃiˈeɪʃn/', pos: 'n.', zh: '谈判', def: 'discussion aimed at reaching an agreement', ex: 'The negotiation took three rounds.' },
  concession: { ipa: '/kənˈseʃn/', pos: 'n.', zh: '让步', def: 'something given up to reach agreement', ex: 'We made a concession on the payment terms.' },
  compromise: { ipa: '/ˈkɒmprəmaɪz/', pos: 'n./v.', zh: '妥协；折中', def: 'an agreement where each side gives something up', ex: 'Let\'s find a compromise.' },
  objection: { ipa: '/əbˈdʒekʃn/', pos: 'n.', zh: '异议；反对', def: 'a statement of disagreement or disapproval', ex: 'How do you handle price objections?' },
  // 产品与规格
  spec: { ipa: '/spek/', pos: 'n.', zh: '规格；说明书', def: 'a detailed description of a product', ex: 'I\'ll email the spec sheet.' },
  specification: { ipa: '/ˌspesɪfɪˈkeɪʃn/', pos: 'n.', zh: '规格说明', def: 'a detailed and precise description', ex: 'Does it meet your specifications?' },
  sample: { ipa: '/ˈsɑːmpl/', pos: 'n.', zh: '样品', def: 'a small example of a product', ex: 'Can we get a sample first?' },
  swatch: { ipa: '/swɒtʃ/', pos: 'n.', zh: '色样；布样', def: 'a small piece of material showing its colour', ex: 'We\'ll send a fabric swatch for approval.' },
  tolerance: { ipa: '/ˈtɒlərəns/', pos: 'n.', zh: '公差（允许误差）', def: 'the permitted variation in size or quality', ex: 'The steel meets ±0.5mm tolerance.' },
  certificate: { ipa: '/səˈtɪfɪkət/', pos: 'n.', zh: '证书', def: 'an official document attesting a fact', ex: 'We hold CE and ISO 9001 certificates.' },
  compliance: { ipa: '/kəmˈplaɪəns/', pos: 'n.', zh: '合规；符合规定', def: 'obeying rules or regulations', ex: 'We need to check regulatory compliance.' },
  // 客户与关系
  prospect: { ipa: '/ˈprɒspekt/', pos: 'n.', zh: '潜在客户', def: 'a potential customer', ex: 'We met three new prospects at the fair.' },
  client: { ipa: '/ˈklaɪənt/', pos: 'n.', zh: '客户', def: 'a person or company buying a service or product', ex: 'Our largest client is in Germany.' },
  reference: { ipa: '/ˈrefrəns/', pos: 'n.', zh: '推荐信；参考', def: 'a statement about someone\'s ability or character', ex: 'Could you give us a reference?' },
  loyalty: { ipa: '/ˈlɔɪəlti/', pos: 'n.', zh: '忠诚度', def: 'loyal attachment to a person or brand', ex: 'Our repeat orders show customer loyalty.' },
  // 会议与沟通
  agenda: { ipa: '/əˈdʒendə/', pos: 'n.', zh: '议程', def: 'a list of items to be discussed at a meeting', ex: 'Let me go through the agenda.' },
  follow: { ipa: '/ˈfɒləʊ/', pos: 'v.', zh: '跟进', def: 'to check or act on something after an earlier event', ex: 'I\'ll follow up by email.' },
  confirm: { ipa: '/kənˈfɜːm/', pos: 'v.', zh: '确认', def: 'to state that something is definitely true', ex: 'Please confirm the order number.' },
  // 常用动词（中国学生易错）
  quote_terms: { ipa: '', pos: '', zh: '', def: '', ex: '' },
  reassure: { ipa: '/ˌriːəˈʃʊə/', pos: 'v.', zh: '使安心', def: 'to make someone feel confident', ex: 'Let me reassure you on the timing.' },
  clarify: { ipa: '/ˈklærəfaɪ/', pos: 'v.', zh: '澄清', def: 'to make something easier to understand', ex: 'Let me clarify that point.' },
  prioritise: { ipa: '/praɪˈɒrətaɪz/', pos: 'v.', zh: '优先处理', def: 'to treat something as more important', ex: 'We can prioritise your order.' },
  proceed: { ipa: '/prəˈsiːd/', pos: 'v.', zh: '继续进行', def: 'to continue with an action already started', ex: 'Shall we proceed with the sample?' },
  // 高频短语
  moq_note: { ipa: '', pos: '', zh: '', def: '', ex: '' },
  purchase: { ipa: '/ˈpɜːtʃəs/', pos: 'v./n.', zh: '采购；购买', def: 'to buy something', ex: 'They purchase 200 units monthly.' },
  quantity: { ipa: '/ˈkwɒntəti/', pos: 'n.', zh: '数量', def: 'the amount or number of something', ex: 'What quantity are you looking for?' },
  capacity: { ipa: '/kəˈpæsəti/', pos: 'n.', zh: '产能；容量', def: 'the maximum amount a factory can produce', ex: 'Our monthly capacity is 50,000 units.' },
  equipment: { ipa: '/ɪˈkwɪpmənt/', pos: 'n.', zh: '设备', def: 'the tools and machines needed', ex: 'All our equipment is German-made.' },
  factory: { ipa: '/ˈfæktri/', pos: 'n.', zh: '工厂', def: 'a building where goods are produced', ex: 'You\'re welcome to visit our factory.' },
  partner: { ipa: '/ˈpɑːtnə/', pos: 'n.', zh: '合作伙伴', def: 'a person or company you work with', ex: 'Our logistics partner handles shipping.' },
  urgent: { ipa: '/ˈɜːdʒənt/', pos: 'adj.', zh: '紧急的', def: 'requiring immediate action', ex: 'Is the order urgent?' },
  schedule: { ipa: '/ˈʃedjuːl/', pos: 'n./v.', zh: '日程；安排', def: 'a plan listing when things are to happen', ex: 'Does that fit your schedule?' },
  delay: { ipa: '/dɪˈleɪ/', pos: 'n./v.', zh: '延误', def: 'a period of time by which something is late', ex: 'There will be a one-week delay.' },
  risk: { ipa: '/rɪsk/', pos: 'n.', zh: '风险', def: 'the possibility of loss or harm', ex: 'There\'s a risk of missing the season.' },
  // 形容词
  durable: { ipa: '/ˈdjʊərəbl/', pos: 'adj.', zh: '耐用的', def: 'able to last a long time without breaking', ex: 'It\'s very durable under high heat.' },
  competitive: { ipa: '/kəmˈpetətɪv/', pos: 'adj.', zh: '有竞争力的', def: 'able to compete on price or quality', ex: 'Our price is very competitive.' },
  reasonable: { ipa: '/ˈriːznəbl/', pos: 'adj.', zh: '合理的', def: 'fair and sensible', ex: 'That sounds reasonable.' },
  flexible: { ipa: '/ˈfleksəbl/', pos: 'adj.', zh: '灵活的', def: 'able to change to suit conditions', ex: 'We\'re flexible on payment terms.' },
  substantial: { ipa: '/səbˈstænʃl/', pos: 'adj.', zh: '大量的', def: 'large in amount or importance', ex: 'They placed a substantial order.' },
  // 高频短语动词
  followup: { ipa: '', pos: '', zh: '', def: '', ex: '' },
  upfront: { ipa: '/ˌʌpˈfrʌnt/', pos: 'adj./adv.', zh: '预付的；坦率的', def: 'paid in advance; direct and honest', ex: 'We ask 30% payment upfront.' },
  meanwhile: { ipa: '/ˈmiːnwaɪl/', pos: 'adv.', zh: '与此同时', def: 'at the same time', ex: 'Meanwhile, we can start the artwork.' },
  nonetheless: { ipa: '/ˌnʌnðəˈles/', pos: 'adv.', zh: '尽管如此', def: 'in spite of that', ex: 'The cost is high; nonetheless, it\'s worth it.' },
  whereas: { ipa: '/ˌweərˈæz/', pos: 'conj.', zh: '然而；反之', def: 'used to contrast two facts', ex: 'They pay more, whereas we deliver faster.' },
  albeit: { ipa: '/ɔːlˈbiːɪt/', pos: 'conj.', zh: '虽然', def: 'although', ex: 'Fast, albeit expensive.' },
  ample: { ipa: '/ˈæmpl/', pos: 'adj.', zh: '充足的', def: 'more than enough', ex: 'We have ample stock.' },
  commence: { ipa: '/kəˈmens/', pos: 'v.', zh: '开始', def: 'to begin', ex: 'Production commences next week.' },
  entail: { ipa: '/ɪnˈteɪl/', pos: 'v.', zh: '涉及；需要', def: 'to involve or require', ex: 'This entails extra inspection.' },
  viable: { ipa: '/ˈvaɪəbl/', pos: 'adj.', zh: '可行的', def: 'able to work successfully', ex: 'Is 10,000 units viable for you?' },
  // 中国学生高频错词
  shipment_ready: { ipa: '', pos: '', zh: '', def: '', ex: '' },
  inquire: { ipa: '/ɪnˈkwaɪə/', pos: 'v.', zh: '询问', def: 'to ask for information', ex: 'I\'m inquiring about your lead time.' },
  assure: { ipa: '/əˈʃʊə/', pos: 'v.', zh: '保证', def: 'to promise something will happen', ex: 'I assure you the quality is fine.' },
  insure: { ipa: '/ɪnˈʃʊə/', pos: 'v.', zh: '给……投保', def: 'to buy insurance for something', ex: 'The goods are insured to destination.' },
  // 常用缩写
  cif_note: { ipa: '', pos: '', zh: '', def: '', ex: '' },
  po: { ipa: '/ˌpiː ˈəʊ/', pos: 'abbr.', zh: '采购订单', def: 'Purchase Order', ex: 'We received your PO.' },
  pi: { ipa: '/ˌpiː ˈaɪ/', pos: 'abbr.', zh: '形式发票', def: 'Proforma Invoice', ex: 'I\'ll send the PI for your approval.' },
  bl: { ipa: '/ˌbiː ˈel/', pos: 'abbr.', zh: '提单', def: 'Bill of Lading — shipping document', ex: '70% against the B/L copy.' },
  tt: { ipa: '/ˌtiː ˈtiː/', pos: 'abbr.', zh: '电汇', def: 'Telegraphic Transfer — bank transfer', ex: '30% T/T in advance.' },
  lcl: { ipa: '/ˌel siː ˈel/', pos: 'abbr.', zh: '拼箱', def: 'Less than Container Load', ex: 'We can ship LCL to save cost.' },
  fcl: { ipa: '/ˌef siː ˈel/', pos: 'abbr.', zh: '整箱', def: 'Full Container Load', ex: 'A full container is cheaper per unit.' },
  hs: { ipa: '/ˌeɪtʃ ˈes/', pos: 'abbr.', zh: '海关编码', def: 'Harmonized System code for customs', ex: 'Let\'s confirm the HS code.' },
  ce: { ipa: '/ˌsiː ˈiː/', pos: 'abbr.', zh: '欧盟认证标志', def: 'Conformité Européenne — EU safety mark', ex: 'Our products carry CE marking.' },
  oem: { ipa: '/ˌəʊ iː ˈem/', pos: 'abbr.', zh: '代工生产', def: 'Original Equipment Manufacturer', ex: 'We offer OEM service.' },
  moq_urgent: { ipa: '', pos: '', zh: '', def: '', ex: '' },
};

// 清理占位空条目
Object.keys(BIZ_DICT).forEach(k => {
  const v = BIZ_DICT[k];
  if (!v.def && !v.zh) delete BIZ_DICT[k];
});

// 判断是否在离线词典里（支持简单词形还原）
function lookupLocal(word) {
  const w = word.toLowerCase().replace(/[^a-z'-]/g, '');
  if (BIZ_DICT[w]) return { found: true, ...BIZ_DICT[w] };
  // 常见后缀还原
  const tries = [w.replace(/s$/, ''), w.replace(/es$/, ''), w.replace(/ies$/, 'y'),
    w.replace(/ing$/, ''), w.replace(/ing$/, 'e'), w.replace(/ed$/, ''), w.replace(/ed$/, 'e'),
    w.replace(/er$/, ''), w.replace(/ly$/, '')];
  for (const t of tries) {
    if (BIZ_DICT[t]) {
      const base = BIZ_DICT[t];
      return { found: true, ...base, inflected: w };
    }
  }
  return { found: false };
}
