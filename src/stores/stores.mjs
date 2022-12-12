import { useConfigStore } from './config-store.js'
import { useSessionStore } from './session-store.js'
import { useUiStore } from './ui-store.js'

import { useTribuStore } from './tribu-store.js'
import { useAvatarStore } from './avatar-store.js'
import { useGroupeStore } from './groupe-store.js'
import { useCoupleStore } from './couple-store.js'
import { usePeopleStore } from './people-store.js'
import { useSecretStore } from './secret-store.js'
import { useSyncitemStore } from './syncitem-store.js'
import { useFetatStore } from './fetat-store.js'
import { useAvsecretStore } from './avsecret-store.js'
import { useTflocauxStore } from './tflocaux-store.js'

import { useListeContactsStore } from './liste-contacts.js'
import { useListeAvatarsStore } from './liste-avatars.js'
import { useListeTribusStore } from './liste-tribus.js'

// Hors de cette liste : config, session
const listeStores = ['tribu', 'avatar', 'groupe', 'couple', 'people', 
'secret', 'syncitem', 'fetat', 'avsecret', 'tflocaux',
'listeContacts', 'listeAvatars', 'listeTribus']

class Stores {
  get config() { return this.configStore || (this.configStore = useConfigStore()) }
  get session() { return this.sessionStore || (this.sessionStore = useSessionStore()) }
  get ui() { return this.uiStore || (this.uiStore = useUiStore()) }

  get tribu() { return this.tribuStore || (this.tribuStore = useTribuStore()) }
  get avatar() { return this.avatarStore || (this.avatarStore = useAvatarStore()) }
  get groupe() { return this.groupeStore || (this.groupeStore = useGroupeStore()) }
  get couple() { return this.coupleStore || (this.coupleStore = useCoupleStore()) }
  get people() { return this.peopleStore || (this.peopleStore = usePeopleStore()) }
  get secret() { return this.secretStore || (this.secretStore = useSecretStore()) }
  get syncitem() { return this.syncitemStore || (this.syncitemStore = useSyncitemStore()) }
  get fetat() { return this.fetatStore || (this.fetatStore = useFetatStore()) }
  get avsecret() { return this.avsecretStore || (this.avsecretStore = useAvsecretStore()) }
  get tflocaux() { return this.tflocauxStore || (this.tflocauxStore = useTflocauxStore()) }

  get listeContacts() { return this.listeContactsStore || (this.listeContactsStore = useListeContactsStore()) }
  get listeAvatars() { return this.listeAvatarsStore || (this.listeAvatarsStore = useListeAvatarsStore()) }
  get listeTribus() { return this.listeTribusStore || (this.listeTribusStore = useListeTribusStore()) }

  reset() {
    for(const id of listeStores) {
      const st = this[id]
      st.$reset()
    }
  }
}
const stores = new Stores()
export default stores
