import { useConfigStore } from './config-store.js'
import { useSessionStore } from './session-store.js'
import { useUiStore } from './ui-store.js'

import { useAvatarStore } from './avatar-store.js'
import { useGroupeStore } from './groupe-store.js'
import { usePeopleStore } from './people-store.js'
import { useNoteStore } from './note-store.js'
import { useFicavStore } from './ficav-store.js'
import { useFiltreStore } from './filtre-store.js'
import { usePpStore } from './pp-store.js'

class Stores {
  static listeStores = [ // toutes SAUF config
    'session', 'ui', 'avatar', 'groupe', 'people', 'note', 'ficav', 'pp', 'filtre'
  ]

  get config() { return this.configStore || (this.configStore = useConfigStore()) }
  get session() { return this.sessionStore || (this.sessionStore = useSessionStore()) }
  get ui() { return this.uiStore || (this.uiStore = useUiStore()) }

  get tribu() { return this.tribuStore || (this.tribuStore = useTribuStore()) }
  get avatar() { return this.avatarStore || (this.avatarStore = useAvatarStore()) }
  get groupe() { return this.groupeStore || (this.groupeStore = useGroupeStore()) }
  get people() { return this.peopleStore || (this.peopleStore = usePeopleStore()) }
  get note() { return this.noteStore || (this.noteStore = useNoteStore()) }
  get syncitem() { return this.syncitemStore || (this.syncitemStore = useSyncitemStore()) }
  get ficav() { return this.ficavStore || (this.ficavStore = useFicavStore()) }
  get pp() { return this.ppStore || (this.ppStore = usePpStore()) }
  get filtre() { return this.filtreStore || (this.filtreStore = useFiltreStore()) }

  reset(saufSession) {
    for(const id of Stores.listeStores) {
      if (id === 'session' && saufSession) continue
      const st = this[id]
      st.$reset()
    }
  }
}
const stores = new Stores()
export default stores
