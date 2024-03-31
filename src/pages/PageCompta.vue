<template>
<q-page>
  <panel-compta v-if="ui.pagetab==='compta'" class="spmd q-pa-sm"/>

  <panel-credits v-if="ui.pagetab==='credits'"/>

  <div v-if="ui.pagetab==='notif' && session.compta" class="spmd q-pa-sm">
    <div class="row q-my-sm items-center">
      <div class="colauto"><n3-icon :niv="nnbj"/></div>
      <div class="col titre-md">{{$t('PCPnbj', [nbj])}}</div>
    </div>
    <div class="row q-my-sm items-center">
      <div class="colauto"><n3-icon :niv="npcn"/></div>
      <div class="col titre-md">
        {{$t('PCPqn', [(c.qv.qn * UNITEN), pc.pcn, c.qv.nn, c.qv.nc, c.qv.ng])}}</div>
    </div>
    <div class="row q-my-sm items-center">
      <div class="colauto"><n3-icon :niv="npcv"/></div>
      <div class="col titre-md">
        {{$t('PCPqv', [edvol(c.qv.qv * UNITV), pc.pcv, c.qv.v])}}</div>
    </div>
    <div v-if="session.compte.estA" class="row q-my-sm items-center">
      <div class="colauto"><n3-icon :niv="nnj"/></div>
      <div class="col titre-md">
        {{$t('PCPsolde', [s, nj])}}</div>
    </div>
    <div v-else class="row q-my-sm items-center">
      <div class="colauto"><n3-icon :niv="npcc"/></div>
      <div class="col titre-md">
        {{$t('PCPqcal', [c.qv.qc, pc.pcc])}}</div>
    </div>

<!--
    <div v-if="!nbNtf" class="titre-lg text-italic q-my-md">{{$t('PCPnot')}}</div>
    
    <div v-for="(ntf, idx) of session.notifs" :key="idx">
      <div v-if="ntf && ntf.texte" class="q-my-sm q-mx-xs">
        <div class="titre-lg text-italic">
          {{$t('CPTtn' + idx + (idx === 4 && aSt.compta.estA ? 'a' : ''))}}
        </div>
        <apercu-notif class="q-ml-sm" :type="idx" :notif="ntf"/>
      </div>
    </div>
-->
  </div>

  <div v-if="ui.pagetab==='chats'" class="spmd q-pa-sm">
    <div class="titre-lg text-italic text-center q-py-md">{{$t('CPTtitch')}}</div>

    <q-card v-for="(na, idx) in pSt.nasUrgence" :key="na.id">
      <div :class="'q-my-sm q-px-sm ' + dkli(idx)">
        <apercu-genx :id="na.id" :idx="idx" />
        <micro-chat :na-e="na" :na-i="nac"/>
      </div>
    </q-card>
  </div>

</q-page>
</template>

<script>

import { onMounted } from 'vue'
import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import PanelCredits from '../components/PanelCredits.vue'
import SdRouge from '../components/SdRouge.vue'
import MicroChat from '../components/MicroChat.vue'
import { dkli, edvol } from '../app/util.mjs'
import { getNg } from '../app/modele.mjs'
import { GetCompta } from '../app/synchro.mjs'
import N3Icon from '../components/N3Icon.vue'
import { UNITEN, UNITEV } from '../app/api.mjs'

export default {
  name: 'PageCompta',

  components: { N3Icon, MicroChat, SdRouge, ApercuGenx, ApercuNotif, PanelCompta, PanelCredits },

  computed: {
    nbj () { return 5 /*this.session.compte.nbj*/ },
    nnbj () { return this.nbj > 40 ? 1 : (this.nbj > 10 ? 2 : 3)},
    nac () { return getNg(this.session.compteId) },
    c () { return this.session.compta.compteurs },
    s ()  { return this.session.compta.solde },
    pc () { return this.c.pourcents },
    npcn () { return this.pc.pcn < 80 ? 1 : (this.pc.pcn <= 90 ? 2 : 3)},
    npcv () { return this.pc.pcv < 80 ? 1 : (this.pc.pcv <= 90 ? 2 : 3)},
    npcc () { return this.pc.pcc < 80 ? 1 : (this.pc.pcc <= 90 ? 2 : 3)},
    nj () { return this.c.conso4M },
    nnj () { return this.nj > 40 ? 1 : (this.nj > 10 ? 2 : 3)},
    bl () {
      /*
      if (this.session.estFige) { return this.session.estMinimal ? 'fm' : 'f' }
      if (this.session.estMinimal) { return 'm' }
      if (this.session.estLecture) { return 'l' }
      if (this.session.estDecr) { return 'd' }
      */
      return false
    },
    nbNtf () {
      let nb = 0
      // this.session.notifs.forEach(n => { if (n && n.texte) nb++ })
      return nb
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

    onMounted(async () => {
      await new GetCompta().run()
      const c = session.compta
    })

    return {
      session, pSt, ui, aSt,  dkli, UNITEN, UNITEV, edvol
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border: 3px solid red
  border-radius: 10px
  background-color: rgb(239, 251, 148)
</style>
