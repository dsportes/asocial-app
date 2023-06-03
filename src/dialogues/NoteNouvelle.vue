<template>
<div :class="dkli + ' bs'" style="width:80vw">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="MD.fD"/>
      <q-toolbar-title v-if="!step" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit0')}}</q-toolbar-title>
      <q-toolbar-title v-if="step === 1" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit3')}}</q-toolbar-title>
      <q-toolbar-title v-if="step >= 2 && avatar" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="step >= 2 && groupe" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit2', [groupe.na.nomc])}}</q-toolbar-title>
      <bouton-help page="page1"/>
    </q-toolbar>
    <q-toolbar v-if="groupe" inset
      class="full-width bg-secondary text-white">
      <q-toolbar-title class="text-italic titre-md text-center">{{$t('PNOecr', [naAut.nom])}}</q-toolbar-title>
    </q-toolbar>
    <q-toolbar v-if="avatar && type === 2" inset
      class="full-width bg-secondary text-white">
      <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
      <q-toolbar-title class="text-italic text-bold titre-md">{{$t('PNOracgr', [grP.na.nomc])}}</q-toolbar-title>
    </q-toolbar>
  </q-header>

  <q-page-container>
    <q-page class="column">
      <div v-if="type === 4" class="q-ma-xs q-pa-xs bord1">
        <div class="titre-md">
           <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span>{{$t('PNOrav', [avP.na.nom])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{nSt.node.label}}</div>
      </div>
      <div v-if="type === 5" class="q-ma-xs q-pa-xs bord1">
        <div class="titre-md">
           <q-icon name="warning" color="warning" size="md" class="q-mr-sm"/>
          <span>{{$t('PNOrgr', [grP.na.nomc])}}</span>
        </div>
        <div class="q-ml-sm text-italic">{{nSt.node.label}}</div>
      </div>
      <q-separator v-if="type === 4 || type === 5" class="q-my-sm" color="orange"/>

      <div v-if="er" class="column justify-center lg30 maauto q-my-lg q-mx-sm">
        <div class="titre-md q-my-lg q-mx-sm">{{$t('PNOer' + er, [erd])}}</div>
        <q-btn color="primary" flat :label="$t('jailu')" @click="MD.fD"/>
      </div>

      <div v-if="!er && step === 1" class="q-mt-lg q-pa-sm lg30 maauto bord2">
        <div v-if="la.length === 1" class="titre-lg">{{$t('PNOaut1', [naAut.nom])}}</div>
        <div v-else class="titre-md">
          <q-btn no-caps flat :label="$t('PNOaut1', [naAut.nom])" icon-right="expand_more">
            <q-menu anchor="bottom left" self="top left" max-height="10rem" 
              max-width="20rem">
              <q-list class="bg-secondary text-white">
                <q-item v-for="na in la" :key="na.id" clickable 
                  v-close-popup @click="naAut = na">
                  <span class="fs-md">{{na.nom}}</span>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </div>
        <div class="q-my-sm column q-gutter-xs">
          <q-btn icon="check" no-caps :label="$t('PNOngr', [grP.na.nomc])"
            @click="selGr" color="primary"/>
          <q-btn icon="check" no-caps :label="$t('PNOnper', [naAut.nom])"
            @click="selAv" color="primary"/>
        </div>
      </div>

      <div v-if="!er && step === 3" class="q-pa-sm largeur40 ma-auto">
        <editeur-md style="height:50vh" :texte="$t('PNOdeft')"
          :lgmax="cfg.maxlgtextesecret" editable modetxt mode-value="texte"/>
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
import { afficherDiag, splitPK } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import EditeurMd from '../components/EditeurMd.vue'

export default {
  name: 'NoteNouvelle',

  components: { BoutonHelp, EditeurMd },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
  },

  watch: {
    step (ap) {
      if (ap !== 2) return
      const g = this.groupe
      if (!g) { // note d'avatar
        if (this.aSt.exV1) { this.er = 3; return } // excédent v1 / q1
      } else { // note de groupe
        if (g.pe === 1) { this.er = 4; return }
        if (!g.imh) { this.er = 5; return }
        const eg = this.gSt.egr(g.id)
        if (eg.objv.vols.v1 >= eg.objv.vols.q1) { this.er = 6; return }
        const m = this.gSt.membreDeId(eg, this.naAut.id)
        const st = g.ast[m.ids]
        if (st < 31 || st > 32) { this.er = 7; return }
      }
      this.step = 3
    }
  },

  methods: {
    selAv () {
      this.auteur = this.aSt.getElt(this.naAut.id)
      this.avatar = this.auteur.avatar
      this.groupe = null
      this.step = 2
    },
    selGr () {
      this.auteur = this.aSt.getElt(this.naAut.id)
      this.avatar = null
      this.groupe = this.gSt.egr(this.idp).groupe
      this.step = 2
    },

  },

  data () {
    return {
    }
  },

  setup () {
    const ui = stores.ui
    const session = stores.session
    const nSt = stores.note
    const aSt = stores.avatar
    const gSt = stores.groupe
    const cfg = stores.config

    const er = ref(0)
    const erd = ref('')
    const type = ref(0)
    const auteur = ref(null)
    const avatar = ref(null)
    const groupe = ref(null)
    const step = ref(0)
    const la = ref(aSt.naAvatars)
    const naAut = ref(la.value[0])

    const { id, ids } = splitPK(nSt.node.key)
    const idp = ref(id) // id du parent - racine si idsp = 0
    const idsp = ref(ids)
    const grP = ref(null) // groupe de la note parente
    const avP = ref(null) // avatar de la note parente

    switch (nSt.node.type) {
      case 1: { 
        type.value = 1
        auteur.value = aSt.getElt(id)
        avatar.value = auteur.value.avatar
        step.value = 2
        break
      }
      case 2: { 
        type.value = 2
        grP.value = gSt.egr(idp.value).groupe
        step.value = 1
        break
      }
      case 3: { er.value = 1; erd.value = nSt.node.label; break }
      case 4: { 
        type.value = 4
        auteur.value = aSt.getElt(id)
        avatar.value = auteur.value.avatar
        avP.value = aSt.getElt(idp.value).avatar
        step.value = 2
        break
      }
      case 5: { 
        type.value = 5
        grP.value = gSt.egr(idp.value).groupe
        step.value = 1
        break
      }
      case 6: 
      case 7: { er.value = 2; erd.value = nSt.node.label; break }
    }

    return {
      ui, session, nSt, aSt, gSt, cfg,
      er, erd, la, naAut, type, step, idp, idsp, grP, avP, auteur, avatar, groupe,
      MD
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
.lg30
  width: 20rem
</style>
