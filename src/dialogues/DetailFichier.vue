<template>
<q-dialog v-model="ui.d.DFouvrir" persistent>
<q-layout container view="hHh lpR fFf" :class="styp('md')" style="height:70vh">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="ui.fD"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t('PNOdetail', [f.nom || '?', f.dh ? dhcool(f.dh, true) : '?'])}}
      </q-toolbar-title>      
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="ro" inset class="full-width msg">{{$t('PNOro')}} - {{ro}}</q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">
      <div class="row q-guterr-md full-width">
        <span class="font-mono">{{f.idf || '?'}}</span>
        <span class="q-mr-sm">{{f.type || '?'}}</span>
        <span v-if="f.lg" >{{edvol(f.lg)}}</span>
      </div>

      <div v-if="session.accesIdb" class="q-mx-xs q-my-sm q-pa-cs bord1">
        <div class="titre-lg">{{$t('DFavion')}}</div>
        <div class="q-ml-lg">

        </div>
      </div>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'
import { edvol, dhcool } from '../app/util.mjs'
import { styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BtnCond from '../components/BtnCond.vue'

export default {
  name: 'DetailFichier',

  props: { 
    note: Object,
    idf: Number,
    ro: String // raison de l'interdiction de mise à jour
  },

  components: { BoutonHelp, BtnCond },

  computed: {
    f () { return this.note.mfa.get(this.idf) || { fake: true } },
    fa () { return this.faSt.get(this.idf) || { fake: true } },
    fpr () { return this.f.fake ?  { fake: true } : this.note.fnom[this.f.nom][0] },
    avn () { const fax = this.fpr ? this.faSt.get(this.fpr.idf) : null; return fax ? fax.avn : false },
    av () { return this.fa.avn || false }
  },

  watch: {
  },

  data () {
    return {
    }
  },

  methods: {

  },

  setup () {
    return {
      nSt: stores.note,
      gSt: stores.groupe, 
      ui: stores.ui,
      session: stores.session,
      faSt: stores.ficav, 
      edvol, dhcool, styp
    }
  }
}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
