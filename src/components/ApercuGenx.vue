<template>
<div :class="dkli(idx)">
  <div class="q-pa-xs row items-start">
    <div class="col-auto items-center q-mr-sm column">
      <img class="photomax" :src="cv.photo" />
    </div>
    <div class="col">
      <div class="row">
        <div class="col">
          <span class="text-bold titre-lg q-mr-sm">{{cv.nomC}}</span> 
          <span v-if="estAvc" class="fs-md q-mr-sm">[{{$t('moi')}}]</span> 
          <span v-if="del && !ID.estComptable(id)" class="fs-md q-mr-sm">[{{$t('delegue')}}]</span> 
          <span class="fs-sm font-mono q-mr-sm">{{'#' + id}}</span> 
          <span v-if="im" class="fs-sm font-mono q-mr-sm">{{'[' + im + ']'}}</span> 
        </div>
        <btn-cond class="col-auto" v-if="!ID.estComptable(id)"
          icon="zoom_in" round stop @ok="ovcv"/>
      </div>
      <div v-if="cv.texte" class="titre-md">{{titre(cv.texte)}}</div>

      <mc-memo v-if="!ID.estComptable(id)" :id="id" :idx="idx"/>     

      <div class="row">
        <div class="col">
          <div v-if="chats.length" class="row q-gutter-sm">
            <span class="text-italic titre-md">{{$t('CAVtit')}}</span>
            <span v-for="e in chats" :key="e.id" class="fs-md bord">{{e.nom}}</span>
          </div>

          <div v-if="groupes.size" class="row q-gutter-sm">
            <span class="text-italic titre-md">{{$t('CAVmb')}}</span>
            <span v-for="idg in groupes" :key="idg" class="fs-md bord">{{session.getCV(idg).nomC}}</span>
          </div>
        </div>
        <btn-cond class="col-auto self-start" v-if="!nodet && !estAvc && !estGroupe && !det" size="sm"
            icon="open_in_new" :label="$t('detail')" stop @ok="ouvrirdetails"/>
      </div>
    </div>
  </div>
  <!--q-separator color="orange" size="1px"/-->

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
    im: Number, // pour un membre pour l'afficher
    nodet: Boolean, // true si le panel de détail ne peut PAS être ouvert
    idx: Number
  },

  components: { BtnCond, McMemo, ApercuCv },

  computed: {
    chats () { return this.aSt.chatsDuCompte(this.id, true) },
    groupes () { return this.pSt.getSgr(this.id) },
    estGroupe () { return ID.estGroupe(this.id) },
    estAvc () { return this.session.compte.mav.has(this.id) },

    cv () { return this.session.getCV(this.id) },

    // true si le panel de détail est déjà ouvert
    det () { return this.session.peopleId === this.id && this.ui.estOuvert('detailspeople') },

    // Peut être choisi pour devenir contact du groupe courant
    diagC () { return this.gSt.diagContact(this.id) }
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
    },
    async select () {
      this.ui.selectContact(this.id)
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
.bord
  border: 1px solid $grey-5
  border-radius: 5px
  padding: 0px
</style>
