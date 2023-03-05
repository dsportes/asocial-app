<template>
  <q-page class="q-pa-sm">
    <div v-if="msg" class="msg q-pa-xs fs-sm text-bold font-mono bg-yellow text-warning">{{msg}}</div>

    <info-restriction :niveau="3" cnx/>

    <q-btn v-if="session.accesNet" class="q-my-sm" size="md" no-caps flat dense color="primary" 
      :label="$t('CVraf')" @click="rafCvs"/>

    <q-btn v-if="session.accesNet" class="q-my-sm" size="md" no-caps flat dense color="primary" 
      :label="$t('CChtit')" @click="ouvrircc"/>

    <div v-if="!chats.length" class="titre-lg text-italic">{{$t('CHnch')}}</div>
    <div v-if="chats.length && !fchats.length" class="titre-lg text-italic">
      {{$t('CHnch2', [chats.length])}}
    </div>
    
    <div v-if="fchats.length">
      <div v-for="(chat, idx) in fchats" :key="chat.ids">
        <apercu-chat class="q-my-sm" :id="chat.id" :ids="chat.ids" :idx="idx" :mapmc="mapmc"/>
      </div>
    </div>

    <q-dialog v-model="cc" persistent style="height:50vh">
      <contact-chat :close="closecc"/>
    </q-dialog>

  </q-page>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuChat from '../components/ApercuChat.vue'
import ContactChat from '../dialogues/ContactChat.vue'
import { Motscles } from '../app/modele.mjs'
import InfoRestriction from '../components/InfoRestriction.vue'
import { ChargerCvs } from '../app/operations.mjs'
import { intersection, difference, $t, hms } from '../app/util.mjs'

export default {
  name: 'PageChats',

  components: { ApercuChat, InfoRestriction, ContactChat },

  computed: {
  },

  methods: {
    ouvrircc () { this.cc = true },
    closecc () { this.cc = false },
    async rafCvs () {
      const n = await new ChargerCvs().run()
      stores.ui.afficherMessage(this.$t('CVraf2', [n]), false)
    }
  },

  data () {
    return {
      cc: false
    }
  },

  setup () {
    const avStore = stores.avatar
    const session = stores.session
    const fStore = stores.filtre

    function getChats () { // Array de chats (Map des chats (clé ids) de l'avatar id)
      return Array.from(avStore.getChats(session.avatarId).values())
    }

    const chats = ref(getChats()) // Map des chats (clé ids) de l'avatar id
    const fchats = ref()
    const msg = ref('')

    const mapmc = ref(Motscles.mapMC(true, 0))
    fStore.contexte.chats.mapmc = mapmc.value
    fStore.contexte.chats.groupeId = 0

    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setChat' && args[0].id === session.avatarId) {
          chats.value = getChats()
          trier(); filtrer()
        }
      })
    })
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'delChat' && args[0] === session.avatarId) {
          chats.value = getChats()
          trier(); filtrer()
        }
      })
    })
    avStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setMotscles') {
          mapmc.value = Motscles.mapMC(true, 0)
          fStore.contexte.chats.mapmc = mapmc.value
        }
      })
    })

    fStore.$onAction(({ name, args, after }) => {
      after((result) => {
        if (name === 'setFiltre' && args[0] === 'chats') {
          filtrer()
        }
      })
    })

    function trier () {
      chats.value.sort((a, b) => { return a.dh > b.dh ? -1 : (a.dh === b.dh ? 0 : 1) })
    }

    function filtrer () {
      let f = fStore.filtre.chats
      if (!f) { 
        fchats.value = chats.value
        return 
      }
      f.limj = f.nbj ? (new Date().getTime() - (f.nbj * 86400000)) : 0
      f.setp = f.mcp && f.mcp.length ? new Set(f.mcp) : new Set()
      f.setn = f.mcn && f.mcn.length ? new Set(f.mcn) : new Set()
      const r = []
      for (const c of chats.value) {
        if (f.limj && c.dh < f.limj) break
        if (f.nom && !c.naE.nom.startsWith(f.nom)) continue
        if (f.txt && (!c.txt || c.txt.indexOf(f.txt) === -1)) continue
        if (f.setp.size || f.setn.size) {
          const s = c.mc && c.mc.length ? new Set(c.mc) : new Set()
          if (f.setp.size && difference(f.setp, s).size) continue
          if (f.setn.size && intersection(f.setn, s).size) continue          
        }        
        r.push(c)
      }
      fchats.value = r
      msg.value = hms(new Date(), true) + ' / ' + $t('items', r.length, { count: r.length })
      setTimeout(() => {
        msg.value = ''
      }, 1000)
    }

    trier()
    filtrer()

    return {
      ui: stores.ui,
      session,
      fchats,
      chats,
      mapmc,
      msg
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.msg
  position: absolute
  z-index: 99999
  top: -20px
  right: 5px
  border-radius: 5px
  border: 1px solid black
</style>
