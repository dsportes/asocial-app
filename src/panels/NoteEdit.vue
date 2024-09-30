<template>
<q-dialog v-model="ui.d[idc].NE" persistent full-height position="left">
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @ok="fermer"/>
      <q-toolbar-title class="titre-lg full-width text-center">
        {{$t(note.deGroupe ? 'PNOngr' : 'PNOnper', [nom])}}
      </q-toolbar-title>
      <btn-cond icon="check" :label="$t('valider')" cond="cEdit"
        :disable="(note.deGroupe && !aut) || !modifie"  @ok="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.cEdit" inset class="full-width msg">{{session.cEdit}}</q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs">
      <node-parent />

      <q-separator class="q-my-sm" color="orange"/>

      <div v-if="note.deGroupe">
        <liste-auts class="q-my-sm"/>

        <note-ecritepar :note="nSt.note" @ok="selNa"/>

        <div v-if="xav">
          <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
          <apercu-genx class="q-my-md" :id="xav.id" :im="xav.im"/>
        </div>
        <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>

      </div>

      <editeur-md class="col" :texte="nSt.note.texte" mh="50vh"
        :lgmax="cfg.maxlgtextesecret" 
        :editable="(!note.estGroupe || (note.estGroupe && naAut)) && !session.cEdit"
        modetxt v-model="texte"/>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import { ref, onUnmounted } from 'vue'

import stores from '../stores/stores.mjs'
import { styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { MajNote } from '../app/operations4.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import ListeAuts from '../components/ListeAuts.vue'
import NoteEcritepar from '../components/NoteEcritepar.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import NodeParent from '../components/NodeParent.vue'
import BtnCond from '../components/BtnCond.vue'

export default {
  name: 'NoteEdit',

  components: { BoutonHelp, EditeurMd, ListeAuts, NoteEcritepar, ApercuGenx, BtnCond, NodeParent },

  props: { },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modifie () { return this.note.texte !== this.texte },
    idas () { return Note.idasEdit(this.node) },
    nom () { return this.pSt.nom(this.note.id)},
    xav () { return this.nSt.mbExclu } // retourne { avc: true/false, ida, im, cv } ou null s'il n'y a pas d'exclusivité
  },

  methods: {
    fermer () { if (this.modifie) this.ui.oD('confirmFerm', 'a'); else this.ui.fD() },

    async valider () {
      const n = this.note
      const aut = !this.note.deGroupe ? 0 : this.aut.id
      await new MajNote().run(n.id, n.ids, aut, this.texte)
      this.ui.fD()
    },

    selNa (e) { 
      this.aut = e 
    } // { nom, i, ko, im, id }
  },

  data () {
    return {
      texte: '',
      aut: null
    }
  },

  setup () {
    const session = stores.session
    const nSt = stores.note

    const gSt = stores.groupe
    const pSt = stores.people
    const cfg = stores.config
    const ui = stores.ui
    const idc = ui.getIdc(); onUnmounted(() => ui.closeVue(idc))
    const node = ref(nSt.node)
    const note = ref(nSt.note)

    return {
      session, nSt, gSt, pSt, ui, idc, cfg, node, note, styp
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
</style>
