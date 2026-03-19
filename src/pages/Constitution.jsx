import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const DEFAULT_SW = `# KATIBA YA KIKUNDI CHA KASHESHE YETU

## SEHEMU YA 1: JINA NA MAKAO MAKUU
Kikundi kinaitwa **KASHESHE YETU** (Haya Community Group).
Makao makuu ya kikundi yako Dar es Salaam, Tanzania.

## SEHEMU YA 2: MADHUMUNI
1. Kusaidiana wanachama katika hali za msiba, ugonjwa, na furaha.
2. Kukusanya michango ya kila mwezi kwa ajili ya mfuko wa pamoja.
3. Kuimarisha undugu na mshikamano wa jamii ya Haya.
4. Kusaidia wanachama na familia zao wakati wa dharura.

## SEHEMU YA 3: UANACHAMA
1. Mwanachama yeyote wa umri wa miaka 18 au zaidi anaweza kujiunga.
2. Ada ya kuingia kwa wanachama wapya ni TSh 10,000.
3. Mchango wa kila mwezi ni TSh 10,000.
4. Mwanachama lazima alipe michango yake kwa wakati.

## SEHEMU YA 4: UONGOZI
Kikundi kinaongozwa na kamati ya uongozi yenye:
- **Mwenyekiti (Chairperson/Admin)** – Msimamizi mkuu wa kikundi
- **Katibu (Secretary)** – Anashughulikia mawasiliano na kumbukumbu
- **Mhazini (Treasurer)** – Anashughulikia fedha za kikundi

## SEHEMU YA 5: MKUTANO
1. Kikundi kitakutana mara moja kwa mwezi.
2. Maamuzi yanafanywa kwa wingi wa kura.
3. Kura tatu kati ya tano zinahitajika kufanya mabadiliko makubwa.

## SEHEMU YA 6: FEDHA
1. Fedha za kikundi zinahifadhiwa katika akaunti ya benki ya pamoja.
2. Malipo yoyote yanayozidi TSh 50,000 yanahitaji idhini ya kamati.
3. Taarifa za fedha zinawasilishwa kila mkutano wa mwezi.

## SEHEMU YA 7: MSAADA
1. Msaada wa msiba: TSh 50,000 – 100,000 kulingana na uamuzi wa kamati.
2. Msaada wa hospitali: Inategemea hali na rasilimali za kikundi.
3. Msaada hutolewa kwa wanachama ambao wamesimama vizuri katika malipo yao.

## SEHEMU YA 8: ADHABU NA KUSIMAMISHWA
1. Mwanachama anayekosa malipo mawili mfululizo atapewa onyo.
2. Kukosa malipo matatu mfululizo kunaweza kusababisha kusimamishwa.
3. Mwanachama aliyesimamishwa hana haki ya kupata msaada.

## SEHEMU YA 9: MAREKEBISHO YA KATIBA
Katiba hii inaweza kubadilishwa kwa idhini ya angalau theluthi mbili (2/3) ya wanachama wote.`

const DEFAULT_EN = `# CONSTITUTION OF KASHESHE YETU

## SECTION 1: NAME AND HEADQUARTERS
The group is known as **KASHESHE YETU** (Haya Community Group).
The headquarters of the group is in Dar es Salaam, Tanzania.

## SECTION 2: OBJECTIVES
1. To support members in times of bereavement, illness, and celebration.
2. To collect monthly contributions into a shared fund.
3. To strengthen brotherhood and solidarity of the Haya community.
4. To assist members and their families during emergencies.

## SECTION 3: MEMBERSHIP
1. Any person aged 18 years or above may join.
2. The joining fee for new members is TSh 10,000.
3. The monthly contribution is TSh 10,000.
4. Members must pay their contributions on time.

## SECTION 4: LEADERSHIP
The group is led by an executive committee consisting of:
- **Chairperson (Admin)** – Overall group administrator
- **Secretary** – Manages communications and records
- **Treasurer** – Manages group finances

## SECTION 5: MEETINGS
1. The group meets once per month.
2. Decisions are made by majority vote.
3. Three out of five votes are required for major changes.

## SECTION 6: FINANCES
1. Group funds are kept in a shared bank account.
2. Any payment exceeding TSh 50,000 requires committee approval.
3. Financial reports are presented at every monthly meeting.

## SECTION 7: SUPPORT
1. Bereavement support: TSh 50,000 – 100,000 as decided by the committee.
2. Medical support: Depends on circumstances and group resources.
3. Support is given to members who are in good standing with their payments.

## SECTION 8: PENALTIES AND SUSPENSION
1. A member who misses two consecutive payments will receive a warning.
2. Missing three consecutive payments may result in suspension.
3. A suspended member is not eligible to receive support.

## SECTION 9: AMENDMENTS
This constitution may be amended with the approval of at least two-thirds (2/3) of all members.`

