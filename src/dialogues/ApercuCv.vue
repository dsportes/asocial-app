<template>
  <q-card :class="styp('sm') + 'column'">
    <q-toolbar class="col-auto bg-secondary text-white">
      <btn-cond color="warning" icon="close" @click="ui.fD"/>
      <q-toolbar-title> 
        <span class="titre-lg">{{estAvc ? cv.nom : cv.nomC}}</span> 
        <span v-if="estAvc" class="titre-md q-ml-md">[{{$t('moi')}}]</span>
      </q-toolbar-title>
      <btn-cond v-if="net" round icon="refresh" 
        cond="cVisu" @ok="refresh"/>
      <btn-cond v-if="(estAvc || estGroupe) && diag === ''" icon="edit" cond="cEdit"
        :label="$t('editer')" @ok="ovcved"/>
    </q-toolbar>
    <q-toolbar inset v-if="diag !== ''" class="bg-yellow-5 text-bold text-black titre-md">
      {{diag}}
    </q-toolbar>

    <div class="row q-pa-xs">
      <img class="col-auto q-mr-sm photomax" :src="cv.photo" />
      <show-html class="col border1" zoom scroll maxh="15rem" :texte="cv.tx"/>
    </div>

    <!-- Dialogue d'édition de la carte de visite -->
    <carte-visite v-model="ui.d.CVedition" :cv="cv"/>

  </q-card>
</template>

<script>
import stores from '../stores/stores.mjs'
import { GetCv } from '../app/operations4.mjs'
import { ID } from '../app/api.mjs'
import { styp } from '../app/util.mjs'

import ShowHtml from '../components/ShowHtml.vue'
import CarteVisite from '../dialogues/CarteVisite.vue'
import BtnCond from '../components/BtnCond.vue'

export default {
  name: 'ApercuCv',

  props: {
    cv: Object
  },

  components: { BtnCond, ShowHtml, CarteVisite },

  computed: {
    lidk () { return !this.$q.dark.isActive ? 'sombre0' : 'clair0' },

    id () { return ID.long(this.cv.id, this.session.ns) },
    estGroupe () { return ID.estGroupe(this.id) },
    estAvc () { return this.estGroupe ? false : this.session.compte.mav.has(this.id) },
    diag () {
      if (this.estGroupe) {
        const g = this.gSt.groupe(this.id)
        if (!g || !g.estAdmin) return this.$t('FAcvgr')
      } else {
        if (!this.estAvc) return this.$t('FAcvav')
      }
      return ''
    }
  },

  data () {
    return {
    }
  },

  methods: {
    ovcved () {
      this.ui.oD('CVedition')
    },

    async refresh () {
      const x = await new GetCv().run(this.id)
      if (x) cv = x
    }

  },

  setup () {
    const session = stores.session
    const ui = stores.ui
    const gSt = stores.groupe
    
    return {
      styp, session, ui, ID, gSt,
      net: session.accesNet
    }
  }
}
</script>
<style lang="sass" scoped>
@import '../css/app.sass'
.border1
  border: 1px solid $grey-5
  padding: 3px
  border-radius: 5px
</style>
