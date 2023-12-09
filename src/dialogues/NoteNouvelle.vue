<template>
<q-dialog v-model="ui.d.NNnotenouvelle" persistent full-height>
<q-layout container view="hHh lpR fFf" :class="dkli(0) + ' bs dp50'">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="!estgr" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="estgr" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        :disable="err || session.editDiag || (estgr && !naAut)" @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="session.editDiag" inset class="full-width bg-secondary text-white">
      <div class='q-ma-sm q-pa-sm text-center text-bold titre-md bg-yellow-5 text-warning'>
        {{session.editDiag}}
      </div>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="q-pa-xs">

      <div v-if="avP" class="q-ma-xs q-pa-xs bord1">
        <div class="titre-md">
          <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span>{{$t('PNOrav', [avP.na.nom])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{nSt.node.label}}</div>
      </div>

      <div v-if="grP" class="q-ma-xs q-pa-xs bord1">
        <div class="titre-md">
          <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span>{{$t('PNOrgr', [grP.na.nomc])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{nSt.node.label}}</div>
      </div>

      <div v-if="!estgr && nSt.node.type === 2" class="q-ma-xs q-pa-xs bord1 titre-md">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
        <span>{{$t('PNOracgr', [nSt.node.label])}}</span>
      </div>

      <div v-if="err" class="titre-md q-my-sm q-pa-xs bg-yellow-5 text-bold text-italic">
        {{$t('PNOer' + err)}}
      </div>

      <note-ecritepar v-if="estgr" :groupe="groupe" @ok="selNa"/>

      <div v-if="!err && !session.editDiag && (!estgr || (estgr && naAut))" class="column sp40">
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
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { ID, UNITEV1 } from '../app/api.mjs'
import { getNg } from '../app/modele.mjs'
import { dkli, splitPK } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { NouvelleNote } from '../app/operations.mjs'
import NoteEcritepar from '../dialogues/NoteEcritepar.vue'

export default {
  name: 'NoteNouvelle',

  components: { BoutonHelp, BoutonUndo, EditeurMd, NoteEcritepar },

  props: {
    estgr: Boolean, // note de groupe à créer
    groupe: Object, // si estgr, le groupe
    avatar: Object, // si !estgr, l'avatar
    notep: Object // si sous-note, la note parent
  },

  computed: {
    modifie () { return this.texte !== '' || this.exclu }
  },

  watch: {
  },

  methods: {
    fermer () { if (this.modifie) this.ui.oD('confirmFerm'); else this.ui.fD() },

    async valider () {
      let id = 0, idc = 0, ref = null, im = 0, rnom = ''
      if (!this.estgr) {
        id = this.avatar.id
        idc = this.session.compteId
      } else {
        id = this.groupe.id
        idc = this.groupe.idh
        im = this.aSt.compte.imGA(id, this.naAut.id)
      }

      /* note rattachée à une autre note OU note avatar rattachée à une racine de groupe
        `ref` : [rid, rids, rnom] crypté par la clé de la note. Référence d'une autre note
        rnom n'est défini que pour une note d'avatar référençant un note de groupe
        (rnom est celui du groupe)
      */
      if (!this.estgr) { // Note avatar
      const nd = this.nSt.node
        if (nd.type === 2) { // rattachée à une racine de groupe
          const x = splitPK(nd.key)
          ref = [x.id, x.ids, nd.label]
        } else if (this.idp && this.idp) { // rattachée à une note d'un groupe ou de l'avatar
          let rnom = ''
          if (ID.estGroupe(this.idp)) { // d'un groupe
            const na = getNg(this.idp) // normalement le groupe "parent" est connu
            if (na) rnom = na.nomc
          }
          ref = [this.idp, this.idsp, rnom]
        }
      } else if (this.idp) { // Note de groupe rattachée
        ref = [this.idp, this.idsp, '']
      }

      const key = await new NouvelleNote().run(id, this.texte, im, this.exclu, ref, idc)
      this.ui.fD()
    }
  },

  data () {
    return {
      texte: '',
      exclu: false
    }
  },

  setup (props) {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const cfg = stores.config

    const estgr = toRef(props, 'estgr')
    const avatar = toRef(props, 'avatar')
    const groupe = toRef(props, 'groupe')
    const notep = toRef(props, 'notep')

    const idp = ref(notep.value ? notep.value.id : 0) // id du parent 
    const idsp = ref(notep.value ? notep.value.ids : 0) // ids du parent 
    const grP = ref(null) // groupe de la note parente
    const avP = ref(null) // avatar de la note parente
    if (idp.value) {
      if (ID.estGroupe(idp.value)) {
        grP.value = gSt.egr(idp.value).groupe
      } else {
        avP.value = aSt.getElt(idp.value).avatar
      }
    }

    const err = ref(0)

    const naAut = ref()
    function selNa (elt) {
      naAut.value = elt.na
    }

    /*
    const rack = parseInt(nSt.node.rkey)
    const grRac = ref(ID.estGroupe(rack) ? gSt.egr(rack).groupe : null) 
    */

    function setErr () {
      if (!estgr.value) {
        if (aSt.exV1) err.value = 1 // excédent nn + nc + ng / q1
      } else {
        if (!groupe.value.imh) err.value = 3
        else {
          const eg = gSt.egr(groupe.value.id)
          // Excède le max attribué du groupe
          if (eg.objv.vols.v1 >= eg.objv.vols.q1 * UNITEV1) err.value = 2
        }
      }
    }

    setErr()

    return {
      ui, session, nSt, aSt, gSt, cfg,
      err, naAut, selNa, idp, idsp, grP, avP,
      dkli
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
