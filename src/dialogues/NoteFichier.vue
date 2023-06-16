<template>
<div :class="dkli + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="avatar" 
        class="titre-lg full-width text-center">{{$t('PNOedtit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="groupe" 
        class="titre-lg full-width text-center">{{$t('PNOedtit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        @click="valider"/>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="groupe" inset
      class="full-width bg-secondary text-white">
      <q-toolbar-title class="text-italic titre-md text-center">{{$t('PNOecr', [ednom])}}</q-toolbar-title>
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

      <div v-if="ims && ims.length > 1" class="q-my-sm q-pa-xs row bord2">
        <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
        <q-select class="titre-md mh" :label="$t('PNOchaut')" v-model="imx" :options="ims"
          transition-show="scale" transition-hide="scale" />
      </div>

      <div v-if="er" class="titre-md text-bold text-negative bg-yellow-5 q-pa-xs q-mt-sm">
        {{er}}</div>
      
      <div class="sp40 column">
        <editeur-md class="col" :texte="nSt.note.txt" mh="65vh"
          :lgmax="cfg.maxlgtextesecret" editable modetxt v-model="texte"/>
        <q-separator color="orange" class="q-mt-sm"/>
        <div v-if="nSt.note.auts.length" class="col-auto q-mt-sm">
          {{$t('PNOauts', nSt.note.auts.length) + ' ' + nomAuts}}
        </div>
      
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
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import { MD } from '../app/modele.mjs'
import { afficherDiag, splitPK } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import { MajNote } from '../app/operations.mjs'
import EditeurMd from '../components/EditeurMd.vue'
import { UNITEV1 } from '../app/api.mjs'

export default {
  name: 'NoteFichier',

  components: { BoutonHelp, BoutonUndo, EditeurMd },

  props: { ims: Array },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    nomAuts () {
      const ln = []
      this.nSt.mbAuteurs.forEach(m => { ln.push(m.na.nomc)})
      return ln.join(', ')
    },
    modifie () { return this.nSt.note.txt !== this.texte ||
      (this.prot ? 1 : 0) !== this.nSt.note.p }
  },

  watch: {
    imx (ap, av) { this.ednom = ap.label; this.im = ap.value }
  },

  methods: {
    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },
    async valider () {
      const dv = this.texte.length - this.nSt.note.txt.length
      if (this.er && dv > 0) {
        await afficherDiag($t('PNOw' + this.er))
        return
      }
      if (this.type === 5) {
        const n = this.erGr(dv)
        if (n === 6) {
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
      await new MajNote()
        .run(n.id, n.ids, this.im, n.auts, this.texte, this.prot, idc)
      MD.fD()
    }
  },

  data () {
    return {
      texte: '',
    }
  },

  setup (props) {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const cfg = stores.config

    const type = ref(0)
    const ims = toRef(props, 'ims')
    const im = ref(ims.value ? ims.value[0].value : 0)
    const ednom = ref(ims.value ? ims.value[0].label : '')
    const imx = ref(ims.value ? ims.value[0] : null)
    const prot = ref(nSt.note.p ? true : false)

    const er = ref(0)

    const avatar = ref(null)
    const groupe = ref(null)

    const { id, ids } = splitPK(nSt.node.note.refk)
    const idp = ref(id) // id du parent - racine si idsp = 0
    const grP = ref(null) // groupe de la note parente
    const avP = ref(null) // avatar de la note parente
    const nodeP = ref(idp.value ? nSt.nodeP : null)

    switch (nSt.node.type) {
      case 4: {
        type.value = 4
        if (aSt.exV1) er.value = 1
        avatar.value = aSt.getElt(nSt.note.id).avatar
        if (idp.value) avP.value = aSt.getElt(idp.value).avatar
        break
      }
      case 5: {
        type.value = 5
        groupe.value = gSt.egr(nSt.note.id).groupe
        er.value = erGr(0)
        if (idp.value) grP.value = gSt.egr(idp.value).groupe
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
      ui, session, nSt, aSt, gSt, cfg,
      imx, im, ednom, avatar, groupe, type, nodeP, prot, er, avP, grP,
      MD, erGr
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
