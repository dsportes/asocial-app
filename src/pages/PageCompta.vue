<template>
<q-page>
  <panel-compta v-if="ui.pagetab==='compta'" style="margin:0 auto" :c="aSt.compta.compteurs"/>

  <div v-if="ui.pagetab==='notif'" class="q-pa-sm">
    <div v-if="c.pc1 >= 100" class="q-my-sm q-mx-sm bg-yellow-3 text-negative text-bold q-pa-sm titre-md">
      <div class="titre-md">{{$t('CPTal1a', [c.pc1])}}</div>
      <div>{{$t('CPTal1b')}}</div>
    </div>

    <div v-if="c.pc2 >= 100" class="q-my-sm q-mx-sm bg-yellow-3 text-negative text-bold q-pa-sm titre-md">
      <div class="titre-md">{{$t('CPTal2a', [c.pc2])}}</div>
      <div>{{$t('CPTal2b')}}</div>
    </div>

    <q-separator class="q-my-md"/>

    <synthese-blocage />

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
import SyntheseBlocage from '../components/SyntheseBlocage.vue'
import { SetDhvuCompta } from '../app/operations.mjs'
import { getNg, Motscles, Chat } from '../app/modele.mjs'

export default {
  name: 'PageCompta',

  components: { SyntheseBlocage, PanelCompta, ApercuChat },

  computed: {
    c () { return this.aSt.compta.compteurs },
    tr () { return this.aSt.tribu },
    et2 () { return this.aSt.tribu2.mbtr[this.session.compteId] },
    blTr () { return this.tr.blocage || null },
    blCo () { return this.et2.blocage || null },
    ntfTrCo () { return this.tr.notifco || null },
    ntfTrSp () { return this.tr.notifsp || null },
    ntfCoCo () { return this.et2.notifco || null },
    ntfCoSp () { return this.et2.notifsp || null }
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
          ui.setPage('accueil')
        }
      })
    })

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
</style>
