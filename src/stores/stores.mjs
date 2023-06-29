import { useConfigStore } from './config-store.js'
import { useSessionStore } from './session-store.js'
import { useUiStore } from './ui-store.js'

import { useTribuStore } from './tribu-store.js'
import { useAvatarStore } from './avatar-store.js'
import { useGroupeStore } from './groupe-store.js'
import { usePeopleStore } from './people-store.js'
import { useNoteStore } from './note-store.js'
import { useSyncitemStore } from './syncitem-store.js'
import { useFetatStore } from './fetat-store.js'
import { useFiltreStore } from './filtre-store.js'
import { useAvnoteStore } from './avnote-store.js'
import { usePpStore } from './pp-store.js'

// Hors de cette liste : config, session
const listeStores = ['tribu', 'avatar', 'groupe', 'people', 
'note', 'syncitem', 'fetat', 'avnote', 'pp', 'filtre'
]

class Stores {
  get config() { return this.configStore || (this.configStore = useConfigStore()) }
  get session() { return this.sessionStore || (this.sessionStore = useSessionStore()) }
  get ui() { return this.uiStore || (this.uiStore = useUiStore()) }

  get tribu() { return this.tribuStore || (this.tribuStore = useTribuStore()) }
  get avatar() { return this.avatarStore || (this.avatarStore = useAvatarStore()) }
  get groupe() { return this.groupeStore || (this.groupeStore = useGroupeStore()) }
  get people() { return this.peopleStore || (this.peopleStore = usePeopleStore()) }
  get note() { return this.noteStore || (this.noteStore = useNoteStore()) }
  get syncitem() { return this.syncitemStore || (this.syncitemStore = useSyncitemStore()) }
  get fetat() { return this.fetatStore || (this.fetatStore = useFetatStore()) }
  get avnote() { return this.avnoteStore || (this.avnoteStore = useAvnoteStore()) }
  get pp() { return this.ppStore || (this.ppStore = usePpStore()) }
  get filtre() { return this.filtreStore || (this.filtreStore = useFiltreStore()) }

  reset() {
    for(const id of listeStores) {
      const st = this[id]
      st.$reset()
    }
  }
}
const stores = new Stores()
export default stores
