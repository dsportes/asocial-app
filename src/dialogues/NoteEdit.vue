<template>
<div :class="dkli(0) + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOedtit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOedtit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        :disable="er || session.editDiag"  @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="groupe" inset class="full-width bg-secondary text-white">
      <q-toolbar-title class="text-italic titre-md text-center">{{$t('PNOecr', [naAut ? naAut.nom : '???'])}}</q-toolbar-title>
    </q-toolbar>
    <q-toolbar v-if="session.editDiag" inset class="full-width bg-secondary text-white">
      <div class='q-ma-sm q-pa-sm text-center text-bold titre-md bg-yellow-5 text-warning'>
        {{session.editDiag}}
      </div>
    </q-toolbar>
  </q-header>

  <q-page-container >
    <q-page class="q-pa-xs">

      <div v-if="type === 4 && avP" class="q-pa-xs bord1">
        <div class="titre-md">
          <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span>{{$t('PNOrav', [avP.na.nom])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{nodeP.label}}</div>
      </div>
      <div v-if="type === 5 && grP" class="q-pa-xs bord1">
        <div class="titre-md">
          <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span>{{$t('PNOrgr', [grP.na.nomc])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{nodeP.label}}</div>
      </div>

      <note-ecritepar @ok="selNa"/>

      <div v-if="er" class="q-my-md q-pa-xs titre-md text-bold text-negative bg-yellow-5">
        {{$t('PNOer' + er)}}</div>

      <div v-if="wng" class="titre-md text-bold text-negative bg-yellow-5 q-pa-xs q-mt-sm">
        {{$t('PNOw' + wng)}}</div>
      
      <div v-if="!er && !session.editDiag" class="sp40 column">
        <liste-auts/>
        <editeur-md class="col" :texte="nSt.note.txt" mh="65vh"
          :lgmax="cfg.maxlgtextesecret" editable modetxt v-model="texte"/>
        <q-separator color="orange" class="q-mt-sm"/>
      
        <div class="col-auto q-mt-sm row">
          <bouton-undo :cond="(this.prot ? 1 : 0)!==nSt.node.note.p" 
            @click="prot=nSt.node.note.p ? true : false"/>
          <q-toggle class="col-auto titre-md" v-model="prot" :label="$t('PNOpr')"/>
        </div>
      </div>
    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { afficherDiag, splitPK, dkli } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import { MajNote } from '../app/operations.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import ListeAuts from '../components/ListeAuts.vue'
import NoteEcritepar from '../dialogues/NoteEcritepar.vue'
import { ID, UNITEV1 } from '../app/api.mjs'

export default {
  name: 'NoteEdit',

  components: { BoutonHelp, BoutonUndo, EditeurMd, ListeAuts, NoteEcritepar },

  props: { },

  computed: {
    modifie () { return this.nSt.note.txt !== this.texte ||
      (this.prot ? 1 : 0) !== this.nSt.note.p }
  },

  methods: {
    selNa (na) {
      this.naAut = na
      this.erEdit()
    },

    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },

    async valider () {
      const dv = this.texte.length - this.nSt.note.txt.length
      if (this.wng && dv > 0) {
        await afficherDiag($t('PNOw' + this.wng))
        return
      }
      if (this.type === 5) {
        const n = this.erGr(dv)
        if (n === 2) {
          await afficherDiag($t('PNOer11'))
          return
        }
      }
      if (this.type === 4) {
        const c = this.aSt.compta.compteurs
        if (c.v1 + dv > c.q1 * UNITEV1) {
          await afficherDiag($t('PNOer10'))
          return
        }
      }
      const idc = this.avatar ? this.session.compteId : this.groupe.idh
      const n = this.nSt.note
      const im = this.avatar ? 0 : this.aSt.compte.imGA(this.groupe.id, this.naAut.id)
      await new MajNote()
        .run(n.id, n.ids, im, n.auts, this.texte, this.prot, idc)
      MD.fD()
    }
  },

  data () {
    return {
      texte: '',
    }
  },

  setup () {
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const cfg = stores.config

    const type = ref(0)
    const prot = ref(nSt.note.p ? true : false)

    const naAut = ref()
    const er = ref(0)
    const wng = ref(0)

    const avatar = ref(null)
    const groupe = ref(null)

    const { id, ids } = splitPK(nSt.node.note.refk)
    const idp = ref(id) // id du parent - racine si ids = 0 - GROUPE ou AVATAR
    const grP = ref(null) // groupe de la note parente
    const avP = ref(null) // avatar de la note parente
    if (idp.value) {
      if (ID.estGroupe(idp.value)) {
        grP.value = gSt.egr(idp.value).groupe
      } else {
        avP.value = aSt.getElt(idp.value).avatar
      }
    }

    const nodeP = ref(idp.value ? nSt.nodeP : null)

    switch (nSt.node.type) {
      case 4: {
        type.value = 4
        if (aSt.exV1) wng.value = 1
        avatar.value = aSt.getElt(nSt.note.id).avatar
        break
      }
      case 5: {
        type.value = 5
        groupe.value = gSt.egr(nSt.note.id).groupe
        wng.value = erGr(0)
        break
      }
    }

    function erEdit () {
      if (nSt.node.type === 3) return 1
      if (nSt.node.type === 4) return 0
      // note de groupe
      const estAnim = gSt.egr(groupe.value.id).estAnim
      const im = nSt.note.im
      if (im) { // le membre ayant l'exclu actuel est-il avc ?
        const na = aSt.compte.naDeIdgIm(groupe.value.id, im)
        if (!na && !estAnim) return 8
      }
      if (naAut.value) {
        const img = aSt.compte.imGA(groupe.value.id, naAut.value.id)
        if (!groupe.value.estAuteur(img)) this.er = 7
      }
      return 0
    }

    function erGr (dv) {
      const g = groupe.value
      if (!g.imh) return 3
      const eg = gSt.egr(g.id)
      if (eg.objv.vols.v1 + dv >= eg.objv.vols.q1 * UNITEV1) return 2
      return 0
    }

    er.value = erEdit()

    return {
      session, nSt, aSt, gSt, cfg, naAut, er, wng, erEdit, erGr,
      avatar, groupe, type, nodeP, prot, avP, grP,
      MD, dkli
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.mh
  max-height: 3.2rem
  width: 15rem
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.bord2
  border: 3px solid $warning
  border-radius: 5px
.dec
  position: relative
  left: -7px
</style>
