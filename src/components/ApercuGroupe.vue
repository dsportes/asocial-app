<template>
<!--
Traiter l'hébergement, affichage et bouton
-->
  <div :class="dkli(idx)">
    <apercu-genx :na="eg.groupe.na" :cv="eg.groupe.cv" :idx="idx" :cvchangee="cvchangee"/>

    <div class="q-mt-xs row justify-between">
      <div v-if="eg.groupe.stx === 2" class="titre-md text-bold text-warning">{{$t('PGferme', nbv, { count: nbv })}}</div>
      <div v-else class="titre-md">{{$t('PGouvert')}}</div>
      <q-btn v-if="edit" class="q-ml-sm" size="sm" :label="$t('details')" 
        icon="edit" dense color="primary" @click="edit('vote', eg.groupe)"/>
    </div>

    <div class="q-mt-xs row largeur40">
      <div class="col-5 titre-sm">{{$t('NTvx')}}</div>
      <div class="col-3 fs-sm text-bold font-mono">{{$t('NTvx1', [q1, pc1])}}</div>
      <div class="col-3 fs-sm text-bold font-mono">{{$t('NTvx2', [q2, pc2])}}</div>
      <div class="col-1">
        <q-btn size="sm" icon="edit" dense color="primary" @click="edit('quotas', eg.groupe)"/>
      </div>
    </div>

    <apercu-membreac v-for="m in eg.mbacs" :key="m.na.id" class="q-mt-sm" :idg="m.id" :im="m.ids"/>
  </div>
</template>

<script>
import { toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuMembreac from './ApercuMembreac.vue'
import ApercuGenx from './ApercuGenx.vue'
import { edvol, dhcool } from '../app/util.mjs'
import { UNITEV1, UNITEV2, AMJ } from '../app/api.mjs'
import { MajCvGr } from '../app/operations.mjs'

export default {
  name: 'ApercuGroupe',

  props: { eg: Object, idx: Number, edit: Function },

  components: { ApercuMembreac, ApercuGenx },

  computed: {
    dfh () { return dhcool(AMJ.tDeAmjUtc(this.eg.groupe.dfh)) },
    heb () {
      const m = this.eg.membres.get(this.eg.groupe.imh)
      return this.$t('PGhb', [m.na.nomc + (m.estAC ? ' [' + $t('moi') + ']': '')])
    },
    q1 () { const v = this.eg.groupe.vols; return v.q1 + ' - ' + edvol(v.q1 * UNITEV1) },
    q2 () { const v = this.eg.groupe.vols; return v.q2 + ' - ' + edvol(v.q2 * UNITEV2) },
    pc1 () { const v = this.eg.groupe.vols; return Math.round((v.v1 * 100) / (v.q1 * UNITEV1)) },
    pc2 () { const v = this.eg.groupe.vols; return Math.round((v.v2 * 100) / (v.q2 * UNITEV2)) },
    nbv () { let n = 0; this.eg.membres.forEach(m => { if (m.vote) n++ }); return n }
  },

  data () { return {
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async cvchangee (res) {
      if (res && this.na) {
        await new MajCvGr().run(this.eg.groupe, res.ph, res.info)
      }
    }
  },

  setup (props) {
    const eg = toRef(props, 'eg')
    const session = stores.session
    const gSt = stores.groupe
    const photoDef = stores.config.iconGroupe
    return {
      session,
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
  padding: 0 !important
  width: 1.5rem !important
</style>
