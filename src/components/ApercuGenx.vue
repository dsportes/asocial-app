<template>
  <div :class="'row items-start ' + dkli(idx)">
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
          :label="$t('details')" @click="ouvrirdetails"/>
      </div>
      <show-html v-if="info" class="q-my-xs bord" :idx="idx" 
        zoom maxh="4rem" :texte="info"/>
      <div v-else class="text-italic">{{$t('FAnocv')}}</div>
      <q-btn v-if="!na.estComptable && cvchangee" class="q-my-xs" flat size="sm" :label="$t('CVedit')" 
        icon="edit" dense color="primary" @click="editerCV"/>
    </div>

    <!-- Dialogue d'édition de la carte de visite -->
    <q-dialog v-model="edition" persistent>
      <carte-visite :photo-init="photo" :info-init="info" :na="na" @ok="cvok"/>
    </q-dialog>
  </div>
</template>

<script>
import { ref } from 'vue'
import stores from '../stores/stores.mjs'
import ShowHtml from './ShowHtml.vue'
import CarteVisite from './CarteVisite.vue'
import { MD } from '../app/modele.mjs'

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

  components: { ShowHtml, CarteVisite },

  computed: {
    photo () { return this.cv && this.cv.photo ? this.cv.photo : this.na.defIcon },
    info () { return this.cv ? (this.cv.info || '') : '' },
    det () { return this.session.peopleId === this.na.id && MD.val('detailspeople') }
  },

  data () {
    return {
    }
  },

  methods: {
    dkli (idx) { return this.$q.dark.isActive ? (idx ? 'sombre' + (idx % 2) : 'sombre0') : (idx ? 'clair' + (idx % 2) : 'clair0') },
    async editerCV () { 
      if (!await this.session.edit()) return
      this.ovedition()
    },
    closeCV () { this.edition = false },
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

    return {
      MD, edition, ovedition,
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
