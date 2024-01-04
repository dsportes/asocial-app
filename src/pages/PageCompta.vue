<template>
<q-page>
  <panel-compta v-if="ui.pagetab==='compta'" class="spmd q-pa-sm"/>

  <panel-credits v-if="ui.pagetab==='credits'"/>

  <div v-if="ui.pagetab==='notif'" class="spmd q-pa-sm">

    <div v-if="bl" class="bord q-pa-sm q-mb-xl">
      <sd-rouge :texte="$t('SB' + bl)"/>
    </div>

    <div v-if="!nbNtf" class="titre-lg text-italic q-my-md">{{$t('PCPnot')}}</div>
    
    <div v-for="(ntf, idx) of session.notifs" :key="idx">
      <div v-if="ntf && ntf.texte" class="q-my-sm q-mx-xs">
        <div class="titre-lg text-italic">
          {{$t('CPTtn' + idx + (idx === 4 && aSt.compta.estA ? 'a' : ''))}}
        </div>
        <apercu-notif class="q-ml-sm" :type="idx" :notif="ntf"/>
      </div>
    </div>
  </div>

  <div v-if="ui.pagetab==='chats'" class="spmd q-pa-sm">
    <div class="titre-lg text-italic text-center q-py-md">{{$t('CPTtitch')}}</div>

    <q-card v-for="(chat, idx) in chats" :key="chat.ids">
      <div :class="'q-my-sm q-px-sm ' + dkli(idx)">
        <apercu-genx nodet :id="chat.naE.id" :idx="idx" />
        <div v-if="!chat.fake">
          <div class="q-mt-xs row justify-between items-center">
            <div class="text-italic fs-md">
              <span v-if="chat.stI===1" class="q-mr-sm">{{$t('actif')}}</span>
              <span v-else class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHraccroche')}}</span>
              <span v-if="chat.stE===0" class="q-mr-sm text-warning text-bold bg-yellow-5">
                {{$t('CHraccroche2', [chat.naE.nom])}}</span>
              <span v-if="chat.stE===2" class="q-mr-sm text-warning text-bold bg-yellow-5">{{$t('CHavdisp')}}</span>
              <span class="q-mr-sm">{{$t('CHnbit', chat.items.length, {count:chat.items.length} )}}</span>
            </div>
            <div v-if="chat.items.length" class="text-italic font-mono q-mr-sm">{{dhcool(chat.dh)}}</div>
          </div>
          <div v-if="chat.items.length" class="fs-md">{{chat.tit}}</div>
        </div>
        <div v-else>
          <div class="text-italic titre-md">{{$t('CHnotit')}}</div>
        </div>
        <q-btn color="primary" dense icon="open_in_new" 
          :label="$t(chat.fake ? 'CHbtncr' : 'CHbtnov')"
          @click="ouvrirChat(chat)"/>
      </div>
    </q-card>
  </div>

  <apercu-chat v-if="ui.d.ACouvrir"
    :naI="chatc.naI" :naE="chatc.naE" :ids="chatc.ids" :mapmc="mapmc"/>

</q-page>
</template>

<script>

import { ref, onMounted, reactive } from 'vue'

import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuChat from '../panels/ApercuChat.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import PanelCredits from '../components/PanelCredits.vue'
import SdRouge from '../components/SdRouge.vue'
import { SetDhvuCompta } from '../app/operations.mjs'
import { getNg, Motscles, Chat } from '../app/modele.mjs'
import { dkli, dhcool } from '../app/util.mjs'

export default {
  name: 'PageCompta',

  components: { SdRouge, ApercuGenx, ApercuNotif, PanelCompta, PanelCredits, ApercuChat },

  computed: {
    c () { return this.aSt.compta.compteurs },
    bl () {
      if (this.session.estFige) { return this.session.estMinimal ? 'fm' : 'f' }
      if (this.session.estMinimal) { return 'm' }
      if (this.session.estLecture) { return 'l' }
      if (this.session.estDecr) { return 'd' }
      return false
    },
    nbNtf () {
      let nb = 0
      this.session.notifs.forEach(n => { if (n && n.texte) nb++ })
      return nb
    }
  },

  data () {
    return {
    }
  },

  methods: {
    ouvrirChat (c) {
      this.chatc = c
      this.ui.oD('ACouvrir')
    },
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const pSt = stores.people
    const ui = stores.ui

    const naCpt = getNg(session.compteId)
    const mapmc = ref(Motscles.mapMC(true, 0))

    /* le calcul des chats d'urgence n'existent pas nécessite un await
    D'où l'obligation de l'effectuer onMounted
    et son recalcul en cas de changement d'un chat.
    On pourrait optimiser en filtrant sur les ids des chats utiles
    mais c'est rare.
    */
    const chats = reactive([])

    async function getChats () {
      chats.length = 0
      for(const na of pSt.naSponsors) {
        const ids = await Chat.getIds(naCpt, na)
        const c = aSt.getChat(session.compteId, ids)
        chats.push(c ? c : { id: session.compteId, ids: ids, naE: na, naI: naCpt, fake: true })
      }
    }

    onMounted(async () => {
      await getChats()
    })

    aSt.$onAction(({ name, args, after }) => { 
      after(async (result) => {
        if ((name === 'setChat')){
          await getChats()
        }
      })
    })

    ui.$onAction(({ name, args, after }) => { 
      // Invoquée par App.vue, le bouton fait partie de la toolbar
      after(async (result) => {
        if ((name === 'jailu')){
          if (session.accesNetNf) await new SetDhvuCompta().run()
        }
      })
    })

    aSt.setccCpt(aSt.compta.compteurs)

    return {
      session, pSt, ui, aSt,
      dkli, dhcool,
      naCpt,
      chats,
      mapmc
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.q-btn
  padding: 0 3px !important
.bord
  border: 3px solid red
  border-radius: 10px
  background-color: rgb(239, 251, 148)
</style>
