<template>
<q-dialog v-model="ui.d[idc].NX" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(nSt.note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>
      <btn-cond icon="check" :label="$t('valider')" cond="cEdit"
        :disable="!xap"  @ok="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.cEdit" inset class="full-width msg">{{session.cEdit}}</q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">
      <node-parent />

      <q-separator class="q-my-sm" color="orange"/>

      <liste-auts class="q-my-sm"/>

      <div class="spsm"> <!-- Bloc "perdre" -->
        <div v-if="xav">
          <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
          <apercu-genx class="q-my-md" :id="xav.ida" :im="xav.im"/>
          <btn-cond v-if="xav.avc" icon="close" cond="cEdit"
            :label="$t('PNOperdre1')" @ok="perdre"/>
          <btn-cond v-if="!xav.avc && anim" icon="close" cond="cEdit"
            :label="$t('PNOperdre2')" @ok="perdre"/>
        </div>
        <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>
      </div>

      <div v-if="!amb" class="q-my-md msg">{{$t('PNOamb')}}</div>

      <div :class="'q-my-md ' + (peutTr ? '' : 'msg')">{{$t('PNOpeut')}}</div>

      <div class="q-mt-md">
        <span class="titre-lg text-italic text-center">{{$t('PNOlex')}}</span>
        <bouton-bulle idtext="exclu"/>
      </div>

      <div class="spsm q-mt-sm" style="max-height:40vh;overflow-y:auto">
        <div v-for="(e, idx) in lst" :key="idx" 
          :class="dkli(idx) + ' q-mt-xs row cursor-pointer bord' + (xap && (e.im === xap.im) ? '2' : '1')"
          @click="selmb(e)">
          <div class="col-2 text-center">#{{e.im}}</div>
          <div class="col-10">{{e.nom}}</div>
        </div>
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <apercu-genx v-if="xap" class="q-my-md" :id="xap.ida" :im="xap.im"/>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import { onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { dkli, styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ListeAuts from '../components/ListeAuts.vue'
import BoutonBulle from '../components/BoutonBulle.vue'
import BtnCond from '../components/BtnCond.vue'
import NodeParent from '../components/NodeParent.vue'
import { ExcluNote } from '../app/operations4.mjs'

export default {
  name: 'NoteExclu',

  components: { BoutonHelp, BoutonBulle, ApercuGenx, ListeAuts, BtnCond, NodeParent },

  props: { },

  computed: { 
    nom () { return this.pSt.nom(this.nSt.note.id)},
    mav () { return this.session.compte.mav },

    egr () { return this.gSt.egr(this.nSt.note.id) },
    groupe () { return this.egr.groupe },
    amb () { return this.session.compte.ambano(this.groupe)[0] },
    anim () { return this.egr.estAnim },
    xav () { return this.nSt.mbExclu }, // retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité

    peutTr () { return !this.xav || this.estAnim || (this.xav && this.mav.has(this.xav.ida)) },

    /* Pour une note de groupe, liste des {im, na, nom} des membres 
    aptes à recevoir l'exclusivité, sauf celui actuel */
    lst () { return this.nSt.lstImNa }
  },

  watch: {  },

  methods: {
    selmb (e) {
      this.xap = e
    },
    async valider () {
      const n = this.nSt.note
      const ida = this.xap ? this.xap.ida : 0
      await new ExcluNote().run(n.id, n.ids, ida)
      this.xap = null
    },
    async perdre () {
      this.xap = null
      await this.valider()
    }
  },

  data () {
    return {
      xap: null // sélection pour prendre l'exclusivité
    }
  },

  setup () {
    const ui = stores.ui
    const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
    return {
      session: stores.session,
      ui, idc, 
      nSt: stores.note, 
      gSt: stores.groupe, 
      pSt: stores.people,
      aSt: stores.avatar,
      dkli, styp
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 2px solid transparent
.bord2
  border: 2px solid $warning
</style>
