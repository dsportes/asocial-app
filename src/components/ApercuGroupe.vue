<template>
  <div :class="dkli(idx)">
    <apercu-genx :na="eg.groupe.na" :cv="eg.groupe.cv" :idx="idx" :cvchangee="cvchangee"/>

    <div v-if="!eg.groupe.dfh" class="fs-md">
      <span class="fs-md q-mr-sm">{{$t('PGhb')}}</span>
      <bouton-membre :eg="eg" :im="eg.groupe.imh" />
    </div>
    <div v-else class="fs-md text-warning text-bold">{{$t('PGnheb', [dfh])}}</div>

    <div v-if="fond">
      <span class="fs-md q-mr-sm">{{$t('PGfd')}}</span>
      <bouton-membre :eg="eg" :im="1" />
    </div>
    <div v-else class="fs-md">{{$t('PGnfond')}}</div>

    <div class="q-mt-xs row justify-between">
      <div v-if="eg.groupe.msu" class="titre-md text-bold text-warning">{{$t('PGuna')}}</div>
      <div v-else class="titre-md">{{$t('PGsimple')}}</div>
      <q-btn v-if="edit" class="q-ml-sm" size="sm" :label="$t('details')" 
        icon="edit" dense color="primary" @click="editUna"/>
    </div>

    <div class="q-mt-xs">
      <quotas-vols :vols="eg.groupe.vols"/>
    </div>

    <div v-for="[,m] in eg.mbacs" :key="m.na.id" class="q-mt-sm">
      <q-separator color="orange"/>
      <apercu-membre :mb="m" :eg="eg" :idx="idx" :mapmc="mapmc"/>
    </div>
  </div>
</template>

<script>
// import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuMembre from './ApercuMembre.vue'
import ApercuGenx from './ApercuGenx.vue'
import { edvol, dhcool } from '../app/util.mjs'
import { UNITEV1, UNITEV2, AMJ } from '../app/api.mjs'
import { MajCvGr } from '../app/operations.mjs'
import BoutonMembre from './BoutonMembre.vue'
import QuotasVols from './QuotasVols.vue'

export default {
  name: 'ApercuGroupe',

  props: { 
    eg: Object,
    idx: Number,
    mapmc: Object,
    edit: Function
  },

  components: { ApercuMembre, ApercuGenx, BoutonMembre, QuotasVols },

  computed: {
    dfh () { return dhcool(AMJ.tDeAmjUtc(this.eg.groupe.dfh)) },
    fond () {
      if (!this.eg.groupe.ast[1]) return ''
      const m = this.eg.membres.get(1)
      if (!m) return ''
      return m.na.nomc + (m.estAC ? ' [' + $t('moi') + ']': '')
    },
    q1 () { const v = this.eg.groupe.vols; return v.q1 + ' - ' + edvol(v.q1 * UNITEV1) },
    q2 () { const v = this.eg.groupe.vols; return v.q2 + ' - ' + edvol(v.q2 * UNITEV2) },
    pc1 () { const v = this.eg.groupe.vols; return Math.round((v.v1 * 100) / (v.q1 * UNITEV1)) },
    pc2 () { const v = this.eg.groupe.vols; return Math.round((v.v2 * 100) / (v.q2 * UNITEV2)) },
    // nbv () { let n = 0; this.eg.membres.forEach(m => { if (m.vote) n++ }); return n }
  },

  data () { return {
    editerUna: false,
    changerQuotas: false,
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async cvchangee (res) {
      if (res && this.na) {
        await new MajCvGr().run(this.eg.groupe, res.ph, res.info)
      }
    },
    chgQuotas () {
      // TODO
      this.changerQuotas = true
    },
    editUna () {
      // TODO 
      this.editerUna = true
    }
  },

  setup (props) {
    /*
    const eg = toRef(props, 'eg')
    for (const [, m] of eg.value.mbacs) {
      console.log(m.na.id)
    }
    */
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe
    const photoDef = stores.config.iconGroupe
    return {
      session,
      ui,
      photoDef,
      gSt
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.bordb
  border-bottom: 1px solid $grey-5
.nom
  max-height: 1.3rem
  overflow: hidden
.q-toolbar
  padding: 0 !important
  min-height: 0 !important
.btn1
  padding: 1px !important
  width: 1.5rem !important
</style>
