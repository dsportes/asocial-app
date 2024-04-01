<template>
<div :class="dkli(idx)">
  <div class="q-pa-xs row items-start">
    <div class="col-auto items-center q-mr-sm column">
      <img class="photomax" :src="cv.photo" />
      <q-btn v-if="!ID.estComptable(id)" class="q-mt-xs"
        size="md" icon="zoom_in" dense color="primary" padding="none" round
        @click.stop="ovcv"/>
    </div>
    <div class="col">
      <div class="row">
        <div class="col">
          <span class="text-bold titre-lg q-mr-sm">{{cv.nomc}}</span> 
          <span v-if="estAvc" class="fs-md q-mr-sm">[{{$t('moi')}}]</span> 
          <span v-if="del" class="fs-md q-mr-sm">[{{$t('delegue')}}]</span> 
          <span class="fs-sm font-mono q-mr-sm">
            {{'#' + id + (del ? ' ['+ im + ']': '')}}</span> 
        </div>
        <q-btn class="col-auto" v-if="!estAvc && !estGroupe && !det" 
          dense size="md" color="primary" icon="open_in_new"
          :label="$t('page')" @click.stop="ouvrirdetails"/>
      </div>
      <div v-if="cv.texte" class="titre-md">{{titre(cv.texte)}} ...</div>
      <mc-memo :id="id" :idx="idx"/>        
    </div>
  </div>
  <q-separator color="orange" size="1px"/>

</div>
</template>

<script>
import stores from '../stores/stores.mjs'
import { dkli, titre } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

// Niveau 4
import McMemo from './McMemo.vue'

export default {
  name: 'ApercuGenx',

  props: { 
    id: Number, // id du groupe, avatar du compte ou contact
    im: Number, // si c'est un membre d'un groupe, son im pour l'afficher
    del: Boolean, // true si délégué, pour l'afficher
    idx: Number
  },

  components: { McMemo },

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
    cv () { return this.pSt.getCV(this.id) },
    
    info () { return this.cv ? (this.cv.info || '') : '' },
    det () { return this.session.peopleId === this.id && this.ui.estOuvert('detailspeople') }
  },

  data () {
    return {
    }
  },

  methods: {
    ovcv () {
      this.ui.cveditionId = this.id 
      this.ui.oD('ACVouvrir')
    },
    ouvrirdetails () {
      this.session.setPeopleId(this.id)
      this.ui.oD('detailspeople')
    }
  },

  setup () {
    return {
      dkli, titre, ID, 
      aSt: stores.avatar, 
      gSt: stores.groupe, 
      pSt: stores.people, 
      session: stores.session, 
      ui: stores.ui
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
