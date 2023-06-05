<template>
<div class="bs" style="width:80vw">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        :disable="!auteur" @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="column">
      <div v-if="type === 4" class="q-ma-xs q-pa-xs bord1">
        <div class="titre-md">
           <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span>{{$t('PNOrav', [avP.na.nom])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{nSt.noteP.titre}}</div>
      </div>
      <div v-if="type === 5" class="q-ma-xs q-pa-xs bord1">
        <div class="titre-md">
           <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span>{{$t('PNOrgr', [grP.na.nomc])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{nSt.noteP.titre}}</div>
      </div>
      <q-separator v-if="type === 4 || type === 5" class="q-my-sm" color="orange"/>

      <div v-if="auts.length > 1" class="q-my-sm q-mx-xs q-pa-xs row bord2">
        <q-select class="titre-md mh" :label="$t('PNOchaut')" v-model="chaut" :options="options"
          transition-show="scale" transition-hide="scale" filled
          bg-color="secondary" color="white" />
      </div>

      <div v-if="er" class="titre-md text-bold text-negative bg-yellow-5 q-pa-xs q-mt-sm q-mx-xs">
        {{er}}</div>
      
      <div class="column q-pa-sm lg2 maauto">
        <editeur-md style="height:50vh" :texte="nSt.note.txt"
          :lgmax="cfg.maxlgtextesecret" editable modetxt v-model="texte"/>

        <q-toggle class="q-mt-sm titre-md dec"
          v-model="prot" :label="$t('PNOpr')" />
      </div>
    </q-page>
  </q-page-container>
</q-layout>
</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { afficherDiag } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import { MajNote } from '../app/operations.mjs'

export default {
  name: 'NoteEdit',

  components: { BoutonHelp },

  props: { auts: Array },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
    chaut (ap) { this.auteur = ap.value }
  },

  methods: {
    async valider () {
      const dv = texte.length - this.nSt.note.txt.length
      if (this.er && dv > 0) {
        await afficherDiag($t('PNOw' + this.er))
        return
      }
      if (this.type === 2 || this.type === 5) {
        const n = this.erGr(dv)
        if (n === 6) {
          await afficherDiag($t('PNOer11'))
          return
        }
      }
      if (this.type === 2 || this.type === 5) {
        const c = this.aSt.compta.compteurs
        if (c.v1 + dv > c.q1 * UNITEV1) {
          await afficherDiag($t('PNOer10'))
          return
        }
      }
      const idc = this.avatar ? this.session.compteId : this.groupe.idh
      await new MajNote()
        .run(this.nSt.note.id, this.nSt.note.ids, this.im, this.texte, this.prot, idc)
      MD.fD()
    }
  },

  data () {
    return {
      texte: '',
    }
  },

  setup (props) {
    /* !!!!!!!!!!!!!!!!! im pas géré !!!!!!!!!!!!!!!!!!!!!!!*/
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe

    const type = ref(0)
    const auteur = ref(0)
    const chaut = ref(0)
    const auts = toRef(props, auts)
    const prot = ref(nSt.note.p ? true : false)

    const er = ref(0)

    const options = []
    auteur.value = auts.value[0]
    if (auts.value.length > 1) {
      auts.value.forEach(id => {
        const na = getNg(id)
        options.push({ label: na.nom, value: id })
      })
      chaut.value = options[0]
    }

    const avatar = ref(null)
    const groupe = ref(null)

    const { id, ids } = splitPK(nSt.node.key)
    const idp = ref(id) // id du parent - racine si idsp = 0
    const idsp = ref(ids)
    const grP = ref(null) // groupe de la note parente
    const avP = ref(null) // avatar de la note parente
    const noteP = ref(nSt.noteP)

    switch (nSt.node.type) {
      case 1: {
        type.value = 1
        if (aSt.exV1) er.value = 1
        avatar.value = aSt.getElt(nSt.note.id).avatar
        break
      }
      case 2: {
        type.value = 2
        groupe.value = gSt.egr(nSt.note.id).groupe
        er.value = erGr(0)
        break
      }
      case 4: {
        type.value = 4
        if (aSt.exV1) er.value = 1
        avatar.value = aSt.getElt(nSt.note.id).avatar
        avP.value = aSt.getElt(idp.value).avatar
        break
      }
      case 5: {
        type.value = 5
        groupe.value = gSt.egr(nSt.note.id).groupe
        er.value = erGr(0)
        grP.value = gSt.egr(idp.value).groupe
        break
      }
    }

    function erGr (dv) {
      const g = groupe.value
      if (!g.imh) return 5
      const eg = gSt.egr(g.id)
      if (eg.objv.vols.v1 + dv >= eg.objv.vols.q1 * UNITEV1) return 6
      return 0
    }

    return {
      ui, session, nSt, aSt, gSt,
      options, auteur, avatar, groupe, type, noteP, prot, er,
      MD
    }
  }

}
</script>

<style lang="sass" scoped>
@import '../css/app.sass'
.lg2
  width: 35rem
.mh
  max-height: 3.2rem
  width: 15rem
.bord1
  border: 1px solid $grey-5
  border-radius: 5px
.bord2
  border: 3px solid $warning
  border-radius: 5px
</style>
