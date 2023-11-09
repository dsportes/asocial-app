<template>
  <div>
    <!--div :class="dkli(idx)"-->
      <q-expansion-item switch-toggle-side expand-separator dense group="trgroup">
        <template v-slot:header>
          <apercu-genx v-if="people" :na="mb.na" :cv="mb.cv" :ids="mb.ids" :idx="idx" detail-people/>
          <div v-else class="row justify-between">
            <div>
              <span class="titre-lg text-bold text-primary">{{$t('moi2', [mb.na.nom])}}</span>
              <span class="q-ml-lg font-mono fs-sm">{{'#' + mb.na.id}}</span>
            </div>
            <bouton-membre v-if="!nopanel" :eg="eg" :im="mb.ids" btn/>
          </div>
        </template>

        <div>
          <div v-if="mb.ids === 1" class="titre-md q-mt-sm">{{$t('AMfond')}}</div>

          <div v-for="f of flagListe(fl)" :key="f">
            <span>{{$t('FLAGS' + f)}}</span>
          </div>

          <div class="q-mt-sm row titre-md text-italic">
            <div class="col-3 text-center">{{$t('AMddi')}}</div>
            <div class="col-3 text-center">{{$t('AMdpa')}}</div>
            <div class="col-3 text-center">{{$t('AMdfa')}}</div>
            <div class="col-3 text-center">{{$t('AMddp')}}</div>
          </div>
          <div class="row fs-md font-mono">
            <div class="col-3 text-center">{{xd(mb.ddi)}}</div>
            <div class="col-3 text-center">{{xd(mb.dpa)}}</div>
            <div class="col-3 text-center">{{xd(mb.dfa)}}</div>
            <div class="col-3 text-center">{{xd(mb.ddp)}}</div>
          </div>
      </div>
      </q-expansion-item>

  </div>
</template>
<script>
import { ref, toRef } from 'vue'

import { dkli } from 'src/app/util.mjs'
import { AMJ, flagListe } from '../app/api.mjs'
import stores from '../stores/stores.mjs'
import BoutonConfirm from './BoutonConfirm.vue'
import BoutonMembre from './BoutonMembre.vue'
import ApercuGenx from './ApercuGenx.vue'
import BoutonHelp from './BoutonHelp.vue'
import { MD } from '../app/modele.mjs'
import { StatutMembre } from '../app/operations.mjs'

export default {
  name: 'ApercuMembre',

  props: { 
    mb: Object,
    eg: Object,
    mapmc: Object,
    idx: Number, 
    people: Boolean,
    nopanel: Boolean // Ne pas mettre le bouton menant à PanelMembre
  },

  components: { BoutonHelp, BoutonConfirm, ApercuGenx, BoutonMembre },

  computed: {
    fl () { return this.eg.groupe.flags[this.mb.ids] },
    una () { return this.eg.groupe.inv !== null },
    ro () { 
      if (this.mb.estAc) {
        const d = this.session.edit(true)
        return d || ''
      }
      if (!this.eg.estAnim) return this.$t('AMpasanst1')
      if (this.st === 32) return this.$t('AMpasanst2')
      return ''
    }
  },

  /*
  1 - invitation
  2 - modification d'invitation
  3 - acceptation d'invitation
  4 - refus d'invitation
  5 - modification du rôle laa (actif)
  6 - résiliation
  7 - oubli
  */

  data () { return {
    action: false,
    fn: 0, // fonction à effectuer
    laa: 0, // 0:lecteur, 1:auteur, 2:animateur
    err1: '',
    err2: '',
    ardoise: ''
  }},

  methods: {
    xd (d) { return !d ? '-' : AMJ.editDeAmj(d, true) },

    async setAc (fn, laa) {
      // Contrôles fins
      this.err1 = '' // bloquantes
      this.err2 = '' // pas bloquantes
      if (fn === 6 && this.st === 32 ) {
        if (this.gSt.animIds(this.gSt.egrC).size === 1) this.err2 = this.$t('AMdan2')
      }
      this.action = false
      this.fn = fn
      this.laa = laa
      setTimeout(() => { this.action = true }, 200)
    },
    async changeSt () {
      this.action = false
      this.session.setMembreId(this.mb.ids)
      this.ovchgSt()
    },
    async actionSt () {
      this.action = false
      this.err1 = ''
      this.err2 = ''
      // MD.fD() // ???
      /* 
        gr: groupe
        mb: membre
        fn: fonction à appliquer
        laa: lecteur, auteur, animateur
        ard: texte de l'ardoise, null s'il n'a pas changé
      */
      const ard = this.eg.groupe.ard === this.ardoise ? null : this.ardoise
      const code = await new StatutMembre().run(this.eg.groupe, this.mb, this.fn, this.laa, ard)
      if (this.code) {
        await afficherDiag(this.$t('AMx' + code))
      }
      this.closeSt()
    },
    closeSt () {
      MD.fD()
      this.action = false
      this.err1 = ''
      this.err2 = ''
    },
    ouvrirdetails () {
      this.session.setPeopleId(this.mb.na.id)
      MD.oD('detailspeople')
    }
  },

  setup (props) {
    const session = stores.session
    const gSt = stores.groupe

    const mb = toRef(props, 'mb')
 
    const chgSt = ref(false)
    function ovchgSt () { MD.oD(chgSt) }

    return {
      MD, dkli, flagListe, chgSt, ovchgSt,
      session,
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
