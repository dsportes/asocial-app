<template>
<div :class="dkli + ' bs dp50'">
<q-layout container view="hHh lpR fFf">
  <q-header elevated class="bg-secondary text-white">
    <q-toolbar>
      <q-btn dense size="md" color="warning" icon="close" @click="fermer"/>
      <q-toolbar-title v-if="!step" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit0')}}</q-toolbar-title>
      <q-toolbar-title v-if="step === 1" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit3')}}</q-toolbar-title>
      <q-toolbar-title v-if="step >= 2 && avatar" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit1', [avatar.na.nom])}}</q-toolbar-title>
      <q-toolbar-title v-if="step >= 2 && groupe" 
        class="titre-lg full-width text-center">{{$t('PNOnvtit2', [groupe.na.nomc])}}</q-toolbar-title>
      <q-btn dense size="md" color="primary" icon="check" :label="$t('valider')"
        :disable="step !== 3" @click="valider"/>
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
    <q-page class="q-pa-xs">
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

      <div v-if="er" class="column justify-center lg1 maauto q-my-lg q-mx-sm">
        <div class="titre-md q-my-lg q-mx-sm">{{$t('PNOer' + er, [erd])}}</div>
        <q-btn color="primary" flat :label="$t('jailu')" @click="MD.fD"/>
      </div>

      <div v-if="!er && step === 1" class="q-mt-lg q-pa-sm lg1 maauto bord2">
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

      <div v-if="!er && step === 3" class="column sp40">
        <editeur-md mh="50vh" class="col" texte="" :placeholder="$t('PNOdeft')"
          :lgmax="cfg.maxlgtextesecret" editable modetxt v-model="texte"/>
        <q-separator color="orange" class="q-mt-sm"/>

        <div class="col-auto q-pa-xs row items-start">
          <div class="col-6 titre-md" >
            <bouton-undo :cond="temp.value!==99999999" @click="temp=options[0]"/>
            <span>{{temp.value === 99999999 ? $t('PNOperm') : $t('PNOtemp', temp.value, { count: temp.value })}}</span>
          </div>
          <q-select class="col-6 mh titre-md" :label="$t('PNOtp')" v-model="temp" :options="options"
            transition-show="scale" transition-hide="scale" filled
            bg-color="secondary" color="white" />
        </div>
          
        <div class="col-auto q-mt-sm row">
          <bouton-undo :cond="prot===true" @click="prot=false"/>
          <q-toggle class=" titre-md" v-model="prot" :label="$t('PNOpr')" />
        </div>

        <div v-if="groupe" class="col-auto q-mt-sm row">
          <bouton-undo :cond="exclu===true" @click="exclu=false"/>
          <q-toggle class=" titre-md" v-model="exclu" :label="$t('PNOex')" />
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
import { ID, UNITEV1 } from '../app/api.mjs'
import { MD, getNg } from '../app/modele.mjs'
import { $t, splitPK } from '../app/util.mjs'
import BoutonHelp from '../components/BoutonHelp.vue'
import BoutonUndo from '../components/BoutonUndo.vue'
import EditeurMd from '../components/EditeurMd.vue'
import { NouvelleNote } from '../app/operations.mjs'

export default {
  name: 'NoteNouvelle',

  components: { BoutonHelp, BoutonUndo, EditeurMd },

  computed: {
    dkli () { return this.$q.dark.isActive ? 'sombre' : 'clair' },
    modifie () { return this.texte !== '' || (this.temp.value !== 99999999) ||
      this.prot || this.exclu }
  },

  watch: {
    step (ap) { this.autStep(ap) }
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

    fermer () { if (this.modifie) MD.oD('cf'); else MD.fD() },

    async valider () {
      // console.log(this.texte, this.prot, this.temp.value, this.exclu)
      let id = 0, idc = 0, ref = null, im = 0
      if (this.avatar) {
        id = this.avatar.id
        idc = this.session.compteId
      } else {
        id = this.groupe.id
        idc = this.groupe.idh
        im = this.mb.ids
      }

      let rnom = ''
      if (ID.estGroupe(this.idp)) { // note rattachée à une note de groupe ou un groupe
        const na = getNg(this.idp) // normalement le groupe "parent" est connu
        rnom = na ? na.nomc : ''
      }

      // note rattachée à une autre note OU note avatar rattachée à un groupe
      if (this.idsp !== 0 || this.idp !== id) {
        ref = [this.idp, this.idsp, rnom]
      }

      const key = await new NouvelleNote()
        .run(id, this.texte, im, this.temp.value, this.prot, this.exclu, ref, idc)

      this.nSt.setPreSelect(key)
      MD.fD()
    }
  },

  data () {
    return {
      temp: this.options[0], //permanent ou temporaire- nbj temp
      texte: '',
      prot: false,
      exclu: false
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
    const mb = ref(null)
    const step = ref(0)
    const la = ref(aSt.naAvatars)
    const naAut = ref(la.value[0])

    const { id, ids } = splitPK(nSt.node.key)
    const idp = ref(id) // id du parent - racine si ids = 0 - GROUPE ou AVATAR
    const idsp = ref(ids)
    const grP = ref(null) // groupe de la note parente
    const avP = ref(null) // avatar de la note parente
    if (idp.value) {
      if (ID.estGroupe(idp.value)) {
        grP.value = gSt.egr(idp.value).groupe
      } else {
        avP.value = aSt.getElt(idp.value).avatar
      }
    }

    const options = [
      { label: $t('permanent'), value: 99999999 },
      { label: $t('temp1'), value: 1 },
      { label: $t('temp7'), value: 7 },
      { label: $t('temp14'), value: 14 },
      { label: $t('temp30'), value: 30 },
      { label: $t('temp60'), value: 60 },
      { label: $t('temp90'), value: 90 }
    ]

    function autStep (ap) {
      if (ap !== 2) return
      const g = groupe.value
      if (!g) { // note d'avatar
        if (aSt.exV1) { er.value = 3; return } // excédent v1 / q1
      } else { // note de groupe
        if (g.pe === 1) { er.value = 4; return }
        if (!g.imh) { er.value = 5; return }
        const eg = gSt.egr(g.id)
        if (eg.objv.vols.v1 >= eg.objv.vols.q1 * UNITEV1) { er.value = 6; return }
        mb.value = gSt.membreDeId(eg, this.naAut.id)
        const st = g.ast[mb.value.ids]
        if (st < 31 || st > 32) { er.value = 7; return }
      }
      step.value = 3
    }

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
        step.value = 1
        break
      }
      case 3: { 
        er.value = 1
        erd.value = nSt.node.label
        break 
      }
      case 4: { 
        type.value = 4
        auteur.value = aSt.getElt(id)
        avatar.value = auteur.value.avatar
        step.value = 2
        break
      }
      case 5: { 
        type.value = 5
        step.value = 1
        break
      }
      case 6: 
      case 7: { 
        er.value = 2
        erd.value = nSt.node.label
        break
      }
    }

    autStep(step.value)

    return {
      ui, session, nSt, aSt, gSt, cfg, options,
      er, erd, la, naAut, type, step, idp, idsp, grP, avP,
      auteur, avatar, groupe, mb,
      MD, autStep
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
