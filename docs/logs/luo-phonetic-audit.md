# 用户 luo 收藏词音标审计

## 范围
- 数据源: 生产环境导出 (`.omc/research/luo-prod-*`, 2026-04-29 快照)
- 收藏词数: **110** (来自 `luo-prod-favorite-phonetics-20260429.csv`)
- 评估依据: `luo-prod-favorite-phonetic-final-report-20260429-rerun.json` (最终 rerun 报告)
- 当前音标库: `vocabulary_data/phonetic_overrides.json` (共 **464** 项)

## 状态汇总

| 状态 | 数量 | 含义 |
|---|---|---|
| 已修复 (override 已生效) | 14 | 当前音标库已经覆盖了 4/29 报告里的所有确认修复 |
| 短语策略未处理 | 4 | 词组词条,需独立产品策略(不能简单替换 IPA) |
| unsafe 标记未清除 | 12 | catalog 当时展示含 `( )` `ᵊ` `{}` 等不安全 marker,现在 override 里还是没有 |
| LLM 拒绝但 unsafe 未清理 | 0 | 4/29 LLM 拒绝,但当时的 unsafe marker 还在 |
| 人工审核未跟进 | 0 | 4/29 标 manual_review 且 catalog 含 unsafe marker,仍未修复 |
| review 已确认未修复 | 0 | 4/29 首次 review 报告确认过 catalog 错误,但现在 override 仍缺 |
| blank-with-suggestion 未修复 | 0 | catalog 当年音标为空白但有源建议,现在仍为空 |
| fixed_locally 但缺 override | 0 | 4/29 报告标记为 local_fixable,当前音标库没收录 |
| **未修复合计** | **16** | **仍需补** |

## 详细审计

### 短语词条 — 需单独产品策略

共 4 个:

- **interact with** `phrase_policy_needed` (雅思阅读高频词汇 / 词组6~7次)
  - catalog_then: `/ˌɪntərˈækt/`
  - suggested: `` (LLM: `/ˌɪntərˈækt/`)
  - override_now: `/ˌɪntərˈækt wɪð/`
  - note: 短语词条不应按单词 IPA 规则直接修；需单独处理短语展示/TTS。

- **in a sense** `phrase_policy_needed` (雅思阅读高频词汇 / 词组11~19次)
  - catalog_then: `/way /`
  - suggested: `` (LLM: `/way /`)
  - override_now: `/ɪn ə sens/`
  - note: 短语词条不应按单词 IPA 规则直接修；需单独处理短语展示/TTS。

- **for centuries** `phrase_policy_needed` (雅思阅读高频词汇 / 词组11~19次)
  - catalog_then: `/ˈsentʃəriz/`
  - suggested: `` (LLM: `/ˈsentʃəriz/`)
  - override_now: `/fə ˈsentʃəriz/`
  - note: 短语词条不应按单词 IPA 规则直接修；需单独处理短语展示/TTS。

- **blood pressure** `phrase_policy_needed` (雅思听力高频词汇 / 词组7次)
  - catalog_then: `/ˈblʌd preʃə(r)/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈblʌd preʃə(r)/`)
  - override_now: `(空)`
  - note: 短语词条不应按单词 IPA 规则直接修；需单独处理短语展示/TTS。


### unsafe 标记未清除 (catalog 当时有 `( )` `ᵊ` `{}`, override 仍缺)

共 12 个:

