<template>
  <div :class="dkli(idx)">
    <apercu-genx :na="eg.groupe.na" :cv="eg.groupe.cv" :idx="idx" :cvchangee="cvchangee"/>

    <div v-if="fond">
      <span class="q-mt-xs fs-md q-mr-sm">{{$t('AGfond')}}</span>
      <bouton-membre :eg="eg" :im="1" />
    </div>
    <div v-else class="q-mt-xs fs-md text-italic">{{$t('AGnfond')}}</div>

    <div class="q-mt-xs row justify-between">
      <div v-if="eg.groupe.msu" class="titre-md text-bold text-warning">{{$t('AGuna')}}</div>
      <div v-else class="titre-md">{{$t('AGsimple')}}</div>
      <q-btn class="q-ml-sm" size="sm" :label="$t('details')" 
        icon="edit" dense color="primary" @click="editUna"/>
    </div>

    <div :class="'q-mt-xs q-pa-xs' + bcf">
      <div class="row justify-between">
        <div v-if="!eg.groupe.dfh" class="col fs-md">
          <span class="fs-md q-mr-sm">{{$t('AGheb')}}</span>
          <bouton-membre :eg="eg" :im="eg.groupe.imh" />
        </div>
        <div v-else class="col fs-md text-warning text-bold">{{$t('AGnheb', [dfh])}}</div>
        <q-btn class="col-auto" dense size="sm" color="primary" :label="$t('gerer')"
          icon="settings" @click="gererHeb"/>
      </div>
      <div class="q-mt-xs">
        <quotas-vols :vols="eg.objv.vols"/>
        <!-- POUR TEST quotas-vols :vols="{ a1:1, a2:2, v1:200000, v2:70000000, q1:0, q2:3 }"/-->
      </div>
    </div>

    <div v-for="[,m] in eg.mbacs" :key="m.na.id" class="q-mt-sm">
      <q-separator color="orange"/>
      <apercu-membre :mb="m" :eg="eg" :idx="idx" :mapmc="mapmc"/>
    </div>

    <q-dialog v-model="changerQuotas" full-height persistent>
      <q-layout container view="hHh lpR fFf" :class="dkli(0)" style="width:80vw">
        <q-header elevated class="bg-secondary text-white">
          <q-toolbar>
            <q-btn dense size="md" color="warning" icon="close" @click="closeQ"/>
            <q-toolbar-title class="titre-lg text-center q-mx-sm">{{$t('AGgerh', [eg.groupe.na.nom])}}</q-toolbar-title>
            <bouton-help page="page1"/>
          </q-toolbar>
        </q-header>

        <q-page-container>
          <q-page class="q-pa-xs">
            <quotas-vols class="q-my-md" :vols="eg.objv.vols"/>
            <div class="titre-md" v-if="cas===1">{{$t('AGm1', [moi])}}</div>
            <div class="titre-md q-ml-md" v-if="cas===1">{{$t('AGm1a')}}</div>
            <div class="titre-md q-ml-md" v-if="cas===1">{{$t('AGm1b')}}</div>
            <div class="titre-md" v-if="cas===2">{{$t('AGm2', [moi, hbg])}}</div>
            <div class="titre-md" v-if="cas===3">{{$t('AGm3', [moi, hbg])}}</div>
            <div class="titre-md" v-if="cas===4">{{$t('AGm4', [moi])}}</div>
            <div class="titre-md" v-if="cas===5">{{$t('AGm5', [moi, lstAn])}}</div>
            <div class="titre-md" v-if="cas===6">{{$t('AGm6', [moi])}}</div>

            <div v-if="alq1 || alq2">
              <q-separator color="orange" class="q-my-xs"/>
              <div v-if="alq1 && g.imh" class="titre-md text-bold text-negative bg-yellow-3">{{$t('AGq1x')}}</div>
              <div v-if="alq1" class="titre-md text-bold text-negative bg-yellow-3">{{$t('AGv1')}}</div>
              <div v-if="alq2 && g.imh" class="titre-md text-bold text-negative bg-yellow-3">{{$t('AGq2x')}}</div>
              <div v-if="alq2" class="titre-md text-bold text-negative bg-yellow-3">{{$t('AGv2')}}</div>
              <q-separator color="orange" class="q-my-xs"/>
            </div>

            <div class="column justify-center">
              <q-btn class="q-ma-md" v-if="cas===1" size="md" dense color="primary" :label="$t('AGbtncq')" @click="gotocq"/>
              <q-btn class="q-ma-md" v-if="cas===1" size="md" dense color="warning" :label="$t('AGbtnfh')" @click="step = 2"/>
              <q-btn class="q-ma-md" v-if="cas===2 || cas === 4 || cas === 6" size="md" color="primary" :label="$t('AGbtnfh')" @click="gotocq"/>
            </div>

            <div v-if="step === 2" class="q-ma-md">
              <div class="titre-md text-bold text-negative bg-yellow-3 text-center">{{$t('AGv1b')}}</div>
              <div class="titre-md text-bold text-negative bg-yellow-3 text-center">{{$t('AGv2b')}}</div>
              <div class="q-mt-md row justify-center q-gutter-md">
                <q-btn size="md" dense :label="$t('renoncer')" color="primary" @click="closeQ"/>
                <bouton-confirm actif :confirmer="finHeb"/>
              </div>
            </div>

            <div v-if="step === 1" class="q-ma-sm">
              <choix-quotas class="q-my-sm" :quotas="q" @change="onChgQ"/>
              <div v-if="q.err" class="q-pa-xs q-ma-sm titre-md text-bold text-negative bg-yellow-3">{{$t('AGmx')}}</div>
              <div v-if="al1" class="q-pa-xs q-ma-sm titre-md text-bold text-negative bg-yellow-3">{{$t('AGv1b')}}</div>
              <div v-if="al2" class="q-pa-xs q-ma-sm titre-md text-bold text-negative bg-yellow-3">{{$t('AGv2b')}}</div>
              <div :class="'q-pa-xs titre-md q-ma-sm ' + (ar1 ? 'text-negative text-bold bg-yellow-3' : '')">{{$t('AGdisp1', [rst1])}}</div>
              <div :class="'q-pa-xs titre-md q-ma-sm ' + (ar2 ? 'text-negative text-bold bg-yellow-3' : '')">{{$t('AGdisp2', [rst2])}}</div>
              <div class="row justify-center q-gutter-md">
                <q-btn size="md" dense :label="$t('renoncer')" color="primary" @click="closeQ"/>
                <bouton-confirm v-if="!q.err && (al1 || al2)" actif :confirmer="chgQ"/>
                <q-btn v-if="!q.err && !al1 && !al2" size="md" dense :label="$t('confirmer')" color="primary" @click="chgQ"/>
              </div>
            </div>

          </q-page>
        </q-page-container>
      </q-layout>
    </q-dialog>
  </div>
