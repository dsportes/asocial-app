<template>
<q-page>
  <panel-compta v-if="ui.pagetab==='compta'" style="margin:0 auto"/>

  <div v-if="ui.pagetab==='notif'" class="largeur40 maauto q-pa-sm">

    <div v-if="bl" class="bord q-pa-sm q-mb-xl">
      <sd-al :texte="$t('SB' + bl)"/>
    </div>

    <div v-for="(ntf, idx) of session.notifs" :key="idx">
      <div v-if="ntf && ntf.texte" class="q-my-sm q-mx-xs">
        <div class="titre-lg text-italic">
          {{$t('CPTtn' + idx + (idx === 4 && aSt.compte.estA ? 'a' : ''))}}
        </div>
        <apercu-notif2 class="q-ml-sm" :type="idx" :notif="ntf"/>
      </div>
    </div>
  </div>

  <div v-if="ui.pagetab==='chats'">
    <div class="titre-lg text-italic text-center q-my-md">{{$t('CPTtitch')}}</div>

    <div v-for="(na, idx) in pSt.naSponsors" :key="idx">
      <apercu-chat class="q-my-sm"
        :na-i="naCpt" :na-e="na" :ids="ids[na.id]" :idx="idx" :mapmc="mapmc"/>
    </div>
  </div>
</q-page>
</template>

<script>

import { ref, onMounted, reactive } from 'vue'

import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import ApercuChat from '../components/ApercuChat.vue'
import ApercuNotif2 from '../components/ApercuNotif2.vue'
import SdAl from '../components/SdAl.vue'
import { SetDhvuCompta } from '../app/operations.mjs'
import { getNg, Motscles, Chat } from '../app/modele.mjs'

export default {
  name: 'PageCompta',

  components: { SdAl, ApercuNotif2, PanelCompta, ApercuChat },

  computed: {
    c () { return this.aSt.compta.compteurs },
    bl () {
      if (this.session.estFige) { return this.session.estMinimal ? 'fm' : 'f' }
      if (this.session.estMinimal) { return 'm' }
      if (this.session.estLecture) { return 'l' }
      if (this.session.estDecr) { return 'd' }
      return false
    }
  },

  data () {
    return {
    }
  },

  methods: {
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const pSt = stores.people
    const ui = stores.ui

    const naCpt = getNg(session.compteId)
    const mapmc = ref(Motscles.mapMC(true, 0))

    const ids = reactive({})
    onMounted(async () => {
      ids[session.naComptable.id] = await Chat.getIds(naCpt, session.naComptable)
      for(const na of pSt.naSponsors) {
        if (na.id !== session.compteId) {
          ids[na.id] = await Chat.getIds(naCpt, na)
        }
      }
    })

    async function vuclose () {
      if (session.accesNet) {
        await new SetDhvuCompta().run()
      }
      ui.setPage('accueil')
    }

    ui.$onAction(({ name, args, after }) => { 
      // Invoquée par App.vue, le bouton fait partie de la toolbar
      after(async (result) => {
        if ((name === 'jailu')){
          if (session.accesNet) await new SetDhvuCompta().run()
          // ui.setPage('accueil')
        }
      })
    })
    aSt.setccCpt(aSt.compta.compteurs)
    return {
      session,
      pSt,
      ui,
      aSt,
      naCpt,
      ids,
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
