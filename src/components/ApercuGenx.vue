<template>
<div :class="(dkli(idx))">
  <div class="q-pa-xs row items-start">
    <div class="col-auto items-center q-mr-sm column">
      <img class="photomax" :src="photo" />
      <q-btn size="sm" icon="zoom_in" dense color="primary" @click.stop="ovvisucv"/>
    </div>
    <div class="col">
      <div class="row">
        <div class="col">
          <span class="text-bold titre-lg q-mr-sm">{{na.nomc}}</span> 
          <span v-if="estAvc" class="fs-md q-mr-sm">[{{$t('moi')}}]</span> 
          <span class="fs-sm font-mono q-mr-sm">
            {{'#' + id + (im ? ' ['+ im + ']': '')}}</span> 
        </div>
        <q-btn class="col-auto" v-if="!estAvc && !estGroupe && !det" 
          dense size="md" color="primary" icon="open_in_new"
          :label="$t('page')" @click.stop="ouvrirdetails"/>
      </div>
      <div v-if="info" class="titre-md">{{titre(info)}} ...</div>
      <mc-memo :id="id" :idx="idx"/>        
    </div>
  </div>
  <q-separator color="orange" size="1px"/>

  <!-- Dialogue d'affichage de la carte de visite -->
  <q-dialog v-model="visucv" persistent>
    <apercu-cv :id="id"/>
  </q-dialog>

</div>
</template>

<script>
import { ref, toRef } from 'vue'
import stores from '../stores/stores.mjs'
import ApercuCv from './ApercuCv.vue'
import McMemo from './McMemo.vue'
import { MD, getNg } from '../app/modele.mjs'
import { dkli, titre } from '../app/util.mjs'
import { ID } from '../app/api.mjs'

export default {
  name: 'ApercuGenx',

  props: { 
    id: Number,
    im: Number,
    idx: Number
  },

  components: { ApercuCv, McMemo },

  computed: {
    estGr () { return ID.estGroupe(this.na.id) },
    photo () { return this.cv && this.cv.photo ? this.cv.photo : this.na.defIcon },
    info () { return this.cv ? (this.cv.info || '') : '' },
    det () { return this.session.peopleId === this.id && MD.val('detailspeople') }
  },

  data () {
    return {
    }
  },

  methods: {
    ouvrirdetails () {
      this.session.setPeopleId(this.id)
      MD.oD('detailspeople')
    }
  },

  setup (props) {
    const session = stores.session
    const aSt = stores.avatar
    const gSt = stores.groupe
    const pSt = stores.people

    const agp = ref() // un avatar, un groupe ou un people

    const id = toRef(props, 'id')
    const na = ref(getNg(id))
    const cv = ref()

    const estGroupe = ID.estGroupe(id.value)
    const estAvc = ref(false)
    const estAnim = ref(false)

    function initGr () {
      const eg = gSt.egr(id.value)
      estAnim.value = eg.estAnim
      agp.value = eg.groupe
      na.value = agp.value.na
      cv.value = agp.value.cv
    }

    function initAv() {
      agp.value = aSt.getAvatar(id.value)
      na.value = agp.value.na
      cv.value = agp.value.cv
    }

    function initPe() {
      agp.value = pSt.getPeople(id.value)
      na.value = agp.value.na
      cv.value = agp.value.cv
    }

    if (estGroupe) {
      initGr()
      gSt.$onAction(({ name, args, after }) => {
        after((result) => {
          if (name === 'setGroupe' && args[0].id === id.value) initGr()
        })
      })
    } else {
      estAvc.value = aSt.compte.estAvDuCompte(id.value)
      if (estAvc.value){
        initAv()
        aSt.$onAction(({ name, args, after }) => {
          after((result) => {
            if (name === 'setAvatar' && args[0].id === id.value) initAv()
          })
        })
      } else {
        initPe()
        pSt.$onAction(({ name, args, after }) => {
          after((result) => {
            if (name === 'setPeople' && args[0].id === id.value) initPe()
          })
        })
      }
    }

    const visucv = ref(false)
    function ovvisucv () { MD.oD(visucv) }

    return {
      MD, dkli, titre, ID, visucv, ovvisucv, agp, na, cv, estAvc, estGroupe,
      session
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
