<template>
<q-dialog v-model="ui.d.NX" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" padding="xs" icon="chevron_left" @click="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t('PNOextit', [groupe.na.nomc])}}
      </q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.editDiag" inset class="full-width bg-secondary text-white">
      <div class='q-ma-sm q-pa-sm text-center text-bold titre-md bg-yellow-5 text-warning'>
        {{session.editDiag}}
      </div>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">
      <liste-auts class="q-my-sm"/>

      <div class="spsm"> <!-- Bloc "perdre" -->
        <div v-if="xav">
          <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
          <apercu-genx v-if="xav.na" class="q-my-md" 
            :id="xav.na.id" :im="xav.im"/>
          <div v-else class="titre-md text-bold">{{xav.nom}}</div>
          <q-btn v-if="xav.avc" 
            dense size="md" color="primary" icon="close" padding="xs"
            :label="$t('PNOperdre1')" @click="perdre"/>
          <q-btn v-if="!xav.avc && anim" 
            dense size="md" color="primary" icon="close" padding="xs"
            :label="$t('PNOperdre2')" @click="perdre"/>
        </div>
        <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>
      </div>

      <div v-if="!amb" class="q-my-md q-pa-xs text-bold text-negative bg-yellow-5">
        {{$t('PNOamb')}}</div>

      <div class="q-mt-md titre-lg text-italic text-center">
        {{$t('PNOlex')}}
        <bouton-bulle idtext="exclu"/>
      </div>

      <div class="spsm q-mt-sm scroll" style="max-height:40vh">
        <div v-for="(e, idx) in lst" :key="idx" 
          :class="dkli(idx) + ' q-mt-xs row cursor-pointer bord' + (xap && (e.im === xap.im) ? '2' : '1')"
          @click="selmb(e)">
          <div class="col-2 text-center">#{{e.im}}</div>
          <div class="col-10">{{e.nom}}</div>
        </div>
      </div>

      <q-separator color="orange" class="q-my-sm"/>

      <div class="row justify-end q-gutter-sm">
        <q-btn flat size="md" dense color="primary" padding="xs" icon="undo"
          :label="$t('renoncer')" @click="ui.fD"/>
        <q-btn v-if="!session.editDiag" :disable="!xap"
          padding="xs" size="md" dense color="warning" icon="check"
          :label="$t('PNOex')" @click="valider"/>
      </div>

      <apercu-genx v-if="xap" class="q-my-md" :id="xap.na.id" :im="xap.im"/>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { dkli, styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import ListeAuts from '../components/ListeAuts.vue'
import BoutonBulle from '../components/BoutonBulle.vue'
import { ExcluNote } from '../app/operations.mjs'

export default {
  name: 'NoteExclu',

  components: { BoutonHelp, BoutonBulle, ApercuGenx, ListeAuts },

  props: { },

  computed: { 
    egr () { return this.gSt.egr(this.nSt.note.id) },
    groupe () { return this.egr.groupe },
    amb () { return this.aSt.compte.ambano(this.groupe)[0] },
    anim () { return this.egr.estAnim },
    xav () { return this.nSt.mbExclu },

    /* Pour une note de groupe, liste des {im, na, nom} des membres 
    aptes à recevoir l'exclusivité, sauf celui actuel */
    lst () { return this.nSt.lstImNa }
  },

  watch: {  },

  methods: {
    cv (x) {
      return !x.avc ? this.pSt.getCv(x.na.id) : this.aSt.getAvatar(x.na.id).cv
    },
    selmb (e) {
      e.cv = this.cv(e)
      this.xap = e
    },
    async valider () {
      const n = this.nSt.note
      await new ExcluNote().run(n.id, n.ids, this.xap.im)
      this.xap = null
    },
    async perdre () {
      const n = this.nSt.note
      await new ExcluNote().run(n.id, n.ids, 0)
      this.xap = null
    }
  },

  data () {
    return {
      xap: null // sélection pour prendre l'exclusivité
    }
  },

  setup () {
    return {
      session: stores.session,
      ui: stores.ui, 
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
