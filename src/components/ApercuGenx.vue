<template>
<div :class="dkli(idx)">
  <div class="q-pa-xs row items-start">
    <div class="col-auto items-center q-mr-sm column">
      <img class="photomax" :src="cv.photo" />
      <btn-cond v-if="!ID.estComptable(id)" class="q-mt-xs"
        icon="zoom_in" round stop @ok="ovcv"/>
    </div>
    <div class="col">
      <div class="row">
        <div class="col">
          <span class="text-bold titre-lg q-mr-sm">{{cv.nomc}}</span> 
          <span v-if="estAvc" class="fs-md q-mr-sm">[{{$t('moi')}}]</span> 
          <span v-if="del && !ID.estComptable(id)" class="fs-md q-mr-sm">[{{$t('delegue')}}]</span> 
          <span class="fs-sm font-mono q-mr-sm">{{'#' + id}}</span> 
        </div>
        <btn-cond class="col-auto" v-if="!estAvc && !estGroupe && !det" 
          icon="open_in_new" :label="$t('page')" stop @ok="ouvrirdetails"/>
      </div>
      <div v-if="cv.texte" class="titre-md">{{titre(cv.texte)}}</div>
      <mc-memo v-if="!ID.estComptable(id)" :id="id" :idx="idx"/>        
    </div>
  </div>
  <q-separator color="orange" size="1px"/>

  <q-dialog v-model="ui.d.ACVouvrir[idc]" persistent>
    <apercu-cv :cv="cv"/>
  </q-dialog>
</div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuCv from '../dialogues/ApercuCv.vue'
import BtnCond from './BtnCond.vue'
import { dkli, titre } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

// Niveau 4
import McMemo from './McMemo.vue'

export default {
  name: 'ApercuGenx',

  props: { 
    id: Number, // id du groupe, avatar du compte ou contact
    del: Boolean, // true si délégué, pour l'afficher
    idx: Number
  },

  components: { BtnCond, McMemo, ApercuCv },

  computed: {
    estGroupe () { return ID.estGroupe(this.id) },
    estAvc () { return this.session.compte.mav.has(this.id) },
    eg () { return this.estGroupe ? this.gSt.egr(this.id) : null },
    agp () { 
      if (this.estGroupe) return this.eg.groupe
      if (this.estAvc) return this.aSt.getAvatar(this.id)
      return this.pSt.getPeople(this.id)
    },
    estAnim () { return this.estGroupe ? this.eg.estAnim : false },
    cv () { return this.session.getCV(this.id) },
    
    info () { return this.cv ? (this.cv.info || '') : '' },
    det () { return this.session.peopleId === this.id && this.ui.estOuvert('detailspeople') }
  },

  data () {
    return {
    }
  },

  methods: {
    ovcv () {
      this.ui.oD('ACVouvrir', this.idc)
    },
    ouvrirdetails () {
      this.session.setPeopleId(this.id)
      this.ui.oD('detailspeople')
    }
  },

  setup () {
    const ui = stores.ui
    const idc =  ref(ui.getIdc())
    return {
      dkli, titre, ID, 
      aSt: stores.avatar, 
      gSt: stores.groupe, 
      pSt: stores.people, 
      session: stores.session, 
      ui, idc
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.bord
  border-top: 1px solid $grey-5
.q-btn
  padding: 1px !important
.b1
  border: 1px solid $yellow-5
</style>