</template>

<script>
import { reactive } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuMembre from './ApercuMembre.vue'
import ApercuGenx from './ApercuGenx.vue'
import { edvol, dhcool } from '../app/util.mjs'
import { UNITEV1, UNITEV2, AMJ } from '../app/api.mjs'
import { MajCvGr } from '../app/operations.mjs'
import BoutonMembre from './BoutonMembre.vue'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonHelp from './BoutonHelp.vue'
import QuotasVols from './QuotasVols.vue'
import ChoixQuotas from './ChoixQuotas.vue'
import { getNg } from '../app/modele.mjs'

export default {
  name: 'ApercuGroupe',

  props: { 
    eg: Object,
    idx: Number,
    mapmc: Object
  },

  components: { ChoixQuotas, BoutonConfirm, BoutonHelp, ApercuMembre, ApercuGenx, BoutonMembre, QuotasVols },

  computed: {
    bcf () { return this.$q.dark.isActive ? ' bordfonce' : ' bordclair' },

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
    lstAn () {
      const t = []; this.anims.forEach(id => { t.push(getNg(id).nom)})
      return t.join(', ')
    },
    alq1 () { return !this.eg.groupe.imh || (this.eg.objv.v1 > this.eg.objv.q1) },
    alq2 () { return !this.eg.groupe.imh || (this.eg.objv.v2 > this.eg.objv.q2) },
    moi () { return getNg(this.session.avatarId).nom },
    hbg () { return this.eg.membres.get(this.eg.groupe.imh).na.nom }
  },

  data () { return {
    editerUna: false,
    changerQuotas: false,
    /* cas:
    1: l'avatar courant est hébergeur du groupe
    2: il y a un hébergeur (pas moi) et je suis animateur
    3: il y a un hébergeur (pas moi) et je ne suis pas animateur
    4: pas d'hébergeur et l'avatar courant est animateur
    5: pas d'hébergeur, avatar courant pas animateur, et il y a des animateurs
    6: pas d'hébergeur, avatar courant pas animateur, et il n'y pas d'animateur
    */
    cas: 0,
    anims: new Set(), // set des Ids des animateurs du groupe
    estAnim: false, // l'avatar courant est animateur du groupe
    step: 0,
    al1: false,
    al2: false,
    rst1: 'OB',
    rst2: 'OB',
    ar1: false,
    ar2: false
  }},

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },

    async cvchangee (res) {
      if (res && this.na) {
        await new MajCvGr().run(this.eg.groupe, res.ph, res.info)
      }
    },
    
    setCas () {
      const g = this.eg.groupe
      this.anims = this.gSt.animIds(this.eg)
      this.estAnim = this.anims.has(this.session.avatarId)
      if (g.imh) {
        const m = this.eg.membres.get(g.imh)
        if (m && m.na.id === this.session.avatarId) return 1
        return this.estAnim ? 2 : 3
      } else {
        return this.estAnim ? 4 : (this.anims.size ? 5 : 6)
      }
    },
    gererHeb () {
      this.step = 0
      this.cas = this.setCas()
      this.changerQuotas = true
    },
    closeQ () { this.changerQuotas = false },
    gotocq () {
      this.step = 1
      const vx = this.eg.objv.vols
      const cpt = this.aSt.compta.compteurs
      this.q.q1 = vx.q1 || 0
      this.q.q2 = vx.q2 || 0
      this.q.min1 = 0
      this.q.min2 = 0
      this.q.max1 = cpt.q1 - Math.ceil(cpt.v1 / UNITEV1)
      this.q.max2 = cpt.q2 - Math.ceil(cpt.v2 / UNITEV2)
      this.q.err = false
      this.onChgQ()
    },
    onChgQ () {
      const cpt = this.aSt.compta.compteurs
      const vx = this.eg.objv.vols
      this.al1 = vx.v1 > (this.q.q1 * UNITEV1)
      this.al2 = vx.v2 > (this.q.q2 * UNITEV2)
      const r1 = (cpt.q1 - Math.ceil(cpt.v1 / UNITEV1) - this.q.q1) * UNITEV1
      const r2 = (cpt.q2 - Math.ceil(cpt.v2 / UNITEV2) - this.q.q2) * UNITEV2
      this.rst1 = edvol(r1 >=0 ? r1 : 0)
      this.rst2 = edvol(r2 >=0 ? r2 : 0)
      this.ar1 = r1 < (cpt.q1 * UNITEV1 * 0.1)
      this.ar2 = r2 < (cpt.q2 * UNITEV2 * 0.1)
    },
    
    editUna () {
      // TODO 
      this.editerUna = true
    },

    finHeb () {
      this.closeQ()
      // TODO
    },

    chgQ () {
      this.closeQ()
      // TODO
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
    const aSt = stores.avatar
    const photoDef = stores.config.iconGroupe
    const q = reactive({q1:0, q2:0, min1:0, min2:0, max1:0, max2:0, err:false })
    return {
      session,
      ui,
      photoDef,
      gSt,
      aSt,
      q
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.borda
  border: 1px solid $grey-5
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
