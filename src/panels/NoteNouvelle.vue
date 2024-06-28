<template>
<q-dialog v-model="ui.d.NNnotenouvelle" full-height position="left" persistent>
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <btn-cond color="warning" icon="chevron_left" @click="fermer"/>
      <q-toolbar-title v-if="!estgr" class="titre-lg full-width text-center">
        {{$t(estgr ? 'PNOnvtit2' : 'PNOnvtit1', [nom])}}
      </q-toolbar-title>
      <btn-cond icon="check" :label="$t('valider')" cond="cEdit"
        :disable="err || (estgr && !naAut) || !texte" @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.cEdit" inset class="msg">{{session.cEdit}}</q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs">

      <div v-if="notep" class="q-ma-xs q-pa-xs bord1">
        <div class="titre-md">
          <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span v-if="ID.estGroupe(notep.id)">{{$t('PNOrgr', [nomp])}}</span>
          <span v-else>{{$t('PNOrav', [nomp])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{notep.titre}}</div>
      </div>

      <div v-if="!estgr && nSt.node.type === 2" class="q-ma-xs q-pa-xs bord1 titre-md">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
        <span>{{$t('PNOracgr', [nSt.cvNode.nomC])}}</span>
      </div>

      <div v-if="err" class="msg">{{$t('PNOer' + err)}}</div>

      <note-ecritepar v-if="estgr" :groupe="groupe" @ok="selNa"/>

      <div v-if="!err && !session.cEdit && (!estgr || (estgr && naAut))" class="column spmd">
        <editeur-md mh="50vh" class="col" texte="" :placeholder="$t('PNOdeft')"
          :lgmax="cfg.maxlgtextesecret" editable modetxt v-model="texte"/>
        <q-separator color="orange" class="q-mt-sm"/>

        <div v-if="estgr" class="col-auto q-mt-sm row">
          <bouton-undo :cond="exclu===true" @click="exclu=false"/>
          <q-toggle class=" titre-md" v-model="exclu" :label="$t('PNOex')" />
        </div>

      </div>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import stores from '../stores/stores.mjs'
import { dkli, styp } from '../app/util.mjs'
import { ID } from '../app/api.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import EditeurMd from '../components/EditeurMd.vue'
import BtnCond from '../components/BtnCond.vue'
import { NouvelleNote } from '../app/operations4.mjs'
import NoteEcritepar from '../components/NoteEcritepar.vue'

export default {
  name: 'NoteNouvelle',

  components: { BoutonHelp, BoutonUndo, EditeurMd, NoteEcritepar, BtnCond },

  props: {
    estgr: Boolean, // note de groupe à créer
    groupe: Object, // si estgr, le groupe
    avatar: Object, // si !estgr, l'avatar
    notep: Object // si sous-note, la note "parent" (en fait celle courante)
  },

  computed: {
    id () { return this.estgr ? this.groupe.id : this.avatar.id },
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modifie () { return this.texte !== '' },
    nom () { const cv = this.session.getCV(this.id); return this.estgr ? cv.nomC : cv.nom },
    nomp () { if (!this.notep) return ''
      const cv = this.session.getCV(this.notep.id); return ID.estGroupe(this.notep.id) ? cv.nomC : cv.nom 
    },
    err () {
      if (!this.estgr) {
        if (this.session.compte.qv.pcn >= 100) return 1 // excédent nn + nc + ng / q1
      } else {
        if (!this.groupe.imh) return 3 // pas d'hébergeur
        else if (groupe.nn >= groupe.qn) return 2 // nb max se notes du groupe dépassé
      }
      return 0
    }
  },

  watch: {
  },

  methods: {
    fermer () { if (this.modifie) this.ui.oD('confirmFerm'); else this.ui.fD() },

    selNa (elt) { naAut = elt },

    async valider () {
      let ref = null
      const aut = this.estgr ? this.naAut.id : 0

      // note rattachée à une autre note OU note avatar rattachée à une racine de groupe
      if (!this.estgr) { // Note avatar
        const nd = this.nSt.node
        if (nd.type === 2) ref = [Note.idDekey(nd.key), 0] // rattachée à une racine de groupe
        else if (this.notep) ref = [this.notep.id, this.notep.ids] // rattachée à une note d'un groupe ou de l'avatar
      } else if (this.notep) ref = [this.notep.id, this.notep.ids] // Note de groupe rattachée

      const key = await new NouvelleNote().run(this.id, this.texte, aut, this.exclu, ref)
      this.ui.fD()
    }
  },

  data () {
    return {
      naAut: null, // {nom, i, im, ida, ko} ko: 1 pas auteur, 2: n'a pas exclusiité (edition seulement) 
      texte: '',
      exclu: false
    }
  },

  setup (props) {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const cfg = stores.config

    return {
      ui, session, nSt, cfg, dkli, styp
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.bord2
  border: 2px solid $orange
  border-radius: 5px
.lg1
  width: 20rem
.lg2
  width: 35rem
.dec
  position: relative
  left: -7px
.mh
  max-height: 3.2rem
</style>
