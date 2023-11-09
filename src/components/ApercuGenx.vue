<template>
  <div :class="'row items-start ' + (dkli(idx))">
    <div class="col-auto items-center q-mr-sm">
      <img class="photomax" :src="photo" />
    </div>
    <div class="col">
      <div class="row justify-between">
        <div>
          <span class="text-bold fs-md q-mr-sm">{{na.nomc}}</span> 
          <span v-if="estAvc" class="text-bold fs-md q-mr-sm">[{{$t('moi')}}]</span> 
          <span class="text-bold fs-sm font-mono q-mr-sm">#{{ids ? ids : na.id}}</span> 
        </div>
        <q-btn v-if="detailPeople && !det" dense size="sm" color="primary" icon="add"
          :label="$t('details')" @click.stop="ouvrirdetails"/>
      </div>
      <div class="row justify-between items-center">
        <div>
          <div v-if="info" class="text-bold">{{titre(info)}}</div>
          <div v-else class="text-italic">{{$t('FAnocv')}}</div>
        </div>
        <div>
          <q-btn v-if="cv" size="sm" 
            icon="visibility" dense color="primary" @click.stop="ovvisucv"/>
          <q-btn v-if="!ID.estComptable(na.id) && cvchangee" class="q-ml-xs" size="sm"
            icon="edit" dense color="warning" @click.stop="editerCV"/>
        </div>
      </div>
      <mc-memo :id="na.id" :idx="idx"/>        
    </div>

    <!-- Dialogue d'édition de la carte de visite -->
    <q-dialog v-model="edition" persistent>
      <carte-visite :photo-init="photo" :info-init="info" :na="na" @ok="cvok"/>
    </q-dialog>

    <!-- Dialogue d'affichage de la carte de visite -->
    <q-dialog v-model="visucv" persistent>
      <apercu-cv :na="na" :cv="cv"/>
    </q-dialog>

  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import CarteVisite from './CarteVisite.vue'
import ApercuCv from './ApercuCv.vue'
import McMemo from './McMemo.vue'
import { MD } from '../app/modele.mjs'
import { dkli, titre } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

export default {
  name: 'ApercuGenx',

  // <apercu-genx :na="na" :ids="ids" :cv="cv" :idx="idx" est-avc detail-people :cvchangee="cvchangee"/>
  props: { 
    na: Object, // na de la persone (people, avatar) ou du groupe 
    ids: Number, // pour un "membre" ids (indice) du membre à afficher
    cv: Object, // carte de visite
    estAvc: Boolean, // true si c'est un avatar du compte
    cvchangee: Function, // fonction d'enregistrement de la CV quand elle a été éditée
    detailPeople: Boolean, // bouton d'affichage du détail du people
    idx: Number
  },

  components: { CarteVisite, ApercuCv, McMemo },

  computed: {
    estGr () { return ID.estGroupe(this.na.id) },
    photo () { return this.cv && this.cv.photo ? this.cv.photo : this.na.defIcon },
    info () { return this.cv ? (this.cv.info || '') : '' },
    det () { return this.session.peopleId === this.na.id && MD.val('detailspeople') }
  },

  data () {
    return {
    }
  },

  methods: {
    async editerCV () { 
      if (!await this.session.edit()) return
      this.ovedition()
    },
    async cvok (res) {
      if (res && this.na) {
        await this.cvchangee(res)
      }
    },
    ouvrirdetails () {
      this.session.setPeopleId(this.na.id)
      MD.oD('detailspeople')
    }
  },

  setup () {
    const edition = ref(false)
    function ovedition () { MD.oD(edition) }
    const visucv = ref(false)
    function ovvisucv () { MD.oD(visucv) }

    return {
      MD, dkli, titre, ID, edition, ovedition, visucv, ovvisucv,
      ui: stores.ui,
      session: stores.session
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
</style>