export default function Constitution() {
  const { isAdmin } = useAuth()
  const { t, lang } = useLanguage()

  const [content, setContent] = useState({ sw: DEFAULT_SW, en: DEFAULT_EN })
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState('')
  const [tab, setTab] = useState(lang)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [lastUpdated, setLastUpdated] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('settings').select('value, updated_at').eq('key', 'constitution').single()
    if (data?.value) {
      try {
        const parsed = JSON.parse(data.value)
        setContent(parsed)
        setLastUpdated(data.updated_at)
      } catch {}
    }
  }

  function startEdit() { setEditContent(content[tab]); setEditing(true) }

  async function handleSave() {
    setSaving(true)
    const updated = { ...content, [tab]: editContent }
    const { error } = await supabase.from('settings').upsert({ key: 'constitution', value: JSON.stringify(updated), updated_at: new Date().toISOString() }, { onConflict: 'key' })
    if (!error) {
      setContent(updated)
      setEditing(false)
      setToast(t('constitution.saved'))
      setTimeout(() => setToast(''), 3000)
    }
    setSaving(false)
  }

  // Simple markdown renderer (bold, headers, lists)
  function renderMarkdown(text) {
    if (!text) return ''
    return text
      .split('\n')
      .map((line, i) => {
        if (line.startsWith('# ')) return `<h1 key="${i}" class="text-2xl font-black text-primary-800 mt-4 mb-2">${line.slice(2)}</h1>`
        if (line.startsWith('## ')) return `<h2 key="${i}" class="text-lg font-bold text-primary-700 mt-5 mb-1 border-b border-gray-200 pb-1">${line.slice(3)}</h2>`
        if (line.startsWith('- **')) return `<li key="${i}" class="ml-4 my-0.5">${line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
        if (line.startsWith('- ')) return `<li key="${i}" class="ml-4 my-0.5 text-gray-700">${line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
        if (/^\d+\./.test(line)) return `<li key="${i}" class="ml-6 my-0.5 list-decimal text-gray-700">${line.replace(/^\d+\.\s*/, '').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</li>`
        if (line.trim() === '') return `<br key="${i}" />`
        return `<p key="${i}" class="my-1 text-gray-700">${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
      })
      .join('')
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      {toast && <div className="fixed top-4 right-4 z-50 alert-success shadow-lg">{toast}</div>}

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('constitution.title')}</h1>
          {lastUpdated && <p className="text-xs text-gray-400">{t('constitution.lastUpdated')}: {new Date(lastUpdated).toLocaleDateString()}</p>}
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn-secondary no-print">🖨️ {t('constitution.print')}</button>
          {isAdmin && !editing && <button onClick={startEdit} className="btn-primary">{t('constitution.edit')}</button>}
        </div>
      </div>

      {/* Language tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('sw')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'sw' ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {t('constitution.swVersion')}
        </button>
        <button onClick={() => setTab('en')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${tab === 'en' ? 'bg-primary-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
          {t('constitution.enVersion')}
        </button>
      </div>

      {/* Constitution content */}
      {editing ? (
        <div className="card space-y-3">
          <p className="text-xs text-gray-500">Markdown supported: ## Heading, **bold**, - item, 1. numbered</p>
          <textarea
            className="input-field font-mono text-xs"
            rows={30}
            value={editContent}
            onChange={e => setEditContent(e.target.value)}
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => setEditing(false)} className="btn-secondary">{t('constitution.cancel')}</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? '...' : t('constitution.save')}</button>
          </div>
        </div>
      ) : (
        <div className="card prose max-w-none print:shadow-none">
          <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content[tab]) }} />
        </div>
      )}

      {!isAdmin && (
        <div className="alert-info text-xs">{t('constitution.editNote')}</div>
      )}
    </div>
  )
}
