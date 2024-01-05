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

import stores from '../stores/stores.mjs'
import PanelCompta from '../components/PanelCompta.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ApercuNotif from '../components/ApercuNotif.vue'
import PanelCredits from '../components/PanelCredits.vue'
import SdRouge from '../components/SdRouge.vue'
import MicroChat from '../components/MicroChat.vue'
import { dkli } from '../app/util.mjs'
import { getNg } from '../app/modele.mjs'

export default {
  name: 'PageCompta',

  components: { MicroChat, SdRouge, ApercuGenx, ApercuNotif, PanelCompta, PanelCredits },

  computed: {
    nac () { return getNg(this.session.compteId) },
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
  },

  setup () {
    const session = stores.session
    const aSt = stores.avatar
    const pSt = stores.people
    const ui = stores.ui

    aSt.setccCpt(aSt.compta.compteurs)

    return {
      session, pSt, ui, aSt,  dkli
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