- **direction** `manual_or_audio_review` (雅思听力高频词汇 / 答案词4次③)
  - catalog_then: `/dəˈrekʃ(ə)n/`  ⚠️ unsafe
  - suggested: `` (LLM: `/dəˈrekʃ(ə)n/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **metals** `manual_or_audio_review` (雅思听力高频词汇 / 答案词4次③)
  - catalog_then: `/ˈmet(ə)lz/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈmet(ə)lz/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **lecture** `manual_or_audio_review` (雅思听力高频词汇 / 答案词4次②)
  - catalog_then: `/ˈlektʃə(r)/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈlektʃə(r)/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **flexible** `manual_or_audio_review` (雅思听力高频词汇 / 答案词4次②)
  - catalog_then: `/ˈfleksəb(ə)l/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈfleksəb(ə)l/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **fountain** `manual_or_audio_review` (雅思听力高频词汇 / 答案词4次②)
  - catalog_then: `/ˈfaʊnt(ə)n/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈfaʊnt(ə)n/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **ocean** `manual_or_audio_review` (雅思听力高频词汇 / 答案词4次①)
  - catalog_then: `/ˈəʊʃ(ə)n/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈəʊʃ(ə)n/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **door** `manual_or_audio_review` (雅思听力高频词汇 / 答案词5次)
  - catalog_then: `/dɔː(r)/`  ⚠️ unsafe
  - suggested: `` (LLM: `/dɔː(r)/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **tutor** `manual_or_audio_review` (雅思听力高频词汇 / 答案词5次)
  - catalog_then: `/ˈtjuːtə(r)/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈtjuːtə(r)/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **theatre** `manual_or_audio_review` (雅思听力高频词汇 / 答案词5次)
  - catalog_then: `/ˈθɪətə(r)/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈθɪətə(r)/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **temperatures** `manual_or_audio_review` (雅思听力高频词汇 / 答案词6次)
  - catalog_then: `/ˈtemprətʃə(r)z/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈtemprətʃə(r)z/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **car** `manual_or_audio_review` (雅思听力高频词汇 / 答案词8~9次)
  - catalog_then: `/kɑː(r)/`  ⚠️ unsafe
  - suggested: `` (LLM: `/kɑː(r)/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **animal** `manual_or_audio_review` (雅思听力高频词汇 / 答案词10次及以上)
  - catalog_then: `/ˈænɪm(ə)l/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈænɪm(ə)l/`)
  - override_now: `(空)`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。


### 已修复 (供交叉验证)

共 14 个:

- **reptiles** `fixed_locally` (雅思阅读高频词汇 / 10次②)
  - catalog_then: `/ˈreptaɪlz/`
  - suggested: `/ˈreptaɪlz/` (LLM: `/ˈreptɪlz/`)
  - override_now: `/ˈreptaɪlz/`
  - note: plural_z_missing_in_catalog

- **socio** `fixed_locally` (雅思阅读高频词汇 / 13次①)
  - catalog_then: `/'səʊsɪəʊ/`
  - suggested: `/ˈsəʊsɪəʊ/`
  - override_now: `/ˈsəʊsɪəʊ/`
  - note: stress_mark_normalized_from_ascii_apostrophe

- **tortoises** `fixed_locally` (雅思阅读高频词汇 / 12次②)
  - catalog_then: `/ˈtɔːtəsɪz/`
  - suggested: `/ˈtɔːtəsɪz/`
  - override_now: `/ˈtɔːtəsɪz/`
  - note: plural_es_missing_in_catalog

- **villagers** `fixed_locally` (雅思阅读高频词汇 / 14次②)
  - catalog_then: `/ˈvɪlɪdʒəz/`
  - suggested: `/ˈvɪlɪdʒəz/`
  - override_now: `/ˈvɪlɪdʒəz/`
  - note: plural_z_missing_in_catalog

- **turbines** `fixed_locally` (雅思听力高频词汇 / 听力原文12次)
  - catalog_then: `/ˈtɜːbaɪnz/`
  - suggested: `/ˈtɜːbaɪnz/`
  - override_now: `/ˈtɜːbaɪnz/`
  - note: plural_z_missing_in_catalog

- **reassessing** `fixed_locally` (雅思听力高频词汇 / AWL学术词汇 Sublist 1 · Part 1)
  - catalog_then: ``
  - suggested: `/ˌriːəˈsesɪŋ/`
  - override_now: `/ˌriːəˈsesɪŋ/`
  - note: blank_phonetic_filled_from_uk_ipa

- **transaction** `manual_or_audio_review` (雅思听力高频词汇 / 听力原文6次③)
  - catalog_then: `/trænˈzækʃ(ə)n/`  ⚠️ unsafe
  - suggested: `` (LLM: `/trænˈzækʃ(ə)n/`)
  - override_now: `/trænˈzækʃən/`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **visuals** `fixed_locally` (雅思听力高频词汇 / 答案词1次⑤)
  - catalog_then: `/ˈvɪʒʊrlz/`
  - suggested: `/ˈvɪʒuəlz/`
  - override_now: `/ˈvɪʒuəlz/`
  - note: incorrect_r_colored_plural

- **areas** `fixed_locally` (雅思听力高频词汇 / AWL学术词汇 Sublist 1 · Part 1)
  - catalog_then: ``
  - suggested: `/ˈeəriəz/`
  - override_now: `/ˈeəriəz/`
  - note: blank_phonetic_filled_from_uk_ipa

- **attention** `manual_or_audio_review` (雅思听力高频词汇 / 答案词4次③)
  - catalog_then: `/əˈtenʃ(ə)n/`  ⚠️ unsafe
  - suggested: `` (LLM: `/əˈtenʃ(ə)n/`)
  - override_now: `/əˈtenʃən/`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **identification** `llm_candidate_rejected` (雅思听力高频词汇 / 答案词4次③)
  - catalog_then: `/aɪˌdentɪfɪˈkeɪʃ(ə)n/`  ⚠️ unsafe
  - suggested: `/aɪˌdentɪfɪˈkeɪʃ(ə)n/` (LLM: `/ˌaɪdentɪfɪˈkeɪʃ(ə)n/`)
  - override_now: `/aɪˌdentɪfɪˈkeɪʃən/`
  - note: LLM stress suggestion is not stable against available UK/US sources.

- **metal** `manual_or_audio_review` (雅思听力高频词汇 / 答案词4次①)
  - catalog_then: `/ˈmet(ə)l/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈmet(ə)l/`)
  - override_now: `/ˈmetl/`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。

- **behaviours** `fixed_locally` (雅思听力高频词汇 / 答案词5次)
  - catalog_then: `/bɪˈheɪvjə(r)/`  ⚠️ unsafe
  - suggested: `/bɪˈheɪvjəz/`
  - override_now: `/bɪˈheɪvjəz/`
  - note: plural_z_confirmed_by_existing_override_and_premium_source

- **social** `manual_or_audio_review` (雅思听力高频词汇 / 答案词10次及以上)
  - catalog_then: `/ˈsəʊʃ(ə)l/`  ⚠️ unsafe
  - suggested: `` (LLM: `/ˈsəʊʃ(ə)l/`)
  - override_now: `/ˈsəʊʃəl/`
  - note: luo 收藏但 IPA 未确认需要改，后续应听音频或扩展审校。


## 修复建议

1. **短语词条** (`phrase_policy_needed`) 是产品策略问题,而不是简单的 IPA 错误。需先确认单词簿展示/TTS 是否对短语用了单词 IPA。当前 4 个短语中有 3 个已有 override,但 1 个 (`blood pressure`) 还没有 — 需明确 "短语词条的音标处理策略" 再决定是否补充。

2. **unsafe marker 未修复** 的核心问题: `/met(ə)l/` `/kɑː(r)/` `/ˈfleksəb(ə)l/` 等形式里的 `(ə)` `ᵊ` 是开发期占位,意思是 "此处有 schwa 音但 catalog 解析不出来"。把这些改成确定形式(如 `/ˈmetl/` `/kɑː/`)是用户视角的"修复"。

3. **LLM 拒绝** (`identification`/`factories`/`fountains`/`computers`): 4/29 LLM 在多个源之间没有稳定建议,需通过别的途径 (Wiktionary 或音频校对) 重新确认;`identification` 当前已有 override (从 `(ə)n` 改成 `ən`),但另外 3 个 catalog 仍是 unsafe 或空。

4. **确认过但未修复** 的 (`direction`/`metals` 等 manual_review+unsafe): 这些是同一类问题 — catalog 显示 unsafe,未修复。优先级最高。
