<template>
<q-dialog v-model="ui.d.NE" persistent full-height position="left">
  <q-layout container view="hHh lpR fFf" :class="styp('md')">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOedtit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOedtit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        :disable="(groupe && !naAut) || session.editDiag || !modifie"  @click="valider"/>
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

      <div v-if="groupe" class="sp40">
        <liste-auts class="q-my-sm"/>

        <note-ecritepar :groupe="groupe" :note="nSt.note" @ok="selNa"/>

        <div v-if="xav"> <!-- Bloc exclu -->
          <div class="text-italic titre-md text-bold">{{$t('PNOext2')}}</div>
          <apercu-genx v-if="xav.na" class="q-my-md" 
            :id="xav.na.id" :im="xav.im"/>
          <div v-else class="titre-md text-bold">{{xav.nom}}</div>
        </div>
        <div v-else class="text-italic titre-md text-bold">{{$t('PNOext1')}}</div>

        <div v-if="grP" class="q-pa-xs bord1">
          <div class="titre-md">
            <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
            <span>{{$t('PNOrgr', [grP.na.nomc])}}</span>
          </div>
          <div class="q-ml-sm text-italic">{{nodeP.label}}</div>
        </div>

      </div>

      <div v-else class="sp40">
        <div v-if="avP" class="q-pa-xs bord1">
          <div class="titre-md">
            <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
            <span>{{$t('PNOrav', [avP.na.nom])}}</span>
          </div>
          <div class="q-ml-sm text-italic">{{nodeP.label}}</div>
        </div>
      </div>
      
      <editeur-md class="col" :texte="nSt.note.txt" mh="50vh"
        :lgmax="cfg.maxlgtextesecret" 
        :editable="(!groupe || (groupe && naAut)) && !session.editDiag"
        modetxt v-model="texte"/>

    </q-page>
  </q-page-container>
</q-layout>
</q-dialog>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import { splitPK, dkli, styp } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { MajNote } from '../app/operations.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import ListeAuts from '../components/ListeAuts.vue'
import NoteEcritepar from '../dialogues/NoteEcritepar.vue'
import ApercuGenx from '../components/ApercuGenx.vue'
import { ID } from '../app/api.mjs'

export default {
  name: 'NoteEdit',

  components: { BoutonHelp, EditeurMd, ListeAuts, NoteEcritepar, ApercuGenx },

  props: { },

  computed: {
    sty () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modifie () { return this.nSt.note.txt !== this.texte }
  },

  methods: {
    fermer () { if (this.modifie) this.ui.oD('confirmFerm'); else this.ui.fD() },

    async valider () {
      const n = this.nSt.note
      const aut = this.avatar ? 0 : this.aSt.compte.imGA(this.groupe.id, this.naAut.id)
      await new MajNote().run(n.id, n.ids, aut, this.texte)
      this.ui.fD()
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
    const pSt = stores.people
    const cfg = stores.config
    const ui = stores.ui

    const type = ref(0)

    const naAut = ref()
    const xav = ref()

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
        avatar.value = aSt.getElt(nSt.note.id).avatar
        break
      }
      case 5: {
        type.value = 5
        groupe.value = gSt.egr(nSt.note.id).groupe
        xav.value = nSt.mbExclu // retourne { avc: true/false, nom } ou null s'il n'y a pas d'exclusivité
        break
      }
    }

    function selNa (elt) { naAut.value = elt.na }

    function cv(x) {
      return !x.avc ? pSt.getCv(x.na.id) : aSt.getAvatar(x.na.id).cv
    }

    return {
      session, nSt, aSt, gSt, ui, cfg, naAut, selNa, styp,
      avatar, groupe, type, nodeP, avP, grP, xav,
      dkli, cv
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
