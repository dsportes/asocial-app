<template>
<div>
  <panel-compta v-if="ui.pagetab==='compta'" style="margin:0 auto" :c="avStore.compta.compteurs"/>

  <div v-if="ui.pagetab==='notif'" class="q-pa-sm">
    <div v-if="c.pc1 >= 100" class="q-my-sm q-mx-sm bg-yellow-3 text-negative text-bold q-pa-sm titre-md">
      <div class="titre-md">{{$t('CPTal1a', [c.pc1])}}</div>
      <div>{{$t('CPTal1b')}}</div>
    </div>

    <div v-if="c.pc2 >= 100" class="q-my-sm q-mx-sm bg-yellow-3 text-negative text-bold q-pa-sm titre-md">
      <div class="titre-md">{{$t('CPTal2a', [c.pc2])}}</div>
      <div>{{$t('CPTal2b')}}</div>
    </div>

    <q-separator v-if="(c.pc2 >= 100) || (c.pc1 >= 100)" class="q-my-md"/>

    <synthese-blocage v-if="blTr || blCo" :blTr="blTr" :blCo="blCo"/>
    <div v-else class="titre-lg text-italic">{{$t('CPTnbloc')}}</div>

    <q-separator class="q-my-md"/>

    <div v-if="session.estComptable || (session.notifG && session.notifG.dh)">
      <apercu-notif edit />
      <q-separator class="q-my-sm"/>
    </div>

    <div v-if="ntfTrCo">
      <apercu-notif :src="tr" />
      <q-separator class="q-my-sm"/>
    </div>

    <div v-if="ntfTrSp">
      <apercu-notif :src="tr" sponsor/>
      <q-separator class="q-my-sm"/>
    </div>

    <div v-if="ntfCoCo">
      <apercu-notif :src="et2" />
      <q-separator class="q-my-sm"/>
    </div>

    <div v-if="ntfCoSp">
      <apercu-notif :src="et2" sponsor/>
      <q-separator class="q-my-sm"/>
    </div>

  </div>

  <div v-if="ui.pagetab==='chats'">
    <div class="titre-lg text-italic text-center q-my-md">{{$t('CPTtitch')}}</div>

    <div v-for="(na, idx) in pStore.naSponsors" :key="idx">
      <apercu-chat class="q-my-sm"
        :na-i="naCpt" :na-e="na" :ids="ids[na.id]" :idx="idx" :mapmc="mapmc"/>
    </div>
  </div>
</div>
</template>

<script>

import { ref, onMounted, reactive } from 'vue'

import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import SyntheseBlocage from '../components/SyntheseBlocage.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import ApercuChat from '../components/ApercuChat.vue'
import { SetDhvuCompta } from '../app/operations.mjs'
import { getNg, Motscles, Chat } from '../app/modele.mjs'
import { IDCOMPTABLE } from '../app/api.mjs'

export default {
  name: 'PageCompta',

  components: { PanelCompta, SyntheseBlocage, ApercuNotif, ApercuChat },

  computed: {
    c () { return this.avStore.compta.compteurs },
    tr () { return this.avStore.tribu },
    et2 () { return this.avStore.tribu2.mbtr[this.session.compteId] },
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
    const avStore = stores.avatar
    const pStore = stores.people
    const ui = stores.ui

    const naCpt = getNg(session.compteId)
    const mapmc = ref(Motscles.mapMC(true, 0))

    const ids = reactive({})
    onMounted(async () => {
      ids[IDCOMPTABLE] = await Chat.getIds(naCpt, getNg(IDCOMPTABLE))
      for(const na of pStore.naSponsors) {
        if (na.id !== session.compteId) {
          ids[na.id] = await Chat.getIds(naCpt, na)
        }
      }
    })

    async function vuclose () {
      if (this.session.accesNet) {
        await new SetDhvuCompta().run()
      }
      this.ui.setPage('accueil')
    }

    ui.$onAction(({ name, args, after }) => {
      after(async (result) => {
        if ((name === 'jailu')){
          await vuclose()
        }
      })
    })

    return {
      session,
      pStore,
      ui,
      avStore,
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
